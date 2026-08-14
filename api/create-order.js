// api/create-order.js
// Production-ready order creation endpoint with Stripe PaymentIntent integration
// Deployed as Vercel Serverless Function

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { CreateOrderSchema, formatValidationError } = require('../lib/validation');
const logger = require('../lib/logger');
const RateLimiter = require('../lib/rate-limit');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const DEFAULT_DELIVERY_FEE = Number(process.env.DEFAULT_DELIVERY_FEE || 3.5);
const CURRENCY = process.env.CURRENCY || 'eur';

// Validate environment setup
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Missing Supabase environment variables');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY not set - Stripe payments will not work');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { enabled: false }
});

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const orderRateLimiter = new RateLimiter();

/**
 * Security headers middleware
 */
function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
}

module.exports = async function (req, res) {
  setSecurityHeaders(res);

  // Rate limiting
  const rateLimitKey = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const maxOrdersPerMinute = Number(process.env.RATE_LIMIT_ORDERS_PER_MINUTE || 10);
  const rateLimitCheck = orderRateLimiter.check(rateLimitKey, maxOrdersPerMinute, 60000);

  if (!rateLimitCheck.allowed) {
    logger.warn('Order creation rate limit exceeded', { ip: rateLimitKey, retryAfter: rateLimitCheck.retryAfter });
    res.setHeader('Retry-After', rateLimitCheck.retryAfter);
    return res.status(429).json({
      error: 'Too many order requests. Please try again later.',
      retryAfter: rateLimitCheck.retryAfter
    });
  }

  // Method validation
  if (req.method !== 'POST') {
    logger.debug('Invalid HTTP method', { method: req.method });
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = req.body;

    // Input validation using Zod
    const validationResult = CreateOrderSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Order validation failed', { errors: validationResult.error.errors });
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    const { cart, customer, address, payment_method, user_id, promo_code } = validationResult.data;

    // Compute totals server-side (never trust client totals)
    let subtotal = 0;
    for (const item of cart) {
      const itemPrice = Number(item.unit_price || 0);
      const itemQty = Number(item.quantity || 1);
      subtotal += itemPrice * itemQty;
    }

    const delivery_fee = DEFAULT_DELIVERY_FEE;
    let discount = 0;

    // Validate promo code if provided
    if (promo_code) {
      const { data: promoData, error: promoError } = await supabaseAdmin
        .from('promos')
        .select('discount_percent, discount_amount, active')
        .eq('code', promo_code)
        .eq('active', true)
        .single();

      if (!promoError && promoData) {
        if (promoData.discount_percent) {
          discount = Math.min(subtotal * (promoData.discount_percent / 100), subtotal);
        } else if (promoData.discount_amount) {
          discount = Math.min(promoData.discount_amount, subtotal);
        }
      }
    }

    const total = Math.max(0, subtotal + delivery_fee - discount);

    logger.info('Processing order', {
      subtotal,
      delivery_fee,
      discount,
      total,
      payment_method,
      items_count: cart.length
    });

    // Create order in Supabase
    const orderPayload = {
      user_id: user_id || null,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      address: JSON.stringify(address),
      subtotal,
      delivery_fee,
      discount,
      total,
      payment_method,
      payment_status: payment_method === 'Cash' ? 'cod_pending' : 'pending',
      status: 'created',
      created_at: new Date().toISOString()
    };

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([orderPayload])
      .select('id')
      .single();

    if (orderError) {
      logger.error('Failed to create order in Supabase', { error: orderError.message });
      return res.status(500).json({ error: 'Failed to create order' });
    }

    const orderId = orderData.id;
    logger.info('Order created', { order_id: orderId });

    // Insert order items
    const orderItems = cart.map(item => ({
      order_id: orderId,
      menu_item_id: item.menu_item_id || null,
      name: item.name,
      unit_price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      options: item.options ? JSON.stringify(item.options) : null
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsError) {
      logger.error('Failed to insert order items', { error: itemsError.message, order_id: orderId });
      // Rollback: mark order as failed
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId);
      return res.status(500).json({ error: 'Failed to save order items' });
    }

    logger.info('Order items inserted', { order_id: orderId, item_count: orderItems.length });

    // Handle card payment
    if (payment_method === 'Card') {
      if (!stripe) {
        logger.error('Stripe not configured');
        return res.status(500).json({ error: 'Payment processing not available' });
      }

      try {
        const amountCents = Math.round(total * 100);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: CURRENCY,
          metadata: {
            order_id: orderId.toString(),
            customer_email: customer.email
          },
          description: `Marhaba Order #${orderId}`,
          automatic_payment_methods: {
            enabled: true
          }
        });

        // Store payment intent ID in order
        await supabaseAdmin
          .from('orders')
          .update({
            external_payment_id: paymentIntent.id,
            payment_status: 'payment_intent_created'
          })
          .eq('id', orderId);

        logger.info('Stripe PaymentIntent created', {
          order_id: orderId,
          payment_intent_id: paymentIntent.id
        });

        return res.status(200).json({
          success: true,
          orderId,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: amountCents,
          currency: CURRENCY
        });
      } catch (stripeError) {
        logger.error('Stripe PaymentIntent creation failed', {
          error: stripeError.message,
          order_id: orderId
        });
        await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId);
        return res.status(500).json({
          error: 'Payment processing failed',
          message: 'Please try again or contact support.'
        });
      }
    }

    // Handle Cash on Delivery
    if (payment_method === 'Cash') {
      logger.info('Cash on Delivery order created', { order_id: orderId });
      return res.status(201).json({
        success: true,
        orderId,
        message: 'Order created successfully. Payment due on delivery.',
        paymentMethod: 'Cash'
      });
    }

    return res.status(200).json({
      success: true,
      orderId,
      message: 'Order created successfully'
    });
  } catch (err) {
    logger.error('Unexpected error in create-order', { error: err.message, stack: err.stack });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
};

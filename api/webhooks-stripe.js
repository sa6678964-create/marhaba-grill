// api/webhooks-stripe.js
// Stripe webhook handler with signature verification and idempotency
// Deployed as Vercel Serverless Function

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../lib/logger');
const idempotencyStore = require('../lib/idempotency');
const RateLimiter = require('../lib/rate-limit');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_WEBHOOK_SECRET) {
  logger.error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { enabled: false }
});

const webhookRateLimiter = new RateLimiter();

/**
 * Verify Stripe webhook signature
 */
function verifyWebhookSignature(body, signature) {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }
    return stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.warn('Webhook signature verification failed', { error: error.message });
    return null;
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(event) {
  const paymentIntent = event.data.object;
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    logger.warn('PaymentIntent succeeded but no order_id in metadata', {
      payment_intent_id: paymentIntent.id
    });
    return { success: false, reason: 'Missing order_id' };
  }

  logger.info('Processing payment_intent.succeeded', {
    order_id: orderId,
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount
  });

  // Update order status
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'succeeded',
      status: 'confirmed',
      external_payment_id: paymentIntent.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    logger.error('Failed to update order after payment success', {
      error: updateError.message,
      order_id: orderId
    });
    return { success: false, reason: 'Database update failed' };
  }

  logger.info('Order confirmed after payment', { order_id: orderId });
  return { success: true };
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(event) {
  const paymentIntent = event.data.object;
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    logger.warn('PaymentIntent failed but no order_id in metadata', {
      payment_intent_id: paymentIntent.id
    });
    return { success: false, reason: 'Missing order_id' };
  }

  logger.info('Processing payment_intent.payment_failed', {
    order_id: orderId,
    payment_intent_id: paymentIntent.id,
    last_payment_error: paymentIntent.last_payment_error?.message
  });

  // Update order status
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'failed',
      status: 'failed',
      external_payment_id: paymentIntent.id,
      error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    logger.error('Failed to update order after payment failure', {
      error: updateError.message,
      order_id: orderId
    });
    return { success: false, reason: 'Database update failed' };
  }

  logger.info('Order marked as failed after payment error', { order_id: orderId });
  return { success: true };
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(event) {
  const charge = event.data.object;
  const paymentIntentId = charge.payment_intent;

  logger.info('Processing charge.refunded', {
    payment_intent_id: paymentIntentId,
    charge_id: charge.id,
    refund_amount: charge.amount_refunded
  });

  // Find order by payment intent ID
  const { data: orderData, error: selectError } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('external_payment_id', paymentIntentId)
    .single();

  if (selectError || !orderData) {
    logger.warn('Could not find order for refunded payment', {
      payment_intent_id: paymentIntentId
    });
    return { success: false, reason: 'Order not found' };
  }

  // Update order status
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'refunded',
      status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderData.id);

  if (updateError) {
    logger.error('Failed to update order after refund', {
      error: updateError.message,
      order_id: orderData.id
    });
    return { success: false, reason: 'Database update failed' };
  }

  logger.info('Order marked as refunded', { order_id: orderData.id });
  return { success: true };
}

module.exports = async function (req, res) {
  // Security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Rate limiting
  const rateLimitKey = 'stripe-webhook';
  const maxWebhooksPerMinute = Number(process.env.RATE_LIMIT_WEBHOOK_PER_MINUTE || 100);
  const rateLimitCheck = webhookRateLimiter.check(rateLimitKey, maxWebhooksPerMinute, 60000);

  if (!rateLimitCheck.allowed) {
    logger.warn('Webhook rate limit exceeded', { retryAfter: rateLimitCheck.retryAfter });
    res.setHeader('Retry-After', rateLimitCheck.retryAfter);
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      logger.warn('Missing Stripe signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Reconstruct raw body for signature verification
    let rawBody = req.body;
    if (typeof rawBody !== 'string') {
      rawBody = JSON.stringify(rawBody);
    }

    // Verify signature
    const event = verifyWebhookSignature(rawBody, signature);
    if (!event) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    logger.info('Webhook received', { event_type: event.type, event_id: event.id });

    // Idempotency check
    if (idempotencyStore.has(event.id)) {
      logger.info('Duplicate webhook event detected', { event_id: event.id });
      return res.status(200).json({ received: true, duplicate: true });
    }

    let result = { success: false };

    // Route to appropriate handler
    switch (event.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        result = await handlePaymentIntentFailed(event);
        break;

      case 'charge.refunded':
        result = await handleChargeRefunded(event);
        break;

      default:
        logger.debug('Unhandled webhook event type', { event_type: event.type });
        result = { success: true, handled: false };
    }

    // Store in idempotency cache
    idempotencyStore.set(event.id, result);

    return res.status(200).json({ received: true, processed: result.success });
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

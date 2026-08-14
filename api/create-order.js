// api/create-order.js
// Vercel-compatible serverless function for creating orders and initiating payments (Stripe PaymentIntent)

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase server env vars. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { enabled: false }
});

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method Not Allowed' });

  try {
    const body = req.body;
    // Basic validation — for production use a robust schema validator (zod/joi)
    const { cart, user_id, customer, payment_method, address, promo_code } = body || {};
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is required' });
    }

    // Compute totals server-side (do not trust client totals)
    const subtotal = cart.reduce((s, it) => s + (Number(it.unit_price || it.price || 0) * Number(it.quantity || 1)), 0);
    const delivery_fee = Number(process.env.DEFAULT_DELIVERY_FEE || 3.5);
    // promo handling should be validated against promos table
    const total = subtotal + delivery_fee; // simplified

    // Create order in Supabase
    const orderPayload = {
      user_id: user_id || null,
      customer_name: customer?.name || null,
      customer_email: customer?.email || null,
      customer_phone: customer?.phone || null,
      address: address || null,
      subtotal,
      delivery_fee,
      discount: 0,
      total,
      payment_method: payment_method || 'card',
      payment_status: payment_method === 'Cash' ? 'cod_pending' : 'pending',
      status: 'created'
    };

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([orderPayload])
      .select('id')
      .single();

    if (orderError) {
      console.error('Supabase order insert error', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    const orderId = orderData.id;

    // Insert order items
    const orderItems = cart.map(it => ({
      order_id: orderId,
      menu_item_id: it.menu_item_id || null,
      name: it.name,
      unit_price: Number(it.unit_price || it.price || 0),
      quantity: Number(it.quantity || 1),
      options: it.options ? JSON.stringify(it.options) : null
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('Supabase order_items insert error', itemsError);
      // Attempt to rollback: mark order as failed
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId);
      return res.status(500).json({ error: 'Failed to save order items' });
    }

    // If payment method is card -> create Stripe PaymentIntent and return client_secret
    if (payment_method === 'Card' || payment_method === 'Card') {
      if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

      const amountCents = Math.round(total * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: process.env.CURRENCY || 'eur',
        metadata: { order_id: orderId.toString() },
        description: `Marhaba Order ${orderId}`
      });

      // Persist external payment id to order
      await supabaseAdmin.from('orders').update({ external_payment_id: paymentIntent.id }).eq('id', orderId);

      return res.status(200).json({ orderId, client_secret: paymentIntent.client_secret, payment_intent: paymentIntent.id });
    }

    // For Cash on Delivery, return orderId only
    return res.status(200).json({ orderId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

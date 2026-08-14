// api/webhooks/stripe.js
// Stripe webhook handler: verifies signature, ensures idempotency, and updates order status in Supabase

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { realtime: { enabled: false } });
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// Vercel / serverless: need raw body for signature verification. Use a middleware or configure to get raw body.
module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method Not Allowed' });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // raw body must be available for constructEvent; Vercel provides it via req.body as a buffer when configured.
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency guard: check webhook_logs table for event.id
  try {
    const { data: existing } = await supabaseAdmin.from('webhook_logs').select('id').eq('event_id', event.id).limit(1);
    if (existing && existing.length > 0) {
      console.log('Duplicate event received, ignoring', event.id);
      return res.json({ received: true });
    }

    // Store webhook raw payload
    await supabaseAdmin.from('webhook_logs').insert([{ event_id: event.id, type: event.type, payload: event }]);
  } catch (err) {
    console.error('Failed to log webhook event:', err);
    // proceed — do not block processing if logging fails
  }

  // Handle relevant event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const externalId = pi.id;
        // find order by external_payment_id
        const { data: orders } = await supabaseAdmin.from('orders').select('*').eq('external_payment_id', externalId).limit(1);
        if (orders && orders.length > 0) {
          const order = orders[0];
          await supabaseAdmin.from('orders').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', order.id);
          await supabaseAdmin.from('payments_log').insert([{ event_id: event.id, external_id: externalId, status: 'succeeded', raw: pi }]);
        } else {
          console.warn('Order not found for external_payment_id', externalId);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const externalId = pi.id;
        const { data: orders } = await supabaseAdmin.from('orders').select('*').eq('external_payment_id', externalId).limit(1);
        if (orders && orders.length > 0) {
          const order = orders[0];
          await supabaseAdmin.from('orders').update({ payment_status: 'failed', status: 'payment_failed' }).eq('id', order.id);
          await supabaseAdmin.from('payments_log').insert([{ event_id: event.id, external_id: externalId, status: 'failed', raw: pi }]);
        }
        break;
      }
      case 'charge.refunded': {
        // handle refund logic if needed
        await supabaseAdmin.from('payments_log').insert([{ event_id: event.id, external_id: event.data.object.id, status: 'refunded', raw: event.data.object }]);
        break;
      }
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).send('Internal processing error');
  }

  res.json({ received: true });
};

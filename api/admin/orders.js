// api/admin/orders.js
// Protected admin endpoint for viewing and managing orders
// Requires valid JWT authentication

const { createClient } = require('@supabase/supabase-js');
const { UpdateOrderStatusSchema, formatValidationError } = require('../../lib/validation');
const { adminAuthMiddleware } = require('../../lib/auth');
const logger = require('../../lib/logger');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { enabled: false }
});

/**
 * Security headers
 */
function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
}

/**
 * GET /api/admin/orders - List all orders with pagination
 */
async function handleGetOrders(req, res, admin) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const status = req.query.status; // Optional filter
    const offset = (page - 1) * limit;

    logger.info('Admin fetching orders', {
      admin_id: admin.admin_id,
      page,
      limit,
      status_filter: status
    });

    let query = supabaseAdmin
      .from('orders')
      .select('id, customer_name, customer_email, total, status, payment_status, created_at', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch orders', { error: error.message, admin_id: admin.admin_id });
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    logger.error('Unexpected error fetching orders', {
      error: err.message,
      admin_id: admin.admin_id
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/orders/:orderId - Get order details
 */
async function handleGetOrderDetails(req, res, admin) {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    logger.info('Admin fetching order details', {
      admin_id: admin.admin_id,
      order_id: orderId
    });

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      logger.warn('Order not found', { order_id: orderId, admin_id: admin.admin_id });
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      logger.error('Failed to fetch order items', {
        error: itemsError.message,
        order_id: orderId
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items: items || [],
        address: order.address ? JSON.parse(order.address) : null
      }
    });
  } catch (err) {
    logger.error('Unexpected error fetching order details', {
      error: err.message,
      admin_id: admin.admin_id
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/orders/:orderId - Update order status
 */
async function handleUpdateOrder(req, res, admin) {
  try {
    const { orderId } = req.query;
    const { status, notes } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Validate status
    const validationResult = UpdateOrderStatusSchema.safeParse({ status, notes });
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    logger.info('Admin updating order', {
      admin_id: admin.admin_id,
      order_id: orderId,
      new_status: status
    });

    // Update order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      logger.error('Failed to update order', {
        error: updateError.message,
        order_id: orderId,
        admin_id: admin.admin_id
      });
      return res.status(500).json({ error: 'Failed to update order' });
    }

    // Log admin action
    await supabaseAdmin.from('admin_logs').insert([
      {
        admin_id: admin.admin_id,
        action: 'update_order',
        details: { order_id: orderId, new_status: status },
        timestamp: new Date().toISOString()
      }
    ]);

    logger.info('Order updated successfully', {
      order_id: orderId,
      admin_id: admin.admin_id,
      new_status: status
    });

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order_id: orderId,
      new_status: status
    });
  } catch (err) {
    logger.error('Unexpected error updating order', {
      error: err.message,
      admin_id: admin.admin_id
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = async function (req, res) {
  setSecurityHeaders(res);

  // Check if method is supported
  if (!['GET', 'PUT'].includes(req.method)) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Apply authentication middleware
  return new Promise((resolve) => {
    const next = async () => {
      const admin = req.admin;

      if (req.method === 'GET') {
        if (req.query.orderId) {
          resolve(await handleGetOrderDetails(req, res, admin));
        } else {
          resolve(await handleGetOrders(req, res, admin));
        }
      } else if (req.method === 'PUT') {
        resolve(await handleUpdateOrder(req, res, admin));
      }
    };

    // Manually apply auth middleware
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const { verifyToken } = require('../../lib/auth');
    const result = verifyToken(token);

    if (!result.valid) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.admin = result.payload;
    next().then(resolve);
  });
};

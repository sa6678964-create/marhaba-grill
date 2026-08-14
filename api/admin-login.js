// api/admin-login.js
// Secure admin authentication endpoint
// Returns JWT token for admin operations

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { AdminLoginSchema, formatValidationError } = require('../lib/validation');
const { generateToken } = require('../lib/auth');
const logger = require('../lib/logger');

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

module.exports = async function (req, res) {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { username, password } = req.body || {};

    // Input validation
    const validationResult = AdminLoginSchema.safeParse({ username, password });
    if (!validationResult.success) {
      logger.warn('Admin login validation failed', {
        errors: validationResult.error.errors,
        username
      });
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    logger.info('Admin login attempt', { username });

    // Fetch admin user from database
    const { data: adminData, error: selectError } = await supabaseAdmin
      .from('admins')
      .select('id, username, password_hash, role, active')
      .eq('username', username)
      .eq('active', true)
      .single();

    if (selectError || !adminData) {
      logger.warn('Admin login failed - user not found or inactive', { username });
      // Use generic message to prevent username enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, adminData.password_hash);
    if (!passwordMatch) {
      logger.warn('Admin login failed - incorrect password', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const tokenResult = generateToken(
      {
        admin_id: adminData.id,
        username: adminData.username,
        role: adminData.role
      },
      '8h' // Token expires in 8 hours
    );

    if (!tokenResult.success) {
      logger.error('Failed to generate JWT token', { error: tokenResult.error, username });
      return res.status(500).json({ error: 'Authentication failed' });
    }

    logger.info('Admin login successful', {
      admin_id: adminData.id,
      username,
      role: adminData.role
    });

    // Log login event
    await supabaseAdmin.from('admin_logs').insert([
      {
        admin_id: adminData.id,
        action: 'login',
        details: { username },
        timestamp: new Date().toISOString()
      }
    ]);

    return res.status(200).json({
      success: true,
      token: tokenResult.token,
      expiresIn: '8h',
      admin: {
        id: adminData.id,
        username: adminData.username,
        role: adminData.role
      }
    });
  } catch (err) {
    logger.error('Unexpected error in admin-login', { error: err.message, stack: err.stack });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
};

// api/admin/login.js
// Simple admin login route that validates credentials and returns a JWT (for admin console use only)

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me-in-prod';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { realtime: { enabled: false } });

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method Not Allowed' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });

  const { data, error } = await supabaseAdmin.from('admins').select('*').eq('username', username).limit(1).single();
  if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, data.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: data.id, username: data.username, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
};

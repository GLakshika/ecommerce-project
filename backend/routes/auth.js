const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getConnection } = require('../config/database');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

// ========================
// Customer Signup
// POST /api/auth/signup/customer
// ========================
router.post('/signup/customer', validateRegistration, async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone_no, address, zip_code } = req.body;
    const pool = getConnection();

    // Check if email already exists
    const [existing] = await pool.execute(
      'SELECT customer_id FROM Customer WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert customer
    const [result] = await pool.execute(
      `INSERT INTO Customer 
        (first_name, last_name, email, password_hash, phone_no, address, zip_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, password_hash, phone_no || null, address || null, zip_code || null]
    );

    const customerId = result.insertId;

    // Create JWT
    const token = jwt.sign(
      { userId: customerId, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      user: {
        id: customerId,
        name: `${first_name} ${last_name}`,
        email,
        role: 'customer'
      }
    });

  } catch (error) {
    console.error('Customer signup error:', error);
    res.status(500).json({ 
      error: 'Signup failed', 
      message: error.message  // Show real DB error in dev
    });
  }
});

// ========================
// Customer Login
// POST /api/auth/login/customer
// ========================
router.post('/login/customer', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = getConnection();

    const [customers] = await pool.execute(
      'SELECT customer_id, first_name, last_name, email, password_hash FROM Customer WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const customer = customers[0];

    // Verify password
    const match = await bcrypt.compare(password, customer.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: customer.customer_id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: customer.customer_id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        role: 'customer'
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: error.message
    });
  }
});

// ========================
// Admin Login (with hashed password)
// POST /api/auth/login/admin
// ========================
router.post('/login/admin', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = getConnection();

    const [admins] = await pool.execute(
      'SELECT admin_id, name, email, password FROM Admin WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];

    // If admin passwords are hashed
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: admin.admin_id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: error.message
    });
  }
});

// ========================
// Test route
// ========================
router.get('/check', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

module.exports = router;

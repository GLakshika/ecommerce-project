const express = require('express');
const { getConnection } = require('../config/database');
const { validateProduct, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// ==================== PRODUCT MANAGEMENT ====================

// Create new product with variants
router.post('/products', validateProduct, async (req, res) => {
  try {
    const { product_name, description, category_id, variants } = req.body;
    const pool = getConnection();

    // Create product
    const [result] = await pool.execute(
      'INSERT INTO Product (product_name, description, category_id) VALUES (?, ?, ?)',
      [product_name, description || null, category_id || null]
    );

    const productId = result.insertId;

    // Add variants if provided
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await pool.execute(
          `INSERT INTO ProductVariant 
          (product_id, SKU, size, color, price, stock_quantity) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [productId, variant.SKU, variant.size || null, variant.color || null, variant.price || 0, variant.stock_quantity || 0]
        );
      }
    }

    res.status(201).json({ message: 'Product created successfully', product_id: productId });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Product creation failed', message: error.message });
  }
});

// Update product
router.put('/products/:id', validateId, validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, description, category_id } = req.body;
    const pool = getConnection();

    const [existing] = await pool.execute('SELECT * FROM Product WHERE product_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await pool.execute(
      'UPDATE Product SET product_name = ?, description = ?, category_id = ? WHERE product_id = ?',
      [product_name, description || null, category_id || null, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Product update failed', message: error.message });
  }
});

// Delete product
router.delete('/products/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    const [existing] = await pool.execute('SELECT * FROM Product WHERE product_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product (variants will be removed due to foreign key cascade if set)
    await pool.execute('DELETE FROM Product WHERE product_id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Product deletion failed', message: error.message });
  }
});

// ==================== VARIANT / INVENTORY MANAGEMENT ====================

// Update variant stock
router.put('/variants/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity, price } = req.body;
    const pool = getConnection();

    const [variant] = await pool.execute('SELECT * FROM ProductVariant WHERE variant_id = ?', [id]);
    if (variant.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await pool.execute(
      'UPDATE ProductVariant SET stock_quantity = ?, price = ? WHERE variant_id = ?',
      [stock_quantity ?? variant[0].stock_quantity, price ?? variant[0].price, id]
    );

    res.json({ message: 'Variant updated successfully' });
  } catch (error) {
    console.error('Variant update error:', error);
    res.status(500).json({ error: 'Variant update failed', message: error.message });
  }
});

// Low stock variants
router.get('/variants/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const pool = getConnection();

    const [variants] = await pool.execute(`
      SELECT pv.*, p.product_name, c.category_name
      FROM ProductVariant pv
      JOIN Product p ON pv.product_id = p.product_id
      LEFT JOIN Category c ON p.category_id = c.category_id
      WHERE pv.stock_quantity <= ?
      ORDER BY pv.stock_quantity ASC
    `, [threshold]);

    res.json({ threshold, low_stock_variants: variants });
  } catch (error) {
    console.error('Low stock fetch error:', error);
    res.status(500).json({ error: 'Low stock fetch failed', message: error.message });
  }
});

// ==================== CATEGORY MANAGEMENT ====================

// Create category
router.post('/categories', async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const pool = getConnection();

    const [result] = await pool.execute(
      'INSERT INTO Category (category_name, description) VALUES (?, ?)',
      [category_name, description || null]
    );

    res.status(201).json({ message: 'Category created successfully', category_id: result.insertId });
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: 'Category creation failed', message: error.message });
  }
});

// ==================== ORDER MANAGEMENT ====================

// Get all orders
router.get('/orders', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pool = getConnection();
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (status) {
      whereClause = 'WHERE o.status = ?';
      params.push(status);
    }

    const [orders] = await pool.execute(`
      SELECT o.*, c.first_name, c.last_name, c.email, COUNT(oi.order_item_id) as item_count
      FROM \`Order\` o
      JOIN Customer c ON o.customer_id = c.customer_id
      LEFT JOIN OrderItem oi ON o.order_id = oi.order_id
      ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    res.json({ page: parseInt(page), limit: parseInt(limit), orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Orders fetch failed', message: error.message });
  }
});

// Update order status
router.put('/orders/:id/status', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pool = getConnection();

    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [orders] = await pool.execute('SELECT * FROM `Order` WHERE order_id = ?', [id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

    await pool.execute('UPDATE `Order` SET status = ? WHERE order_id = ?', [status, id]);

    res.json({ message: 'Order status updated', order_id: id, new_status: status });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Order status update failed', message: error.message });
  }
});

module.exports = router;

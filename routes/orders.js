const express = require('express');
const { getConnection } = require('../config/database');
const { validateOrder, validateId } = require('../middleware/validation');
const { authenticateToken, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Authentication for all order routes
router.use(authenticateToken);
router.use(requireCustomer);

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BB-${timestamp}-${random}`;
};

// Delivery estimate
const calculateDeliveryEstimate = (deliveryMethod, isMainCity = true, hasStock = true) => {
  if (deliveryMethod === 'store_pickup') return 1;
  let baseDays = isMainCity ? 5 : 7;
  if (!hasStock) baseDays += 3;
  return baseDays;
};

// Get user's orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pool = getConnection();
    const offset = (page - 1) * limit;

    let whereConditions = ['o.customer_id = ?'];
    let params = [req.user.id];

    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }

    const [orders] = await pool.execute(`
      SELECT 
        o.order_id,
        o.amount,
        o.status,
        o.order_date,
        o.delivery_method,
        o.payment_method,
        COUNT(oi.order_item_id) as item_count
      FROM \`Order\` o
      LEFT JOIN OrderItem oi ON o.order_id = oi.order_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM \`Order\` o
      WHERE ${whereConditions.join(' AND ')}
    `, params);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Orders fetch failed', message: error.message });
  }
});

// Get order by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    const [orders] = await pool.execute(`
      SELECT *
      FROM \`Order\` o
      WHERE o.order_id = ? AND o.customer_id = ?
    `, [id, req.user.id]);

    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orders[0];

    const [items] = await pool.execute(`
      SELECT 
        oi.order_item_id,
        oi.quantity,
        oi.price,
        pv.variant_id,
        pv.SKU,
        pv.size,
        pv.color,
        pv.price as base_price,
        p.product_id,
        p.product_name
      FROM OrderItem oi
      JOIN ProductVariant pv ON oi.variant_id = pv.variant_id
      JOIN Product p ON pv.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);

    res.json({ order: { ...order, items } });

  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Order fetch failed', message: error.message });
  }
});

// Create new order
router.post('/', validateOrder, async (req, res) => {
  const connection = await getConnection().getConnection();
  try {
    await connection.beginTransaction();
    const { delivery_method, payment_method } = req.body;
    const pool = getConnection();

    // Get cart items
    const [cartItems] = await pool.execute(`
      SELECT 
        c.cart_item_id,
        c.quantity,
        pv.variant_id,
        pv.stock_quantity,
        pv.price as unit_price,
        p.product_id,
        p.product_name
      FROM CartItem c
      JOIN ProductVariant pv ON c.variant_id = pv.variant_id
      JOIN Product p ON pv.product_id = p.product_id
      WHERE c.cart_id IN (SELECT cart_id FROM Cart WHERE customer_id = ?)
    `, [req.user.id]);

    if (!cartItems.length) return res.status(400).json({ error: 'Empty cart' });

    const outOfStock = cartItems.filter(i => i.stock_quantity < i.quantity);
    if (outOfStock.length)
      return res.status(400).json({ error: 'Insufficient stock', out_of_stock_items: outOfStock.map(i => i.product_name) });

    const totalAmount = cartItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const orderNumber = generateOrderNumber();
    const deliveryEstimateDays = calculateDeliveryEstimate(delivery_method, true, true);

    const [orderResult] = await connection.execute(`
      INSERT INTO \`Order\` (customer_id, amount, status, order_date, delivery_method, payment_method)
      VALUES (?, ?, 'pending', NOW(), ?, ?)
    `, [req.user.id, totalAmount, delivery_method, payment_method]);

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await connection.execute(`
        INSERT INTO OrderItem (order_id, variant_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.variant_id, item.quantity, item.unit_price]);

      await connection.execute(`
        UPDATE ProductVariant SET stock_quantity = stock_quantity - ?
        WHERE variant_id = ?
      `, [item.quantity, item.variant_id]);
    }

    await connection.execute(`DELETE FROM CartItem WHERE cart_id IN (SELECT cart_id FROM Cart WHERE customer_id = ?)`, [req.user.id]);

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully', order_id: orderId });

  } catch (error) {
    await connection.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Order creation failed', message: error.message });
  } finally {
    connection.release();
  }
});

// Cancel order
router.put('/:id/cancel', validateId, async (req, res) => {
  const connection = await getConnection().getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [orders] = await connection.execute(`
      SELECT order_id, status FROM \`Order\`
      WHERE order_id = ? AND customer_id = ?
    `, [id, req.user.id]);

    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    if (orders[0].status !== 'pending') return res.status(400).json({ error: 'Cannot cancel non-pending order' });

    await connection.execute(`UPDATE \`Order\` SET status='cancelled' WHERE order_id=?`, [id]);

    const [items] = await connection.execute(`SELECT variant_id, quantity FROM OrderItem WHERE order_id=?`, [id]);
    for (const item of items) {
      await connection.execute(`UPDATE ProductVariant SET stock_quantity = stock_quantity + ? WHERE variant_id=?`, [item.quantity, item.variant_id]);
    }

    await connection.commit();
    res.json({ message: 'Order cancelled successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Order cancellation failed', message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;

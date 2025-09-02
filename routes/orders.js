const express = require('express');
const { getConnection } = require('../config/database');
const { validateOrder, validateId } = require('../middleware/validation');
const { authenticateToken, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all order routes
router.use(authenticateToken);
router.use(requireCustomer);

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BB-${timestamp}-${random}`;
};

// Calculate delivery estimate
const calculateDeliveryEstimate = (deliveryMethod, isMainCity = true, hasStock = true) => {
  if (deliveryMethod === 'store_pickup') {
    return 1; // Same day pickup
  }

  let baseDays = isMainCity ? 5 : 7;
  if (!hasStock) {
    baseDays += 3; // Add 3 days if out of stock
  }

  return baseDays;
};

// Get user's orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pool = getConnection();
    const offset = (page - 1) * limit;

    let whereConditions = ['o.user_id = ?'];
    let params = [req.user.id];

    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }

    // Get orders with items count
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.delivery_method,
        o.payment_method,
        o.status,
        o.delivery_estimate_days,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM orders o
      WHERE ${whereConditions.join(' AND ')}
    `, params);

    const total = countResult[0].total;

    res.json({
      orders: orders.map(order => ({
        ...order,
        total_amount: parseFloat(order.total_amount),
        delivery_estimate_days: parseInt(order.delivery_estimate_days)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      error: 'Orders fetch failed',
      message: 'Something went wrong while fetching orders'
    });
  }
});

// Get order by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    // Get order details
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.user_id = ?
    `, [id, req.user.id]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }

    const order = orders[0];

    // Get order items
    const [orderItems] = await pool.execute(`
      SELECT 
        oi.id,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.images,
        pv.variant_name,
        pv.variant_value
      FROM order_items oi
      JOIN product_variants pv ON oi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    // Format response
    const formattedOrder = {
      ...order,
      total_amount: parseFloat(order.total_amount),
      delivery_estimate_days: parseInt(order.delivery_estimate_days),
      customer: {
        name: `${order.first_name} ${order.last_name}`,
        email: order.email,
        phone: order.phone
      },
      items: orderItems.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price),
        images: item.images ? JSON.parse(item.images) : []
      }))
    };

    res.json({
      order: formattedOrder
    });

  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      error: 'Order fetch failed',
      message: 'Something went wrong while fetching order details'
    });
  }
});

// Create new order (checkout)
router.post('/', validateOrder, async (req, res) => {
  const connection = await getConnection().getConnection();
  
  try {
    await connection.beginTransaction();

    const { delivery_method, payment_method, shipping_address } = req.body;
    const pool = getConnection();

    // Get cart items
    const [cartItems] = await pool.execute(`
      SELECT 
        c.id as cart_id,
        c.quantity,
        pv.id as variant_id,
        pv.stock_quantity,
        pv.price_adjustment,
        p.id as product_id,
        p.name as product_name,
        p.price as base_price,
        (p.price + pv.price_adjustment) as unit_price
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: 'Empty cart',
        message: 'Cannot place order with empty cart'
      });
    }

    // Validate stock availability
    const outOfStockItems = cartItems.filter(item => item.stock_quantity < item.quantity);
    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: 'Some items in your cart are out of stock',
        out_of_stock_items: outOfStockItems.map(item => item.product_name)
      });
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price) * item.quantity);
    }, 0);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Calculate delivery estimate (simplified - assumes main city and in stock)
    const deliveryEstimateDays = calculateDeliveryEstimate(delivery_method, true, true);

    // Create order
    const [orderResult] = await connection.execute(`
      INSERT INTO orders (
        order_number, user_id, total_amount, delivery_method, 
        payment_method, shipping_address, delivery_estimate_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [orderNumber, req.user.id, totalAmount, delivery_method, payment_method, shipping_address || null, deliveryEstimateDays]);

    const orderId = orderResult.insertId;

    // Create order items and update inventory
    for (const item of cartItems) {
      // Create order item
      await connection.execute(`
        INSERT INTO order_items (
          order_id, product_variant_id, quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?)
      `, [orderId, item.variant_id, item.quantity, item.unit_price, item.unit_price * item.quantity]);

      // Update inventory (atomic operation)
      await connection.execute(`
        UPDATE product_variants 
        SET stock_quantity = stock_quantity - ? 
        WHERE id = ?
      `, [item.quantity, item.variant_id]);
    }

    // Clear cart
    await connection.execute('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    await connection.commit();

    // Get created order
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        ...orders[0],
        total_amount: parseFloat(orders[0].total_amount),
        delivery_estimate_days: parseInt(orders[0].delivery_estimate_days)
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({
      error: 'Order creation failed',
      message: 'Something went wrong while placing order'
    });
  } finally {
    connection.release();
  }
});

// Cancel order (if status is pending)
router.put('/:id/cancel', validateId, async (req, res) => {
  const connection = await getConnection().getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const pool = getConnection();

    // Check if order exists and belongs to user
    const [orders] = await pool.execute(`
      SELECT id, status, order_number
      FROM orders
      WHERE id = ? AND user_id = ?
    `, [id, req.user.id]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }

    const order = orders[0];

    if (order.status !== 'pending') {
      return res.status(400).json({
        error: 'Cannot cancel order',
        message: 'Only pending orders can be cancelled'
      });
    }

    // Update order status
    await connection.execute(`
      UPDATE orders SET status = 'cancelled' WHERE id = ?
    `, [id]);

    // Restore inventory
    const [orderItems] = await pool.execute(`
      SELECT product_variant_id, quantity
      FROM order_items
      WHERE order_id = ?
    `, [id]);

    for (const item of orderItems) {
      await connection.execute(`
        UPDATE product_variants 
        SET stock_quantity = stock_quantity + ? 
        WHERE id = ?
      `, [item.quantity, item.product_variant_id]);
    }

    await connection.commit();

    res.json({
      message: 'Order cancelled successfully',
      order_number: order.order_number
    });

  } catch (error) {
    await connection.rollback();
    console.error('Order cancellation error:', error);
    res.status(500).json({
      error: 'Order cancellation failed',
      message: 'Something went wrong while cancelling order'
    });
  } finally {
    connection.release();
  }
});

// Get delivery estimate
router.post('/delivery-estimate', async (req, res) => {
  try {
    const { delivery_method, city_type = 'main' } = req.body;
    const pool = getConnection();

    // Get cart items to check stock
    const [cartItems] = await pool.execute(`
      SELECT 
        pv.stock_quantity,
        c.quantity
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: 'Empty cart',
        message: 'Cannot estimate delivery for empty cart'
      });
    }

    // Check if all items are in stock
    const hasStock = cartItems.every(item => item.stock_quantity >= item.quantity);
    const isMainCity = city_type === 'main';

    const deliveryDays = calculateDeliveryEstimate(delivery_method, isMainCity, hasStock);

    res.json({
      delivery_estimate: {
        days: deliveryDays,
        method: delivery_method,
        city_type,
        has_stock: hasStock
      }
    });

  } catch (error) {
    console.error('Delivery estimate error:', error);
    res.status(500).json({
      error: 'Delivery estimate failed',
      message: 'Something went wrong while calculating delivery estimate'
    });
  }
});

module.exports = router;

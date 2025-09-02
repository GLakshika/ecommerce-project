const express = require('express');
const { getConnection } = require('../config/database');
const { validateProduct, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// ==================== PRODUCT MANAGEMENT ====================

// Create new product
router.post('/products', validateProduct, async (req, res) => {
  try {
    const { sku, name, description, price, weight, category_id, images, variants } = req.body;
    const pool = getConnection();

    // Check if SKU already exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    );

    if (existingProducts.length > 0) {
      return res.status(400).json({
        error: 'SKU already exists',
        message: 'A product with this SKU already exists'
      });
    }

    // Create product
    const [result] = await pool.execute(`
      INSERT INTO products (sku, name, description, price, weight, category_id, images)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [sku, name, description, price, weight || null, category_id || null, JSON.stringify(images || [])]);

    const productId = result.insertId;

    // Create variants if provided
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await pool.execute(`
          INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, stock_quantity)
          VALUES (?, ?, ?, ?, ?)
        `, [productId, variant.name, variant.value, variant.price_adjustment || 0, variant.stock_quantity || 0]);
      }
    }

    // Get created product
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        ...products[0],
        images: JSON.parse(products[0].images || '[]')
      }
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      error: 'Product creation failed',
      message: 'Something went wrong while creating product'
    });
  }
});

// Update product
router.put('/products/:id', validateId, validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, description, price, weight, category_id, images } = req.body;
    const pool = getConnection();

    // Check if product exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    // Check if SKU is being changed and if it already exists
    if (sku) {
      const [skuCheck] = await pool.execute(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [sku, id]
      );

      if (skuCheck.length > 0) {
        return res.status(400).json({
          error: 'SKU already exists',
          message: 'A product with this SKU already exists'
        });
      }
    }

    // Update product
    await pool.execute(`
      UPDATE products 
      SET sku = ?, name = ?, description = ?, price = ?, weight = ?, category_id = ?, images = ?
      WHERE id = ?
    `, [sku, name, description, price, weight || null, category_id || null, JSON.stringify(images || []), id]);

    res.json({
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({
      error: 'Product update failed',
      message: 'Something went wrong while updating product'
    });
  }
});

// Delete product
router.delete('/products/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    // Check if product exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    // Delete product (cascades to variants and reviews)
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({
      error: 'Product deletion failed',
      message: 'Something went wrong while deleting product'
    });
  }
});

// ==================== INVENTORY MANAGEMENT ====================

// Update product variant stock
router.put('/inventory/variants/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;
    const pool = getConnection();

    if (stock_quantity < 0) {
      return res.status(400).json({
        error: 'Invalid stock quantity',
        message: 'Stock quantity cannot be negative'
      });
    }

    // Check if variant exists
    const [variants] = await pool.execute(`
      SELECT pv.*, p.name as product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.id = ?
    `, [id]);

    if (variants.length === 0) {
      return res.status(404).json({
        error: 'Product variant not found',
        message: 'The requested product variant does not exist'
      });
    }

    // Update stock
    await pool.execute(
      'UPDATE product_variants SET stock_quantity = ? WHERE id = ?',
      [stock_quantity, id]
    );

    res.json({
      message: 'Stock updated successfully',
      variant: {
        ...variants[0],
        stock_quantity: parseInt(stock_quantity)
      }
    });

  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({
      error: 'Stock update failed',
      message: 'Something went wrong while updating stock'
    });
  }
});

// Get low stock products
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const pool = getConnection();

    const [products] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        pv.id as variant_id,
        pv.variant_name,
        pv.variant_value,
        pv.stock_quantity,
        c.name as category_name
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pv.stock_quantity <= ?
      ORDER BY pv.stock_quantity ASC
    `, [threshold]);

    res.json({
      low_stock_products: products,
      threshold: parseInt(threshold)
    });

  } catch (error) {
    console.error('Low stock fetch error:', error);
    res.status(500).json({
      error: 'Low stock fetch failed',
      message: 'Something went wrong while fetching low stock products'
    });
  }
});

// ==================== ORDER MANAGEMENT ====================

// Get all orders (admin view)
router.get('/orders', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, delivery_method } = req.query;
    const pool = getConnection();
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let params = [];

    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }

    if (delivery_method) {
      whereConditions.push('o.delivery_method = ?');
      params.push(delivery_method);
    }

    // Get orders
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
        u.first_name,
        u.last_name,
        u.email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
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
        delivery_estimate_days: parseInt(order.delivery_estimate_days),
        customer_name: `${order.first_name} ${order.last_name}`
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

// Update order status
router.put('/orders/:id/status', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pool = getConnection();

    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: pending, confirmed, shipped, delivered, cancelled'
      });
    }

    // Check if order exists
    const [orders] = await pool.execute(
      'SELECT id, order_number, status FROM orders WHERE id = ?',
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }

    // Update status
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      message: 'Order status updated successfully',
      order_number: orders[0].order_number,
      new_status: status
    });

  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({
      error: 'Order status update failed',
      message: 'Something went wrong while updating order status'
    });
  }
});

// ==================== REPORTING ====================

// Quarterly sales report
router.get('/reports/quarterly-sales', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const pool = getConnection();

    const [quarterlyData] = await pool.execute(`
      SELECT 
        QUARTER(o.created_at) as quarter,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as average_order_value
      FROM orders o
      WHERE YEAR(o.created_at) = ? AND o.status != 'cancelled'
      GROUP BY QUARTER(o.created_at)
      ORDER BY quarter
    `, [year]);

    // Calculate totals
    const totalOrders = quarterlyData.reduce((sum, q) => sum + q.order_count, 0);
    const totalRevenue = quarterlyData.reduce((sum, q) => sum + parseFloat(q.total_revenue), 0);

    res.json({
      year: parseInt(year),
      quarterly_data: quarterlyData.map(q => ({
        quarter: q.quarter,
        order_count: q.order_count,
        total_revenue: parseFloat(q.total_revenue),
        average_order_value: parseFloat(q.average_order_value)
      })),
      summary: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0
      }
    });

  } catch (error) {
    console.error('Quarterly sales report error:', error);
    res.status(500).json({
      error: 'Quarterly sales report failed',
      message: 'Something went wrong while generating quarterly sales report'
    });
  }
});

// Product performance report
router.get('/reports/product-performance', async (req, res) => {
  try {
    const { limit = 10, period = '30' } = req.query;
    const pool = getConnection();

    const [productPerformance] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        c.name as category_name,
        COUNT(oi.id) as units_sold,
        SUM(oi.total_price) as revenue,
        AVG(oi.unit_price) as average_price,
        pv.stock_quantity as current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.product_variant_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE (o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) OR o.created_at IS NULL)
        AND (o.status != 'cancelled' OR o.status IS NULL)
      GROUP BY p.id
      ORDER BY units_sold DESC, revenue DESC
      LIMIT ?
    `, [period, limit]);

    res.json({
      period_days: parseInt(period),
      product_performance: productPerformance.map(p => ({
        ...p,
        units_sold: parseInt(p.units_sold),
        revenue: parseFloat(p.revenue || 0),
        average_price: parseFloat(p.average_price || 0),
        current_stock: parseInt(p.current_stock || 0)
      }))
    });

  } catch (error) {
    console.error('Product performance report error:', error);
    res.status(500).json({
      error: 'Product performance report failed',
      message: 'Something went wrong while generating product performance report'
    });
  }
});

// Sales insights dashboard
router.get('/reports/sales-insights', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const pool = getConnection();

    // Get overall sales metrics
    const [salesMetrics] = await pool.execute(`
      SELECT 
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as average_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.status != 'cancelled'
    `, [period]);

    // Get top selling categories
    const [topCategories] = await pool.execute(`
      SELECT 
        c.name as category_name,
        COUNT(oi.id) as units_sold,
        SUM(oi.total_price) as revenue
      FROM categories c
      JOIN products p ON c.id = p.category_id
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN order_items oi ON pv.id = oi.product_variant_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY revenue DESC
      LIMIT 5
    `, [period]);

    // Get order status distribution
    const [statusDistribution] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY status
    `, [period]);

    res.json({
      period_days: parseInt(period),
      sales_metrics: {
        total_orders: salesMetrics[0]?.total_orders || 0,
        total_revenue: parseFloat(salesMetrics[0]?.total_revenue || 0),
        average_order_value: parseFloat(salesMetrics[0]?.average_order_value || 0),
        unique_customers: salesMetrics[0]?.unique_customers || 0
      },
      top_categories: topCategories.map(c => ({
        ...c,
        units_sold: parseInt(c.units_sold),
        revenue: parseFloat(c.revenue)
      })),
      status_distribution: statusDistribution.map(s => ({
        status: s.status,
        count: parseInt(s.count)
      }))
    });

  } catch (error) {
    console.error('Sales insights error:', error);
    res.status(500).json({
      error: 'Sales insights failed',
      message: 'Something went wrong while generating sales insights'
    });
  }
});

// ==================== CATEGORY MANAGEMENT ====================

// Create category
router.post('/categories', async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;
    const pool = getConnection();

    const [result] = await pool.execute(`
      INSERT INTO categories (name, description, parent_id)
      VALUES (?, ?, ?)
    `, [name, description || null, parent_id || null]);

    res.status(201).json({
      message: 'Category created successfully',
      category_id: result.insertId
    });

  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({
      error: 'Category creation failed',
      message: 'Something went wrong while creating category'
    });
  }
});

module.exports = router;

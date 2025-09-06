const express = require('express');
const { getConnection } = require('../config/database');
const { validatePagination, validateId } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET all products with pagination, filtering, sorting
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category_id,
      search,
      min_price,
      max_price,
      sort_by = 'product_id',
      sort_order = 'DESC',
      in_stock_only = false
    } = req.query;

    const pool = getConnection();
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereConditions = ['1=1'];
    const params = [];

    if (category_id) {
      whereConditions.push('p.category_id = ?');
      params.push(category_id);
    }

    if (search) {
      whereConditions.push('(p.product_name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (min_price) {
      whereConditions.push('pv.price >= ?');
      params.push(min_price);
    }

    if (max_price) {
      whereConditions.push('pv.price <= ?');
      params.push(max_price);
    }

    if (in_stock_only === 'true') {
      whereConditions.push('pv.stock_quantity > 0');
    }

    const allowedSortFields = ['product_name', 'price', 'product_id'];
    const allowedSortOrders = ['ASC', 'DESC'];

    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'product_id';
    const sortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const query = `
      SELECT DISTINCT
        p.product_id,
        p.product_name,
        p.description,
        p.category_id,
        c.category_name,
        COALESCE(SUM(pv.stock_quantity),0) as total_stock,
        COALESCE(MIN(pv.price),0) as price
      FROM Product p
      LEFT JOIN Category c ON p.category_id = c.category_id
      LEFT JOIN ProductVariant pv ON p.product_id = pv.product_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY p.product_id
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    const [products] = await pool.execute(query, params);

    // Total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM Product p
      LEFT JOIN ProductVariant pv ON p.product_id = pv.product_id
      WHERE ${whereConditions.join(' AND ')}
    `;
    const [countResult] = await pool.execute(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Products fetch failed', message: error.message });
  }
});

// GET product by ID with variants
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    // Product
    const [products] = await pool.execute(`
      SELECT p.product_id, p.product_name, p.description, p.category_id, c.category_name
      FROM Product p
      LEFT JOIN Category c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [id]);

    if (products.length === 0) return res.status(404).json({ error: 'Product not found' });

    const product = products[0];

    // Variants
    const [variants] = await pool.execute(`
      SELECT variant_id, SKU, size, color, price, stock_quantity
      FROM ProductVariant
      WHERE product_id = ?
    `, [id]);

    res.json({ product: { ...product, variants } });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Product fetch failed', message: error.message });
  }
});

// GET all categories
router.get('/categories/all', async (req, res) => {
  try {
    const pool = getConnection();
    const [categories] = await pool.execute('SELECT category_id, category_name, description FROM Category');
    res.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Categories fetch failed', message: error.message });
  }
});

module.exports = router;

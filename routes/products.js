const express = require('express');
const { getConnection } = require('../config/database');
const { validatePagination, validateId } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all products with pagination, filtering, and sorting
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category_id,
      search,
      min_price,
      max_price,
      sort_by = 'created_at',
      sort_order = 'DESC',
      in_stock_only = false
    } = req.query;

    const pool = getConnection();
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['1=1'];
    let params = [];

    if (category_id) {
      whereConditions.push('p.category_id = ?');
      params.push(category_id);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (min_price) {
      whereConditions.push('p.price >= ?');
      params.push(min_price);
    }

    if (max_price) {
      whereConditions.push('p.price <= ?');
      params.push(max_price);
    }

    if (in_stock_only === 'true') {
      whereConditions.push('pv.stock_quantity > 0');
    }

    // Validate sort parameters
    const allowedSortFields = ['name', 'price', 'created_at'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    // Get products with variants and categories
    const query = `
      SELECT DISTINCT
        p.id,
        p.sku,
        p.name,
        p.description,
        p.price,
        p.weight,
        p.images,
        p.created_at,
        c.name as category_name,
        c.id as category_id,
        COALESCE(SUM(pv.stock_quantity), 0) as total_stock,
        COALESCE(AVG(pr.rating), 0) as average_rating,
        COUNT(DISTINCT pr.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY p.id
      ORDER BY p.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    const [products] = await pool.execute(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [countResult] = await pool.execute(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    // Format response
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      average_rating: parseFloat(product.average_rating).toFixed(1),
      in_stock: product.total_stock > 0
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({
      error: 'Products fetch failed',
      message: 'Something went wrong while fetching products'
    });
  }
});

// Get product by ID with variants and reviews
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    // Get product details
    const [products] = await pool.execute(`
      SELECT 
        p.*,
        c.name as category_name,
        c.id as category_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    const product = products[0];

    // Get product variants
    const [variants] = await pool.execute(`
      SELECT 
        id,
        variant_name,
        variant_value,
        price_adjustment,
        stock_quantity
      FROM product_variants
      WHERE product_id = ?
      ORDER BY variant_name, variant_value
    `, [id]);

    // Get reviews
    const [reviews] = await pool.execute(`
      SELECT 
        pr.id,
        pr.rating,
        pr.review_text,
        pr.created_at,
        u.first_name,
        u.last_name
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ?
      ORDER BY pr.created_at DESC
    `, [id]);

    // Get average rating
    const [ratingResult] = await pool.execute(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as review_count
      FROM product_reviews
      WHERE product_id = ?
    `, [id]);

    // Get related products (same category)
    const [relatedProducts] = await pool.execute(`
      SELECT 
        id,
        name,
        price,
        images
      FROM products
      WHERE category_id = ? AND id != ?
      LIMIT 6
    `, [product.category_id, id]);

    // Format response
    const formattedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      variants: variants.map(variant => ({
        ...variant,
        final_price: parseFloat(product.price) + parseFloat(variant.price_adjustment),
        in_stock: variant.stock_quantity > 0
      })),
      reviews: reviews.map(review => ({
        ...review,
        reviewer_name: `${review.first_name} ${review.last_name}`
      })),
      average_rating: parseFloat(ratingResult[0].average_rating || 0).toFixed(1),
      review_count: ratingResult[0].review_count,
      related_products: relatedProducts.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      }))
    };

    res.json({
      product: formattedProduct
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({
      error: 'Product fetch failed',
      message: 'Something went wrong while fetching product details'
    });
  }
});

// Get categories
router.get('/categories/all', async (req, res) => {
  try {
    const pool = getConnection();

    const [categories] = await pool.execute(`
      SELECT 
        c1.id,
        c1.name,
        c1.description,
        c1.parent_id,
        COUNT(c2.id) as subcategory_count,
        COUNT(p.id) as product_count
      FROM categories c1
      LEFT JOIN categories c2 ON c1.id = c2.parent_id
      LEFT JOIN products p ON c1.id = p.category_id
      GROUP BY c1.id
      ORDER BY c1.name
    `);

    // Organize into hierarchy
    const categoryMap = {};
    const rootCategories = [];

    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        subcategories: []
      };
    });

    categories.forEach(category => {
      if (category.parent_id) {
        if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].subcategories.push(categoryMap[category.id]);
        }
      } else {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    res.json({
      categories: rootCategories
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      error: 'Categories fetch failed',
      message: 'Something went wrong while fetching categories'
    });
  }
});

// Add product review (authenticated users only)
router.post('/:id/reviews', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text } = req.body;
    const pool = getConnection();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    // Check if user already reviewed this product
    const [existingReviews] = await pool.execute(
      'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, id]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({
        error: 'Review already exists',
        message: 'You have already reviewed this product'
      });
    }

    // Add review
    await pool.execute(
      'INSERT INTO product_reviews (product_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [id, req.user.id, rating, review_text || null]
    );

    res.status(201).json({
      message: 'Review added successfully'
    });

  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({
      error: 'Review creation failed',
      message: 'Something went wrong while adding review'
    });
  }
});

// Search products
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        suggestions: []
      });
    }

    const pool = getConnection();

    const [suggestions] = await pool.execute(`
      SELECT DISTINCT
        p.name,
        p.id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name LIKE ? OR p.description LIKE ?
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);

    res.json({
      suggestions: suggestions.map(s => ({
        name: s.name,
        id: s.id,
        category: s.category_name
      }))
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Something went wrong while searching'
    });
  }
});

module.exports = router;


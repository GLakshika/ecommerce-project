const express = require('express');
const { getConnection } = require('../config/database');
const { validateCartItem, validateId } = require('../middleware/validation');
const { authenticateToken, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all cart routes
router.use(authenticateToken);
router.use(requireCustomer);

// Get user's cart
router.get('/', async (req, res) => {
  try {
    const pool = getConnection();

    const [cartItems] = await pool.execute(`
      SELECT 
        c.id,
        c.quantity,
        c.created_at,
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price as base_price,
        p.images,
        pv.id as variant_id,
        pv.variant_name,
        pv.variant_value,
        pv.price_adjustment,
        pv.stock_quantity,
        (p.price + pv.price_adjustment) as unit_price,
        (p.price + pv.price_adjustment) * c.quantity as total_price
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    // Calculate cart totals
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const itemCount = cartItems.length;

    // Format response
    const formattedCart = cartItems.map(item => ({
      id: item.id,
      product: {
        id: item.product_id,
        name: item.product_name,
        sku: item.sku,
        images: item.images ? JSON.parse(item.images) : []
      },
      variant: {
        id: item.variant_id,
        name: item.variant_name,
        value: item.variant_value,
        price_adjustment: parseFloat(item.price_adjustment)
      },
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price),
      stock_quantity: item.stock_quantity,
      in_stock: item.stock_quantity > 0,
      can_order: item.stock_quantity >= item.quantity
    }));

    res.json({
      items: formattedCart,
      summary: {
        item_count: itemCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(subtotal.toFixed(2)) // No tax/shipping in this implementation
      }
    });

  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({
      error: 'Cart fetch failed',
      message: 'Something went wrong while fetching cart'
    });
  }
});

// Add item to cart
router.post('/add', validateCartItem, async (req, res) => {
  try {
    const { product_variant_id, quantity } = req.body;
    const pool = getConnection();

    // Check if product variant exists and has sufficient stock
    const [variants] = await pool.execute(`
      SELECT 
        pv.id,
        pv.stock_quantity,
        pv.variant_name,
        pv.variant_value,
        p.name as product_name,
        p.price as base_price,
        pv.price_adjustment
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.id = ?
    `, [product_variant_id]);

    if (variants.length === 0) {
      return res.status(404).json({
        error: 'Product variant not found',
        message: 'The requested product variant does not exist'
      });
    }

    const variant = variants[0];

    if (variant.stock_quantity < quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Only ${variant.stock_quantity} items available in stock`
      });
    }

    // Check if item already exists in cart
    const [existingItems] = await pool.execute(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_variant_id = ?',
      [req.user.id, product_variant_id]
    );

    if (existingItems.length > 0) {
      // Update existing item quantity
      const newQuantity = existingItems[0].quantity + quantity;
      
      if (newQuantity > variant.stock_quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Cannot add ${quantity} more items. Only ${variant.stock_quantity - existingItems[0].quantity} additional items available`
        });
      }

      await pool.execute(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );

      res.json({
        message: 'Cart item updated successfully',
        action: 'updated',
        new_quantity: newQuantity
      });
    } else {
      // Add new item to cart
      await pool.execute(
        'INSERT INTO cart (user_id, product_variant_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_variant_id, quantity]
      );

      res.status(201).json({
        message: 'Item added to cart successfully',
        action: 'added'
      });
    }

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: 'Add to cart failed',
      message: 'Something went wrong while adding item to cart'
    });
  }
});

// Update cart item quantity
router.put('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const pool = getConnection();

    // Validate quantity
    if (!quantity || quantity < 1 || quantity > 100) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Quantity must be between 1 and 100'
      });
    }

    // Check if cart item exists and belongs to user
    const [cartItems] = await pool.execute(`
      SELECT 
        c.id,
        c.quantity,
        pv.stock_quantity,
        p.name as product_name
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE c.id = ? AND c.user_id = ?
    `, [id, req.user.id]);

    if (cartItems.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found',
        message: 'The requested cart item does not exist'
      });
    }

    const cartItem = cartItems[0];

    // Check stock availability
    if (quantity > cartItem.stock_quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Only ${cartItem.stock_quantity} items available in stock for ${cartItem.product_name}`
      });
    }

    // Update quantity
    await pool.execute(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    res.json({
      message: 'Cart item updated successfully',
      new_quantity: quantity
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      error: 'Update cart failed',
      message: 'Something went wrong while updating cart item'
    });
  }
});

// Remove item from cart
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    // Check if cart item exists and belongs to user
    const [cartItems] = await pool.execute(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found',
        message: 'The requested cart item does not exist'
      });
    }

    // Remove item
    await pool.execute(
      'DELETE FROM cart WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      error: 'Remove from cart failed',
      message: 'Something went wrong while removing item from cart'
    });
  }
});

// Clear entire cart
router.delete('/', async (req, res) => {
  try {
    const pool = getConnection();

    await pool.execute(
      'DELETE FROM cart WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: 'Clear cart failed',
      message: 'Something went wrong while clearing cart'
    });
  }
});

// Get cart summary (for checkout)
router.get('/summary', async (req, res) => {
  try {
    const pool = getConnection();

    const [cartItems] = await pool.execute(`
      SELECT 
        c.quantity,
        p.price as base_price,
        pv.price_adjustment,
        pv.stock_quantity,
        (p.price + pv.price_adjustment) * c.quantity as item_total
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.item_total), 0);
    const itemCount = cartItems.length;

    // Check if all items are in stock
    const outOfStockItems = cartItems.filter(item => item.stock_quantity < item.quantity);
    const canCheckout = outOfStockItems.length === 0;

    res.json({
      summary: {
        item_count: itemCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(subtotal.toFixed(2))
      },
      can_checkout: canCheckout,
      out_of_stock_items: outOfStockItems.length
    });

  } catch (error) {
    console.error('Cart summary error:', error);
    res.status(500).json({
      error: 'Cart summary failed',
      message: 'Something went wrong while calculating cart summary'
    });
  }
});

module.exports = router;


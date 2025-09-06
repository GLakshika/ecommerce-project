const express = require('express');
const { getConnection } = require('../config/database');
const { validateCartItem, validateId } = require('../middleware/validation');
const { authenticateToken, requireCustomer } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireCustomer);

// Get user's cart
router.get('/', async (req, res) => {
  try {
    const pool = getConnection();

    const [cartItems] = await pool.execute(`
      SELECT 
        ci.cart_item_id,
        ci.quantity,
        pv.variant_id,
        pv.SKU,
        pv.size,
        pv.color,
        pv.price as unit_price,
        pv.stock_quantity,
        p.product_id,
        p.product_name
      FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      JOIN ProductVariant pv ON ci.variant_id = pv.variant_id
      JOIN Product p ON pv.product_id = p.product_id
      WHERE c.customer_id = ?
      ORDER BY ci.cart_item_id DESC
    `, [req.user.id]);

    const subtotal = cartItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const formattedCart = cartItems.map(item => ({
      id: item.cart_item_id,
      product: { id: item.product_id, name: item.product_name },
      variant: { id: item.variant_id, sku: item.SKU, size: item.size, color: item.color },
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat((item.unit_price * item.quantity).toFixed(2)),
      stock_quantity: item.stock_quantity,
      in_stock: item.stock_quantity > 0,
      can_order: item.stock_quantity >= item.quantity
    }));

    res.json({
      items: formattedCart,
      summary: { item_count: cartItems.length, subtotal: parseFloat(subtotal.toFixed(2)), total: parseFloat(subtotal.toFixed(2)) }
    });

  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Cart fetch failed', message: error.message });
  }
});

// Add item to cart
router.post('/add', validateCartItem, async (req, res) => {
  try {
    const { variant_id, quantity } = req.body;
    const pool = getConnection();

    // Get product variant and stock
    const [variants] = await pool.execute(`
      SELECT pv.variant_id, pv.stock_quantity, pv.price, p.product_name
      FROM ProductVariant pv
      JOIN Product p ON pv.product_id = p.product_id
      WHERE pv.variant_id = ?
    `, [variant_id]);

    if (!variants.length) return res.status(404).json({ error: 'Variant not found' });
    const variant = variants[0];
    if (variant.stock_quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    // Get user's cart
    const [carts] = await pool.execute('SELECT cart_id FROM Cart WHERE customer_id = ?', [req.user.id]);
    let cartId;
    if (carts.length) {
      cartId = carts[0].cart_id;
    } else {
      const [result] = await pool.execute('INSERT INTO Cart (customer_id) VALUES (?)', [req.user.id]);
      cartId = result.insertId;
    }

    // Check if item exists in cart
    const [existingItems] = await pool.execute(`
      SELECT cart_item_id, quantity FROM CartItem
      WHERE cart_id = ? AND variant_id = ?
    `, [cartId, variant_id]);

    if (existingItems.length) {
      const newQuantity = existingItems[0].quantity + quantity;
      if (newQuantity > variant.stock_quantity) return res.status(400).json({ error: 'Insufficient stock' });
      await pool.execute('UPDATE CartItem SET quantity=? WHERE cart_item_id=?', [newQuantity, existingItems[0].cart_item_id]);
      return res.json({ message: 'Cart item updated', action: 'updated', new_quantity: newQuantity });
    } else {
      await pool.execute('INSERT INTO CartItem (cart_id, variant_id, quantity) VALUES (?, ?, ?)', [cartId, variant_id, quantity]);
      return res.status(201).json({ message: 'Item added to cart', action: 'added' });
    }

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Add to cart failed', message: error.message });
  }
});

// Update cart item
router.put('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const pool = getConnection();

    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });

    const [cartItems] = await pool.execute(`
      SELECT ci.cart_item_id, ci.quantity, pv.stock_quantity, p.product_name
      FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      JOIN ProductVariant pv ON ci.variant_id = pv.variant_id
      JOIN Product p ON pv.product_id = p.product_id
      WHERE ci.cart_item_id = ? AND c.customer_id = ?
    `, [id, req.user.id]);

    if (!cartItems.length) return res.status(404).json({ error: 'Cart item not found' });

    const cartItem = cartItems[0];
    if (quantity > cartItem.stock_quantity) return res.status(400).json({ error: 'Insufficient stock' });

    await pool.execute('UPDATE CartItem SET quantity=? WHERE cart_item_id=?', [quantity, id]);
    res.json({ message: 'Cart item updated', new_quantity: quantity });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Update cart failed', message: error.message });
  }
});

// Delete cart item
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getConnection();

    const [cartItems] = await pool.execute(`
      SELECT ci.cart_item_id
      FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id=? AND c.customer_id=?
    `, [id, req.user.id]);

    if (!cartItems.length) return res.status(404).json({ error: 'Cart item not found' });

    await pool.execute('DELETE FROM CartItem WHERE cart_item_id=?', [id]);
    res.json({ message: 'Item removed from cart' });

  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Remove cart failed', message: error.message });
  }
});

// Clear entire cart
router.delete('/', async (req, res) => {
  try {
    const pool = getConnection();
    await pool.execute(`
      DELETE ci FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      WHERE c.customer_id=?
    `, [req.user.id]);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Clear cart failed', message: error.message });
  }
});

// Cart summary
router.get('/summary', async (req, res) => {
  try {
    const pool = getConnection();

    const [cartItems] = await pool.execute(`
      SELECT ci.quantity, pv.price as unit_price, pv.stock_quantity
      FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      JOIN ProductVariant pv ON ci.variant_id = pv.variant_id
      WHERE c.customer_id = ?
    `, [req.user.id]);

    const subtotal = cartItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const outOfStockItems = cartItems.filter(i => i.stock_quantity < i.quantity);

    res.json({
      summary: { item_count: cartItems.length, subtotal: parseFloat(subtotal.toFixed(2)), total: parseFloat(subtotal.toFixed(2)) },
      can_checkout: outOfStockItems.length === 0,
      out_of_stock_items: outOfStockItems.length
    });

  } catch (error) {
    console.error('Cart summary error:', error);
    res.status(500).json({ error: 'Cart summary failed', message: error.message });
  }
});

module.exports = router;

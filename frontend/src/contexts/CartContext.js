import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cart/add', {
        product_variant_id: productId,
        quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadCart();
      toast.success('Added to cart!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/cart/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadCart();
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/cart/${cartItemId}`, {
        quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadCart();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCartItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const checkout = async (orderData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCartItems([]);
      toast.success('Order placed successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      return false;
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.total_price, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    loadCart,
    getCartTotal,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

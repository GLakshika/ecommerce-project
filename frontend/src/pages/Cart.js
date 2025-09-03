import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  Divider,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  ArrowBack,
  CreditCard,
  LocalShipping
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Cart = () => {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    loading,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    getCartTotal,
    getCartCount
  } = useCart();

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateQuantity(cartItemId, newQuantity);
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setCheckoutLoading(true);
    try {
      const success = await checkout({
        delivery_method: 'store_pickup',
        payment_method: 'cash_on_delivery'
      });
      
      if (success) {
        navigate('/');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 2 }}>
            Please Login to View Cart
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            You need to be logged in to access your shopping cart.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth')}
          >
            Login Now
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="40%" height={60} />
          <Skeleton variant="text" width="60%" height={40} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {[...Array(3)].map((_, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}>
                      <Skeleton variant="rectangular" height={80} />
                    </Grid>
                    <Grid item xs={6}>
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={20} />
                    </Grid>
                    <Grid item xs={3}>
                      <Skeleton variant="text" height={30} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" height={40} />
                <Skeleton variant="text" height={30} />
                <Skeleton variant="text" height={30} />
                <Skeleton variant="rectangular" height={50} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/products')}
          sx={{ mb: 2 }}
        >
          Continue Shopping
        </Button>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Shopping Cart
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Review your items and proceed to checkout
        </Typography>
      </Box>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 2 }}>
              Your cart is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Looks like you haven't added any items to your cart yet.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/products')}
            >
              Start Shopping
            </Button>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={3}>
            {/* Cart Items */}
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Cart Items ({getCartCount()})
              </Typography>
              
              {cartItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Box
                            sx={{
                              width: '100%',
                              height: 80,
                              backgroundColor: 'grey.100',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2rem',
                            }}
                          >
                            📱
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {item.product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Unit Price: ${item.unit_price}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Remove />
                            </IconButton>
                            <TextField
                              value={item.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  handleQuantityChange(item.id, value);
                                }
                              }}
                              size="small"
                              sx={{ width: 60 }}
                              inputProps={{ min: 1, style: { textAlign: 'center' } }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Add />
                            </IconButton>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={2}>
                          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                            ${item.total_price}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={1}>
                          <IconButton
                            color="error"
                            onClick={() => removeFromCart(item.id)}
                            sx={{ ml: 'auto' }}
                          >
                            <Delete />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={clearCart}
                  startIcon={<Delete />}
                >
                  Clear Cart
                </Button>
              </Box>
            </Grid>

            {/* Order Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 20 }}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                    Order Summary
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Subtotal:</Typography>
                      <Typography variant="body1">${getCartTotal().toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Shipping:</Typography>
                      <Typography variant="body1" color="success.main">
                        Free
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Tax:</Typography>
                      <Typography variant="body1">${(getCartTotal() * 0.0825).toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total:
                      </Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                        ${(getCartTotal() * 1.0825).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<CreditCard />}
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    sx={{ mb: 2 }}
                  >
                    {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<LocalShipping />}
                    disabled
                    sx={{ mb: 2 }}
                  >
                    Store Pickup Only
                  </Button>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Free shipping on orders over $50. Store pickup available for immediate collection.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}
    </Container>
  );
};

export default Cart;

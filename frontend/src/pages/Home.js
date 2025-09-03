import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ShoppingCart,
  LocalShipping,
  Security,
  Support,
  Star,
  CheckCircle,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const features = [
    {
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      title: 'Fast & Free Shipping',
      description: 'Get your orders delivered quickly with our reliable shipping network. Free shipping on orders over $50.',
      color: '#27ae60'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure Shopping',
      description: 'Your data is protected with industry-standard security measures. Shop with confidence.',
      color: '#3498db'
    },
    {
      icon: <Support sx={{ fontSize: 40 }} />,
      title: '24/7 Support',
      description: 'Our expert customer support team is always here to help you with any questions or concerns.',
      color: '#f39c12'
    }
  ];

  const productCategories = [
    { name: 'Smart TVs', icon: '📺', count: '50+' },
    { name: 'Laptops', icon: '💻', count: '100+' },
    { name: 'Smartphones', icon: '📱', count: '75+' },
    { name: 'Audio', icon: '🎧', count: '60+' },
    { name: 'Gaming', icon: '🎮', count: '40+' },
    { name: 'Smart Home', icon: '🏠', count: '30+' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant={isMobile ? 'h3' : 'h2'}
                  sx={{
                    fontWeight: 800,
                    mb: 3,
                    lineHeight: 1.2
                  }}
                >
                  Your Trusted{' '}
                  <Box component="span" sx={{ color: 'primary.light' }}>
                    Electronics
                  </Box>{' '}
                  Shop in Texas
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    lineHeight: 1.6
                  }}
                >
                  Discover the latest in electronics, smart home devices, appliances, and more – 
                  all in one place. Whether you're upgrading your gadgets, finding the perfect gift, 
                  or enhancing your home, BrightBuy brings you top brands, unbeatable deals, and expert service.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCart />}
                    onClick={() => navigate('/products')}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Shop Now
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: 'white',
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    p: 3
                  }}
                >
                  <Grid container spacing={2}>
                    {productCategories.map((category, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              transform: 'translateY(-4px)',
                            },
                          }}
                        >
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {category.icon}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {category.name}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {category.count} items
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                      <Star sx={{ color: '#f39c12', mr: 0.5 }} />
                      <Typography variant="body2">
                        Trusted by 10,000+ customers
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        icon={<CheckCircle />}
                        label="Free Shipping"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(39, 174, 96, 0.2)',
                          color: '#27ae60',
                        }}
                      />
                      <Chip
                        icon={<Security />}
                        label="Secure Payment"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(52, 152, 219, 0.2)',
                          color: '#3498db',
                        }}
                      />
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <motion.div variants={itemVariants}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                Why Choose BrightBuy?
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                We're committed to providing the best shopping experience with quality products and exceptional service.
              </Typography>
            </motion.div>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div variants={itemVariants}>
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      p: 4,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: `${feature.color}15`,
                        color: feature.color,
                        mb: 3,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                Ready to Start Shopping?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Join thousands of satisfied customers who trust BrightBuy for their electronics needs.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<BoltIcon />}
                onClick={() => navigate('/products')}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: 'grey.100',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Explore Products
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

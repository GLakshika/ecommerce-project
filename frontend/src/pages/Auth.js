import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Login,
  PersonAdd
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Admin toggle
  const [formData, setFormData] = useState({
    login: { email: '', password: '' },
    register: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone_no: '',
      address: '',
      zip_code: ''
    }
  });
  const [errors, setErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAdmin, register } = useAuth();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setErrors({});
  };

  const handleInputChange = (form, field, value) => {
    setFormData(prev => ({
      ...prev,
      [form]: { ...prev[form], [field]: value }
    }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (form) => {
    const newErrors = {};
    if (form === 'login') {
      const { email, password } = formData.login;
      if (!email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    } else {
      const { first_name, last_name, email, password, confirmPassword, phone_no, address, zip_code } = formData.register;
      if (!first_name) newErrors.first_name = 'First name is required';
      if (!last_name) newErrors.last_name = 'Last name is required';
      if (!phone_no) newErrors.phone_no = 'Phone number is required';
      if (!address) newErrors.address = 'Address is required';
      if (!zip_code) newErrors.zip_code = 'ZIP code is required';
      if (!email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm('login')) return;

    setLoading(true);
    try {
      const success = isAdmin
        ? await loginAdmin(formData.login.email, formData.login.password)
        : await login(formData.login.email, formData.login.password);

      if (success) {
        const redirectTo = location.state?.from || (isAdmin ? '/admin-dashboard' : '/');
        navigate(redirectTo);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm('register')) return;

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData.register;
      const success = await register(registerData);
      if (success) {
        const redirectTo = location.state?.from || '/';
        navigate(redirectTo);
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>Welcome to BrightBuy</Typography>
          <Typography variant="h6" color="text.secondary">Sign in to your account or create a new one</Typography>
        </Box>

        <Card sx={{ maxWidth: 500, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 4 }}>
              <Tab label="Sign In" icon={<Login />} iconPosition="start" sx={{ fontWeight: 600 }} />
              <Tab label="Sign Up" icon={<PersonAdd />} iconPosition="start" sx={{ fontWeight: 600 }} />
            </Tabs>

            {/* LOGIN FORM */}
            {activeTab === 0 && (
              <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} onSubmit={handleLogin}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={isAdmin} onChange={() => setIsAdmin(!isAdmin)} id="admin-login" />
                  <label htmlFor="admin-login" style={{ marginLeft: 8 }}>Login as Admin</label>
                </Box>

                <TextField
                  fullWidth label="Email" type="email"
                  value={formData.login.email}
                  onChange={(e) => handleInputChange('login', 'email', e.target.value)}
                  error={!!errors.email} helperText={errors.email}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Email color="action" /></InputAdornment>) }}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth label="Password" type={showPassword ? 'text' : 'password'}
                  value={formData.login.password}
                  onChange={(e) => handleInputChange('login', 'password', e.target.value)}
                  error={!!errors.password} helperText={errors.password}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>),
                    endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>)
                  }}
                  sx={{ mb: 3 }}
                />

                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mb: 2 }}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Button variant="text" onClick={() => setActiveTab(1)} sx={{ p: 0, minWidth: 'auto' }}>Sign up here</Button>
                  </Typography>
                </Box>
              </motion.form>
            )}

            {/* REGISTER FORM */}
            {activeTab === 1 && (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} onSubmit={handleRegister}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField fullWidth label="First Name" value={formData.register.first_name} onChange={(e) => handleInputChange('register', 'first_name', e.target.value)} error={!!errors.first_name} helperText={errors.first_name} InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="action" /></InputAdornment>) }} />
                  <TextField fullWidth label="Last Name" value={formData.register.last_name} onChange={(e) => handleInputChange('register', 'last_name', e.target.value)} error={!!errors.last_name} helperText={errors.last_name} InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="action" /></InputAdornment>) }} />
                </Box>

                <TextField fullWidth label="Phone Number" value={formData.register.phone_no} onChange={(e) => handleInputChange('register', 'phone_no', e.target.value)} error={!!errors.phone_no} helperText={errors.phone_no} sx={{ mb: 3 }} />
                <TextField fullWidth label="Address" value={formData.register.address} onChange={(e) => handleInputChange('register', 'address', e.target.value)} error={!!errors.address} helperText={errors.address} sx={{ mb: 3 }} />
                <TextField fullWidth label="ZIP Code" value={formData.register.zip_code} onChange={(e) => handleInputChange('register', 'zip_code', e.target.value)} error={!!errors.zip_code} helperText={errors.zip_code} sx={{ mb: 3 }} />
                <TextField fullWidth label="Email" type="email" value={formData.register.email} onChange={(e) => handleInputChange('register', 'email', e.target.value)} error={!!errors.email} helperText={errors.email} InputProps={{ startAdornment: (<InputAdornment position="start"><Email color="action" /></InputAdornment>) }} sx={{ mb: 3 }} />
                <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={formData.register.password} onChange={(e) => handleInputChange('register', 'password', e.target.value)} error={!!errors.password} helperText={errors.password} InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} sx={{ mb: 3 }} />
                <TextField fullWidth label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} value={formData.register.confirmPassword} onChange={(e) => handleInputChange('register', 'confirmPassword', e.target.value)} error={!!errors.confirmPassword} helperText={errors.confirmPassword} InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} sx={{ mb: 3 }} />

                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mb: 2 }}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Button variant="text" onClick={() => setActiveTab(0)} sx={{ p: 0, minWidth: 'auto' }}>Sign in here</Button>
                  </Typography>
                </Box>
              </motion.form>
            )}
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
          <Typography variant="body2">By creating an account, you agree to our Terms of Service and Privacy Policy.</Typography>
        </Alert>
      </motion.div>
    </Container>
  );
};

export default Auth;

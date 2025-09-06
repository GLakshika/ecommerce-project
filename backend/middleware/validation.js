const { body, param, query, validationResult } = require('express-validator');

// Centralized error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input',
      details: errors.array()
    });
  }
  next();
};

// ==================== CUSTOMER / USER VALIDATION ====================

// Customer registration
const validateRegistration = [
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone_no')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('zip_code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Zip code must not exceed 20 characters'),
  handleValidationErrors
];

// Customer login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// ==================== PRODUCT VALIDATION ====================

// Product creation / update
const validateProduct = [
  body('product_name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Product variant creation / update
const validateVariant = [
  body('SKU')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters'),
  body('size')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Size must not exceed 50 characters'),
  body('color')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Color must not exceed 50 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity cannot be negative'),
  handleValidationErrors
];

// ==================== CART VALIDATION ====================

// Cart item
const validateCartItem = [
  body('variant_id')
    .isInt({ min: 1 })
    .withMessage('Product variant ID must be a positive integer'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  handleValidationErrors
];

// ==================== ORDER VALIDATION ====================

// Order creation
const validateOrder = [
  body('delivery_method')
    .isIn(['store_pickup', 'standard_delivery'])
    .withMessage('Delivery method must be either store_pickup or standard_delivery'),
  body('payment_method')
    .isIn(['cash_on_delivery', 'card_payment'])
    .withMessage('Payment method must be either cash_on_delivery or card_payment'),
  body('shipping_address')
    .if(body('delivery_method').equals('standard_delivery'))
    .notEmpty()
    .withMessage('Shipping address is required for standard delivery'),
  handleValidationErrors
];

// ==================== PRODUCT REVIEW VALIDATION ====================

const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review_text')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Review text must not exceed 1000 characters'),
  handleValidationErrors
];

// ==================== QUERY PARAM VALIDATION ====================

// Pagination for list endpoints
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// ==================== ID PARAM VALIDATION ====================

// For routes with :id
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProduct,
  validateVariant,
  validateCartItem,
  validateOrder,
  validateReview,
  validatePagination,
  validateId
};

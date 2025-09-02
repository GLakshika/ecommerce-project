# BrightBuy E-commerce Platform

A comprehensive Retail Inventory and Online Order Management System built with Node.js, Express, and MySQL. This system supports product browsing, user authentication, cart management, order processing, and admin reporting.

## Features

### Customer Features
- **User Registration & Authentication**: Secure user registration and login with JWT tokens
- **Product Browsing**: Browse products with search, filtering, and sorting capabilities
- **Product Details**: View detailed product information with variants and reviews
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Management**: Place orders with delivery and payment options
- **Order History**: View past orders and track order status

### Admin Features
- **Product Management**: Create, update, and delete products with variants
- **Inventory Management**: Track and update stock levels
- **Order Management**: View and update order statuses
- **Reporting**: Generate sales reports and analytics
- **Category Management**: Organize products into categories

### Technical Features
- **RESTful API**: Complete REST API with proper HTTP status codes
- **Database Transactions**: ACID-compliant database operations
- **Security**: JWT authentication, password hashing, input validation
- **Error Handling**: Comprehensive error handling and validation
- **Performance**: Optimized database queries with proper indexing

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brightbuy-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=brightbuy_db
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   PORT=3000
   NODE_ENV=development
   BCRYPT_ROUNDS=12
   ```

4. **Create MySQL database**
   ```sql
   CREATE DATABASE brightbuy_db;
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - API: http://localhost:3000/api
   - Frontend: http://localhost:3000 (served from public/index.html)
   - Health check: http://localhost:3000/health

## Database Schema

The system automatically creates the following tables:

- **users**: User accounts and authentication
- **categories**: Product categories and hierarchy
- **products**: Product information
- **product_variants**: Product variants (size, color, etc.)
- **cart**: Shopping cart items
- **orders**: Order information
- **order_items**: Individual items in orders
- **product_reviews**: Product reviews and ratings

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get product details
- `GET /api/products/categories/all` - Get all categories
- `POST /api/products/:id/reviews` - Add product review
- `GET /api/products/search/suggestions` - Search suggestions

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart
- `GET /api/cart/summary` - Get cart summary

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Place new order
- `PUT /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/delivery-estimate` - Get delivery estimate

### Admin (requires admin role)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PUT /api/admin/inventory/variants/:id` - Update stock
- `GET /api/admin/inventory/low-stock` - Get low stock products
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/reports/quarterly-sales` - Quarterly sales report
- `GET /api/admin/reports/product-performance` - Product performance
- `GET /api/admin/reports/sales-insights` - Sales insights
- `POST /api/admin/categories` - Create category

## Business Rules

### Order Processing
- Only registered users can place orders
- Stock is validated before order placement
- Inventory is updated atomically with order creation
- Orders can be cancelled if status is "pending"

### Delivery Estimation
- **Store Pickup**: 1 day
- **Standard Delivery**:
  - Main cities: 5 days (in stock), 8 days (out of stock)
  - Other cities: 7 days (in stock), 10 days (out of stock)

### Payment Methods
- Cash on Delivery
- Card Payment (placeholder for payment gateway integration)

### Stock Management
- Stock is tracked at variant level
- Negative stock is prevented
- Stock is reserved during order placement
- Stock is restored on order cancellation

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable rounds
- **Input Validation**: Comprehensive validation using express-validator
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS settings
- **Helmet Security**: Security headers

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

Run tests with:
```bash
npm test
```

## Development

### Project Structure
```
brightbuy-ecommerce/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── validation.js       # Input validation
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── products.js         # Product routes
│   ├── cart.js            # Cart routes
│   ├── orders.js          # Order routes
│   └── admin.js           # Admin routes
├── public/
│   └── index.html         # Frontend interface
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Adding New Features

1. **Database Changes**: Add new tables/columns in `config/database.js`
2. **API Routes**: Create new route files in `routes/` directory
3. **Validation**: Add validation rules in `middleware/validation.js`
4. **Frontend**: Update `public/index.html` for UI changes

## Deployment

### Production Setup

1. **Environment Variables**
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   DB_USER=your_production_db_user
   DB_PASSWORD=your_production_db_password
   JWT_SECRET=your_secure_jwt_secret
   ```

2. **Database**
   - Use a production MySQL instance
   - Set up proper backups
   - Configure connection pooling

3. **Server**
   - Use a process manager like PM2
   - Set up reverse proxy (nginx)
   - Configure SSL certificates
   - Set up monitoring and logging

### PM2 Configuration
```bash
npm install -g pm2
pm2 start server.js --name brightbuy
pm2 save
pm2 startup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Future Enhancements

- Email notification system
- Mobile application
- Advanced payment gateway integration
- Multi-language support
- Advanced analytics and reporting
- Inventory forecasting
- Customer support integration

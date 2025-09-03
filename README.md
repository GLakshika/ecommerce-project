# BrightBuy E-commerce Platform

A complete e-commerce solution with a Node.js backend API and React frontend. Built for the BrightBuy electronics store in Texas.

## 🚀 Quick Start

### Option 1: Use the Startup Script (Windows)
```bash
# Double-click the start-app.bat file or run:
start-app.bat
```

### Option 2: Manual Start

1. **Start the Backend Server:**
   ```bash
   npm run dev
   ```

2. **In a new terminal, start the Frontend:**
   ```bash
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
brightbuy-ecommerce/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React Context providers
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main app component
│   └── package.json
├── routes/                  # API route handlers
├── middleware/              # Express middleware
├── config/                  # Database and app configuration
├── scripts/                 # Database seeding scripts
├── tests/                   # Test files
├── server.js               # Main server file
├── package.json            # Backend dependencies
└── start-app.bat          # Windows startup script
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Material-UI** - Component library
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Database Setup
1. Create a MySQL database named `brightbuy_db`
2. Copy `env.example` to `.env` and configure your database settings
3. Run the database setup:
   ```bash
   npm run seed
   ```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=brightbuy_db
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## 🚀 Running the Application

### Development Mode
```bash
# Start backend (runs on port 3000)
npm run dev

# Start frontend (runs on port 3001)
cd frontend
npm start
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start production server
npm start
```

## 📱 Application Features

### User Features
- **Authentication**: Login/Register with JWT tokens
- **Product Catalog**: Browse and search products
- **Shopping Cart**: Add, remove, and manage cart items
- **Order Management**: Place orders and view order history
- **Responsive Design**: Works on desktop, tablet, and mobile

### Admin Features
- **Product Management**: Add, edit, and delete products
- **Inventory Tracking**: Monitor stock levels
- **Order Processing**: Manage customer orders
- **User Management**: View and manage user accounts

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set up a production MySQL database
2. Configure environment variables
3. Install dependencies: `npm install --production`
4. Start the server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure the API endpoint in production

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Backend: Change PORT in .env file
   - Frontend: React will automatically use the next available port

2. **Database Connection Issues**
   - Verify MySQL is running
   - Check database credentials in .env
   - Ensure database exists

3. **CORS Errors**
   - Backend CORS is configured for development
   - Update CORS settings for production

4. **Security Vulnerabilities**
   - Run `npm audit fix` to fix known vulnerabilities
   - Some vulnerabilities in react-scripts are expected in development

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

For support or questions:
- Check the documentation
- Review existing issues
- Create a new issue with details

---

**BrightBuy E-commerce Platform** - Professional electronics retail solution built with modern web technologies.


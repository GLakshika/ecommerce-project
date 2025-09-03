# BrightBuy React Frontend

A modern, professional React frontend for the BrightBuy e-commerce platform. Built with Material-UI, featuring a responsive design, smooth animations, and excellent user experience.

## 🚀 Features

- **Modern UI/UX**: Professional design with Material-UI components
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Authentication System**: Complete login/register functionality with JWT tokens
- **Shopping Cart**: Full cart management with quantity controls and checkout
- **Product Catalog**: Search, filter, and browse products with real-time updates
- **Smooth Animations**: Framer Motion animations for enhanced user experience
- **Toast Notifications**: Real-time feedback for user actions
- **Context Management**: Clean state management with React Context API
- **API Integration**: Seamless integration with the BrightBuy backend API

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and functional components
- **Material-UI (MUI)** - Professional UI component library
- **React Router** - Client-side routing
- **Framer Motion** - Smooth animations and transitions
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Emotion** - CSS-in-JS styling

## 📦 Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

The frontend is configured to work with the BrightBuy backend API. Make sure your backend server is running on `http://localhost:3000` (the proxy is configured in `package.json`).

### Environment Variables

Create a `.env` file in the frontend directory if you need to customize the API endpoint:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html          # Main HTML file
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/         # Reusable components
│   │   ├── Header.js       # Navigation header
│   │   └── Footer.js       # Site footer
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.js  # Authentication state
│   │   └── CartContext.js  # Shopping cart state
│   ├── pages/              # Page components
│   │   ├── Home.js         # Landing page
│   │   ├── Products.js     # Product catalog
│   │   ├── Cart.js         # Shopping cart
│   │   └── Auth.js         # Login/Register
│   ├── App.js              # Main app component
│   └── index.js            # App entry point
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: #3498db (Blue)
- **Secondary**: #2c3e50 (Dark Blue)
- **Success**: #27ae60 (Green)
- **Warning**: #f39c12 (Orange)
- **Error**: #e74c3c (Red)

### Typography
- **Font Family**: Roboto (Google Fonts)
- **Headings**: Bold weights (600-700)
- **Body**: Regular weight (400)

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Rounded with hover effects
- **Forms**: Clean, accessible input fields
- **Navigation**: Sticky header with responsive menu

## 🔐 Authentication

The app uses JWT tokens for authentication:

1. **Login/Register**: Users can create accounts or sign in
2. **Token Storage**: JWT tokens are stored in localStorage
3. **Protected Routes**: Cart and user-specific features require authentication
4. **Auto-logout**: Tokens expire and users are logged out automatically

## 🛒 Shopping Cart Features

- **Add to Cart**: Add products with quantity selection
- **Cart Management**: Update quantities, remove items
- **Cart Persistence**: Cart items persist across sessions
- **Checkout Process**: Complete order placement
- **Order Summary**: Real-time total calculation

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎭 Animations

Smooth animations powered by Framer Motion:
- **Page Transitions**: Fade and slide effects
- **Component Mounting**: Staggered animations
- **Hover Effects**: Interactive feedback
- **Loading States**: Skeleton loaders

## 🚀 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 🔧 Development

### Adding New Components

1. Create component in `src/components/`
2. Follow the existing naming conventions
3. Use Material-UI components for consistency
4. Add proper TypeScript types if using TypeScript

### Styling Guidelines

- Use Material-UI's `sx` prop for component-specific styles
- Follow the established color palette
- Maintain consistent spacing using theme spacing
- Use responsive design patterns

### State Management

- Use React Context for global state (auth, cart)
- Use local state for component-specific data
- Keep state as close to where it's used as possible

## 🧪 Testing

The app includes testing setup with:
- Jest for unit testing
- React Testing Library for component testing
- Coverage reporting

Run tests with:
```bash
npm test
```

## 📦 Building for Production

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **The build folder will contain:**
   - Optimized JavaScript bundles
   - Minified CSS
   - Static assets
   - Service worker (if enabled)

3. **Deploy to your hosting service:**
   - Netlify, Vercel, AWS S3, etc.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Check the documentation
- Review existing issues
- Create a new issue with details

## 🔄 Updates

Keep dependencies updated:
```bash
npm update
```

Check for security vulnerabilities:
```bash
npm audit
```

---

**BrightBuy React Frontend** - Professional e-commerce experience built with modern React technologies.

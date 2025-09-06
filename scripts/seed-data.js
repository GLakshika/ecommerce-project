const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'brightbuy_db',
  port: process.env.DB_PORT || 3306
};

async function seedData() {
  let connection;

  try {
    console.log('🌱 Starting data seeding...');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // 1️⃣ Create Admin
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    await connection.execute(`
      INSERT INTO Admin (name, password, email, role)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `, ['Admin User', adminPassword, 'admin@brightbuy.com', 'admin']);
    console.log('✅ Admin created');

    // 2️⃣ Create sample Customer
    const customerPassword = await bcrypt.hash('Customer123!', 12);
    await connection.execute(`
      INSERT INTO Customer (first_name, last_name, email, password_hash, phone_no, address)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
    `, ['John', 'Doe', 'customer@example.com', customerPassword, '+1234567890', '123 Main St, Austin, TX']);
    console.log('✅ Customer created');

    // 3️⃣ Create Categories
    const categories = [
      { category_name: 'Electronics', description: 'Consumer electronics and gadgets' },
      { category_name: 'Toys', description: 'Children toys and games' },
      { category_name: 'Mobile Phones', description: 'Smartphones and accessories' },
      { category_name: 'Laptops', description: 'Laptop computers and accessories' },
      { category_name: 'Tablets', description: 'Tablet devices and accessories' },
      { category_name: 'Board Games', description: 'Traditional board games' },
      { category_name: 'Action Figures', description: 'Action figures and collectibles' },
      { category_name: 'Educational Toys', description: 'Learning and educational toys' }
    ];

    for (const cat of categories) {
      await connection.execute(`
        INSERT INTO Category (category_name, description)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
      `, [cat.category_name, cat.description]);
    }
    console.log('✅ Categories created');

    // 4️⃣ Create Products
    const [categoryRows] = await connection.execute('SELECT category_id, category_name FROM Category');
    const categoryMap = {};
    categoryRows.forEach(row => categoryMap[row.category_name] = row.category_id);

    const products = [
      { product_name: 'iPhone 14 Pro', description: 'Latest iPhone', category: 'Mobile Phones' },
      { product_name: 'MacBook Pro 14"', description: 'Professional laptop with M2 chip', category: 'Laptops' },
      { product_name: 'iPad Air', description: 'Tablet with M1 chip', category: 'Tablets' },
      { product_name: 'Monopoly Classic', description: 'Board game', category: 'Board Games' },
      { product_name: 'LEGO Star Wars Millennium Falcon', description: 'Action figure', category: 'Action Figures' },
      { product_name: 'Science Kit for Kids', description: 'Educational kit', category: 'Educational Toys' }
    ];

    const productMap = {};

    for (const prod of products) {
      const [result] = await connection.execute(`
        INSERT INTO Product (product_name, description, category_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
      `, [prod.product_name, prod.description, categoryMap[prod.category]]);
      productMap[prod.product_name] = result.insertId;
    }
    console.log('✅ Products created');

    // 5️⃣ Create ProductVariants
    const variants = [
      { product_name: 'iPhone 14 Pro', SKU: 'IPH14-128', size: '128GB', color: 'Space Black', price: 999.99, stock_quantity: 10 },
      { product_name: 'iPhone 14 Pro', SKU: 'IPH14-256', size: '256GB', color: 'Silver', price: 1099.99, stock_quantity: 5 },
      { product_name: 'MacBook Pro 14"', SKU: 'MBP14-512', size: '512GB', color: 'Silver', price: 1999.99, stock_quantity: 8 },
      { product_name: 'iPad Air', SKU: 'IPAD-64', size: '64GB', color: 'Space Gray', price: 599.99, stock_quantity: 10 },
      { product_name: 'Monopoly Classic', SKU: 'MONO-CL', size: null, color: null, price: 29.99, stock_quantity: 20 }
    ];

    for (const variant of variants) {
      await connection.execute(`
        INSERT INTO ProductVariant (product_id, SKU, size, color, price, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE price = VALUES(price), stock_quantity = VALUES(stock_quantity)
      `, [
        productMap[variant.product_name],
        variant.SKU,
        variant.size,
        variant.color,
        variant.price,
        variant.stock_quantity
      ]);
    }
    console.log('✅ Product variants created');

    console.log('🎉 Data seeding completed successfully!');
    console.log('Admin: admin@brightbuy.com / Admin123!');
    console.log('Customer: customer@example.com / Customer123!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

// Run seeding
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedData };

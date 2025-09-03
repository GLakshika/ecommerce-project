const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brightbuy_db',
  port: process.env.DB_PORT || 3306
};

async function seedData() {
  let connection;
  
  try {
    console.log('🌱 Starting data seeding...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    await connection.execute(`
      INSERT INTO users (first_name, last_name, email, password, role) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `, ['Admin', 'User', 'admin@brightbuy.com', hashedPassword, 'admin']);
    console.log('✅ Admin user created');

    // Create categories
    const categories = [
      { name: 'Electronics', description: 'Consumer electronics and gadgets' },
      { name: 'Toys', description: 'Children toys and games' },
      { name: 'Mobile Phones', description: 'Smartphones and accessories', parent_id: 1 },
      { name: 'Laptops', description: 'Laptop computers and accessories', parent_id: 1 },
      { name: 'Tablets', description: 'Tablet devices and accessories', parent_id: 1 },
      { name: 'Board Games', description: 'Traditional board games', parent_id: 2 },
      { name: 'Action Figures', description: 'Action figures and collectibles', parent_id: 2 },
      { name: 'Educational Toys', description: 'Learning and educational toys', parent_id: 2 }
    ];

    for (const category of categories) {
      await connection.execute(`
        INSERT INTO categories (name, description, parent_id) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
      `, [category.name, category.description, category.parent_id]);
    }
    console.log('✅ Categories created');

    // Get category IDs
    const [categoryRows] = await connection.execute('SELECT id, name FROM categories');
    const categoryMap = {};
    categoryRows.forEach(row => {
      categoryMap[row.name] = row.id;
    });

    // Create products
    const products = [
      {
        sku: 'PHONE-001',
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone with advanced camera system and A16 Bionic chip',
        price: 999.99,
        weight: 0.206,
        category_id: categoryMap['Mobile Phones'],
        images: JSON.stringify(['iphone14pro-1.jpg', 'iphone14pro-2.jpg']),
        variants: [
          { name: 'Storage', value: '128GB', price_adjustment: 0, stock_quantity: 15 },
          { name: 'Storage', value: '256GB', price_adjustment: 100, stock_quantity: 10 },
          { name: 'Storage', value: '512GB', price_adjustment: 300, stock_quantity: 5 },
          { name: 'Color', value: 'Space Black', price_adjustment: 0, stock_quantity: 8 },
          { name: 'Color', value: 'Silver', price_adjustment: 0, stock_quantity: 7 },
          { name: 'Color', value: 'Gold', price_adjustment: 0, stock_quantity: 5 }
        ]
      },
      {
        sku: 'LAPTOP-001',
        name: 'MacBook Pro 14"',
        description: 'Professional laptop with M2 Pro chip and Liquid Retina XDR display',
        price: 1999.99,
        weight: 1.6,
        category_id: categoryMap['Laptops'],
        images: JSON.stringify(['macbookpro-1.jpg', 'macbookpro-2.jpg']),
        variants: [
          { name: 'Storage', value: '512GB', price_adjustment: 0, stock_quantity: 8 },
          { name: 'Storage', value: '1TB', price_adjustment: 200, stock_quantity: 5 },
          { name: 'Memory', value: '16GB', price_adjustment: 0, stock_quantity: 10 },
          { name: 'Memory', value: '32GB', price_adjustment: 400, stock_quantity: 3 }
        ]
      },
      {
        sku: 'TABLET-001',
        name: 'iPad Air',
        description: 'Powerful tablet with M1 chip and 10.9-inch Liquid Retina display',
        price: 599.99,
        weight: 0.461,
        category_id: categoryMap['Tablets'],
        images: JSON.stringify(['ipadair-1.jpg', 'ipadair-2.jpg']),
        variants: [
          { name: 'Storage', value: '64GB', price_adjustment: 0, stock_quantity: 12 },
          { name: 'Storage', value: '256GB', price_adjustment: 150, stock_quantity: 8 },
          { name: 'Color', value: 'Space Gray', price_adjustment: 0, stock_quantity: 10 },
          { name: 'Color', value: 'Silver', price_adjustment: 0, stock_quantity: 10 }
        ]
      },
      {
        sku: 'GAME-001',
        name: 'Monopoly Classic',
        description: 'Classic board game of buying, selling, and trading properties',
        price: 29.99,
        weight: 0.8,
        category_id: categoryMap['Board Games'],
        images: JSON.stringify(['monopoly-1.jpg']),
        variants: [
          { name: 'Edition', value: 'Classic', price_adjustment: 0, stock_quantity: 20 },
          { name: 'Edition', value: 'Deluxe', price_adjustment: 15, stock_quantity: 10 }
        ]
      },
      {
        sku: 'TOY-001',
        name: 'LEGO Star Wars Millennium Falcon',
        description: 'Detailed LEGO model of the iconic Star Wars spaceship',
        price: 159.99,
        weight: 1.2,
        category_id: categoryMap['Action Figures'],
        images: JSON.stringify(['lego-falcon-1.jpg', 'lego-falcon-2.jpg']),
        variants: [
          { name: 'Size', value: 'Standard', price_adjustment: 0, stock_quantity: 15 },
          { name: 'Size', value: 'Collector Edition', price_adjustment: 50, stock_quantity: 5 }
        ]
      },
      {
        sku: 'EDU-001',
        name: 'Science Kit for Kids',
        description: 'Educational science kit with 50+ experiments for children',
        price: 49.99,
        weight: 0.5,
        category_id: categoryMap['Educational Toys'],
        images: JSON.stringify(['science-kit-1.jpg']),
        variants: [
          { name: 'Age Group', value: '6-8 years', price_adjustment: 0, stock_quantity: 25 },
          { name: 'Age Group', value: '9-12 years', price_adjustment: 10, stock_quantity: 20 }
        ]
      },
      {
        sku: 'PHONE-002',
        name: 'Samsung Galaxy S23',
        description: 'Premium Android smartphone with advanced camera and long battery life',
        price: 799.99,
        weight: 0.168,
        category_id: categoryMap['Mobile Phones'],
        images: JSON.stringify(['galaxys23-1.jpg', 'galaxys23-2.jpg']),
        variants: [
          { name: 'Storage', value: '128GB', price_adjustment: 0, stock_quantity: 18 },
          { name: 'Storage', value: '256GB', price_adjustment: 100, stock_quantity: 12 },
          { name: 'Color', value: 'Phantom Black', price_adjustment: 0, stock_quantity: 15 },
          { name: 'Color', value: 'Cream', price_adjustment: 0, stock_quantity: 10 }
        ]
      },
      {
        sku: 'LAPTOP-002',
        name: 'Dell XPS 13',
        description: 'Ultra-thin laptop with InfinityEdge display and Intel processor',
        price: 1299.99,
        weight: 1.17,
        category_id: categoryMap['Laptops'],
        images: JSON.stringify(['dellxps-1.jpg']),
        variants: [
          { name: 'Storage', value: '512GB', price_adjustment: 0, stock_quantity: 10 },
          { name: 'Storage', value: '1TB', price_adjustment: 200, stock_quantity: 6 },
          { name: 'Memory', value: '8GB', price_adjustment: 0, stock_quantity: 8 },
          { name: 'Memory', value: '16GB', price_adjustment: 150, stock_quantity: 8 }
        ]
      }
    ];

    for (const product of products) {
      // Insert product
      const [result] = await connection.execute(`
        INSERT INTO products (sku, name, description, price, weight, category_id, images)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        description = VALUES(description), 
        price = VALUES(price), 
        weight = VALUES(weight), 
        category_id = VALUES(category_id), 
        images = VALUES(images)
      `, [product.sku, product.name, product.description, product.price, product.weight, product.category_id, product.images]);

      const productId = result.insertId || (await connection.execute('SELECT id FROM products WHERE sku = ?', [product.sku]))[0][0].id;

      // Insert variants
      for (const variant of product.variants) {
        await connection.execute(`
          INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, stock_quantity)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          price_adjustment = VALUES(price_adjustment), 
          stock_quantity = VALUES(stock_quantity)
        `, [productId, variant.name, variant.value, variant.price_adjustment, variant.stock_quantity]);
      }
    }
    console.log('✅ Products and variants created');

    // Create sample customer
    const customerPassword = await bcrypt.hash('Customer123!', 12);
    await connection.execute(`
      INSERT INTO users (first_name, last_name, email, password, phone, address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `, ['John', 'Doe', 'customer@example.com', customerPassword, '+1234567890', '123 Main St, Austin, TX 78701', 'customer']);
    console.log('✅ Sample customer created');

    // Create sample reviews
    const [productRows] = await connection.execute('SELECT id FROM products LIMIT 3');
    const [customerRow] = await connection.execute('SELECT id FROM users WHERE email = ?', ['customer@example.com']);
    
    if (customerRow.length > 0) {
      const customerId = customerRow[0].id;
      const reviews = [
        { product_id: productRows[0].id, rating: 5, review_text: 'Excellent product! Highly recommended.' },
        { product_id: productRows[1].id, rating: 4, review_text: 'Great quality, fast delivery.' },
        { product_id: productRows[2].id, rating: 5, review_text: 'Perfect for my needs. Love it!' }
      ];

      for (const review of reviews) {
        await connection.execute(`
          INSERT INTO product_reviews (product_id, user_id, rating, review_text)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text)
        `, [review.product_id, customerId, review.rating, review.review_text]);
      }
      console.log('✅ Sample reviews created');
    }

    console.log('🎉 Data seeding completed successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('Admin: admin@brightbuy.com / Admin123!');
    console.log('Customer: customer@example.com / Customer123!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };


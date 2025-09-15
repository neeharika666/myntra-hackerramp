const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Sample data
const sampleCategories = [
  {
    name: 'Men',
    slug: 'men',
    description: 'Men\'s fashion and clothing',
    image: {
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      alt: 'Men\'s Fashion'
    },
    subcategories: [
      { name: 'T-Shirts', slug: 't-shirts' },
      { name: 'Shirts', slug: 'shirts' },
      { name: 'Jeans', slug: 'jeans' },
      { name: 'Trousers', slug: 'trousers' },
      { name: 'Shorts', slug: 'shorts' },
      { name: 'Jackets', slug: 'jackets' }
    ]
  },
  {
    name: 'Women',
    slug: 'women',
    description: 'Women\'s fashion and clothing',
    image: {
      url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      alt: 'Women\'s Fashion'
    },
    subcategories: [
      { name: 'Tops', slug: 'tops' },
      { name: 'Dresses', slug: 'dresses' },
      { name: 'Jeans', slug: 'jeans' },
      { name: 'Skirts', slug: 'skirts' },
      { name: 'Jackets', slug: 'jackets' },
      { name: 'Sarees', slug: 'sarees' }
    ]
  },
  {
    name: 'Kids',
    slug: 'kids',
    description: 'Kids clothing and accessories',
    image: {
      url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      alt: 'Kids Fashion'
    },
    subcategories: [
      { name: 'Boys', slug: 'boys' },
      { name: 'Girls', slug: 'girls' },
      { name: 'Infants', slug: 'infants' },
      { name: 'Toys', slug: 'toys' }
    ]
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Home decor and living essentials',
    image: {
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      alt: 'Home & Living'
    },
    subcategories: [
      { name: 'Bedding', slug: 'bedding' },
      { name: 'Bath', slug: 'bath' },
      { name: 'Kitchen', slug: 'kitchen' },
      { name: 'Decor', slug: 'decor' }
    ]
  }
];

const sampleProducts = [
  {
    name: 'Classic Cotton T-Shirt',
    description: 'Comfortable and stylish cotton t-shirt perfect for everyday wear. Made from 100% premium cotton for ultimate comfort.',
    brand: 'Myntra',
    subcategory: 'T-Shirts',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        alt: 'Classic Cotton T-Shirt'
      }
    ],
    variants: [
      {
        size: 'S',
        color: 'White',
        price: 599,
        originalPrice: 799,
        stock: 50
      },
      {
        size: 'M',
        color: 'White',
        price: 599,
        originalPrice: 799,
        stock: 75
      },
      {
        size: 'L',
        color: 'White',
        price: 599,
        originalPrice: 799,
        stock: 60
      },
      {
        size: 'S',
        color: 'Black',
        price: 599,
        originalPrice: 799,
        stock: 45
      },
      {
        size: 'M',
        color: 'Black',
        price: 599,
        originalPrice: 799,
        stock: 70
      },
      {
        size: 'L',
        color: 'Black',
        price: 599,
        originalPrice: 799,
        stock: 55
      }
    ],
    features: ['100% Cotton', 'Machine Washable', 'Comfortable Fit'],
    specifications: {
      material: '100% Cotton',
      care: 'Machine Wash',
      fit: 'Regular',
      occasion: 'Casual'
    },
    tags: ['cotton', 't-shirt', 'casual', 'comfortable'],
    rating: {
      average: 4.2,
      count: 150
    },
    isFeatured: true
  },
  {
    name: 'Denim Jeans',
    description: 'Classic blue denim jeans with a comfortable fit. Perfect for casual outings and everyday wear.',
    brand: 'Levi\'s',
    subcategory: 'Jeans',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        alt: 'Denim Jeans'
      }
    ],
    variants: [
      {
        size: '30',
        color: 'Blue',
        price: 1999,
        originalPrice: 2499,
        stock: 25
      },
      {
        size: '32',
        color: 'Blue',
        price: 1999,
        originalPrice: 2499,
        stock: 30
      },
      {
        size: '34',
        color: 'Blue',
        price: 1999,
        originalPrice: 2499,
        stock: 35
      },
      {
        size: '30',
        color: 'Black',
        price: 1999,
        originalPrice: 2499,
        stock: 20
      },
      {
        size: '32',
        color: 'Black',
        price: 1999,
        originalPrice: 2499,
        stock: 25
      },
      {
        size: '34',
        color: 'Black',
        price: 1999,
        originalPrice: 2499,
        stock: 30
      }
    ],
    features: ['Premium Denim', 'Comfortable Fit', 'Durable'],
    specifications: {
      material: '100% Cotton Denim',
      care: 'Machine Wash',
      fit: 'Slim',
      occasion: 'Casual'
    },
    tags: ['denim', 'jeans', 'casual', 'durable'],
    rating: {
      average: 4.5,
      count: 200
    },
    isFeatured: true
  },
  {
    name: 'Summer Dress',
    description: 'Elegant summer dress perfect for warm weather. Lightweight and comfortable with a flattering silhouette.',
    brand: 'Zara',
    subcategory: 'Dresses',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        alt: 'Summer Dress'
      }
    ],
    variants: [
      {
        size: 'S',
        color: 'Floral',
        price: 1299,
        originalPrice: 1599,
        stock: 15
      },
      {
        size: 'M',
        color: 'Floral',
        price: 1299,
        originalPrice: 1599,
        stock: 20
      },
      {
        size: 'L',
        color: 'Floral',
        price: 1299,
        originalPrice: 1599,
        stock: 18
      },
      {
        size: 'S',
        color: 'Solid Blue',
        price: 1299,
        originalPrice: 1599,
        stock: 12
      },
      {
        size: 'M',
        color: 'Solid Blue',
        price: 1299,
        originalPrice: 1599,
        stock: 16
      },
      {
        size: 'L',
        color: 'Solid Blue',
        price: 1299,
        originalPrice: 1599,
        stock: 14
      }
    ],
    features: ['Lightweight', 'Breathable', 'Elegant Design'],
    specifications: {
      material: 'Cotton Blend',
      care: 'Hand Wash',
      fit: 'A-Line',
      occasion: 'Casual, Party'
    },
    tags: ['dress', 'summer', 'elegant', 'floral'],
    rating: {
      average: 4.3,
      count: 120
    },
    isFeatured: true
  }
];

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@myntra.com',
    password: 'admin123',
    phone: '9876543210',
    gender: 'Male',
    dateOfBirth: new Date('1990-01-01'),
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '9876543211',
    gender: 'Male',
    dateOfBirth: new Date('1995-05-15'),
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    phone: '9876543212',
    gender: 'Female',
    dateOfBirth: new Date('1992-08-20'),
    role: 'user'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myntra-clone');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const categories = await Category.insertMany(sampleCategories);
    console.log(`Created ${categories.length} categories`);

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }
    console.log(`Created ${users.length} users`);

    // Create products
    const products = [];
    for (const productData of sampleProducts) {
      // Assign random category
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      productData.category = randomCategory._id;
      
      const product = new Product(productData);
      await product.save();
      products.push(product);
    }
    console.log(`Created ${products.length} products`);

    console.log('Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@myntra.com / admin123');
    console.log('User: john@example.com / password123');
    console.log('User: jane@example.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder
seedDatabase();

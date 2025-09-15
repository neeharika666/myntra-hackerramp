const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      topProducts
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { orderStatus: { $in: ['Delivered', 'Shipped'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.find()
        .populate('user', 'name email')
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Product.find({ isActive: true })
        .sort({ sales: -1 })
        .limit(5)
        .select('name sales rating')
        .lean()
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenue
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/admin/products
// @desc    Get all products for admin
// @access  Private (Admin)
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;
    
    const filter = {};
    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.category = category;
    if (status) filter.isActive = status === 'active';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total
      }
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// @route   POST /api/admin/products
// @desc    Create new product
// @access  Private (Admin)
router.post('/products', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('subcategory').trim().notEmpty().withMessage('Subcategory is required'),
  body('variants').isArray({ min: 1 }).withMessage('At least one variant is required'),
  body('variants.*.size').notEmpty().withMessage('Size is required for all variants'),
  body('variants.*.color').notEmpty().withMessage('Color is required for all variants'),
  body('variants.*.price').isFloat({ min: 0 }).withMessage('Valid price is required for all variants'),
  body('variants.*.stock').isInt({ min: 0 }).withMessage('Valid stock is required for all variants')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productData = req.body;
    
    // Check if category exists
    const category = await Category.findById(productData.category);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const product = new Product(productData);
    await product.save();
    await product.populate('category', 'name');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Private (Admin)
router.put('/products/:id', [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Product description cannot be empty'),
  body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
  body('variants.*.price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('variants.*.stock').optional().isInt({ min: 0 }).withMessage('Valid stock is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Private (Admin)
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const filter = {};
    if (status) filter.orderStatus = status;
    if (search) filter.orderNumber = new RegExp(search, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'name brand')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total
      }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.put('/orders/:id/status', [
  body('status').isIn(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).withMessage('Invalid status'),
  body('trackingNumber').optional().trim(),
  body('carrier').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, trackingNumber, carrier } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const additionalData = {};
    if (trackingNumber) additionalData.trackingNumber = trackingNumber;
    if (carrier) additionalData.carrier = carrier;

    await order.updateStatus(status, additionalData);
    await order.populate('user', 'name email phone');
    await order.populate('items.product', 'name brand');

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error while updating order status' });
  }
});

// @route   GET /api/admin/categories
// @desc    Get all categories for admin
// @access  Private (Admin)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('productCount')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({ categories });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   POST /api/admin/categories
// @desc    Create new category
// @access  Private (Admin)
router.post('/categories', [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('slug').trim().notEmpty().withMessage('Category slug is required'),
  body('description').optional().trim(),
  body('image.url').notEmpty().withMessage('Category image URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error while creating category' });
  }
});

module.exports = router;

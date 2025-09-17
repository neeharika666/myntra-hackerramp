const express = require('express');
const { body, validationResult } = require('express-validator');
const Wishlist = require('../models/Wishlist.js');
const Product = require('../models/Product.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get user's wishlist
router.get('/wishlist', async (req, res) => {
  try {
    
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        populate: { path: 'reviews.user', strictPopulate: false },
      })
      .lean();
    if (!wishlist) {
      return res.json({ wishlist: [] });
    }

    res.json({ wishlist });
  } catch (err) {
    console.error('Get wishlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product', 'title product_id images variations rating initial_price final_price seller_name');

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
      await wishlist.save();
    }

    // Filter out products that are no longer active
    const validItems = wishlist.items.filter(item => 
      item.product && item.product.isActive
    );

    wishlist.items = validItems;
    await wishlist.save();

    res.json({ wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error while fetching wishlist' });
  }
});

// @route   POST /api/wishlist/add
// @desc    Add item to wishlist
// @access  Private
router.post('/add', authenticateToken, [
  body('productId').isMongoId().withMessage('Valid product ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.body;

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }

    // Check if item already exists in wishlist
    if (wishlist.hasItem(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add item to wishlist
    await wishlist.addItem(productId);
    await wishlist.populate('items.product', 'title product_id images variations rating initial_price final_price seller_name');

    res.json({
      message: 'Item added to wishlist successfully',
      wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error while adding item to wishlist' });
  }
});

// @route   DELETE /api/wishlist/remove
// @desc    Remove item from wishlist
// @access  Private
router.delete('/remove', authenticateToken, [
  body('productId').isMongoId().withMessage('Valid product ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    await wishlist.removeItem(productId);
    await wishlist.populate('items.product', 'title product_id images variations rating initial_price final_price seller_name');

    res.json({
      message: 'Item removed from wishlist successfully',
      wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error while removing item from wishlist' });
  }
});

// @route   DELETE /api/wishlist/clear
// @desc    Clear entire wishlist
// @access  Private
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    await wishlist.clearWishlist();

    res.json({
      message: 'Wishlist cleared successfully',
      wishlist
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ message: 'Server error while clearing wishlist' });
  }
});

// @route   GET /api/wishlist/check/:productId
// @desc    Check if product is in wishlist
// @access  Private
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.json({ inWishlist: false });
    }

    const inWishlist = wishlist.hasItem(productId);
    res.json({ inWishlist });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Server error while checking wishlist' });
  }
});

module.exports = router;

const express = require('express');
const Category = require('../models/Category.js');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all active categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('productCount')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/categories/:slug
// @desc    Get single category by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    }).populate('productCount');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error while fetching category' });
  }
});

// @route   GET /api/categories/:slug/subcategories
// @desc    Get subcategories for a category
// @access  Public
router.get('/:slug/subcategories', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ subcategories: category.subcategories });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ message: 'Server error while fetching subcategories' });
  }
});

module.exports = router;

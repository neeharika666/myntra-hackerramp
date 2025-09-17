const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product.js');
const Category = require('../models/Category.js');
const { optionalAuth } = require('../middleware/auth.js');
const mongoose = require('mongoose');

// const router = express.Router();

// @route   GET /api/products
// // @desc    Get all products with filtering, sorting, and pagination
// // @access  Public
// import express from 'express';
// import { query, validationResult } from 'express-validator';
// import mongoose from 'mongoose';
// import Product from '../models/Product.js';
// import optionalAuth from '../middlewares/optionalAuth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Fetch all products that are active
    const products = await Product.find({})
      
      // console.log(products)
    res.json({ products, totalProducts: products.length });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});


// export default router;;


// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id=req.params.id;
    // console.log("hiiiiiiiiiiiiiiiiiii");
    const product = await Product.findById(req.params.id)
      

    


    res.json({ product });
  } catch (error) {
    // console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// @route   GET /api/products/category/:categorySlug
// @desc    Get products by category
// @access  Public
router.get('/category/:categorySlug', optionalAuth, async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20, subcategory, sort = 'newest' } = req.query;

    // Find category
    const category = await Category.findOne({ slug: categorySlug, isActive: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Build filter
    const filter = { category: category._id, isActive: true };
    if (subcategory) filter.subcategory = subcategory;

    // Build sort
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { 'variants.price': 1 };
        break;
      case 'price_desc':
        sortObj = { 'variants.price': -1 };
        break;
      case 'rating':
        sortObj = { 'rating.average': -1 };
        break;
      case 'popular':
        sortObj = { sales: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      category,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total
      }
    });
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ message: 'Server error while fetching category products' });
  }
});

// @route   GET /api/products/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          $text: { $search: q }
        }
      },
      {
        $project: {
          name: 1,
          brand: 1,
          score: { $meta: 'textScore' }
        }
      },
      {
        $sort: { score: { $meta: 'textScore' } }
      },
      {
        $limit: 10
      }
    ]);

    res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error while fetching suggestions' });
  }
});

// @route   GET /api/products/trending
// @desc    Get trending products
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ views: -1, sales: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ products });
  } catch (error) {
    console.error('Get trending products error:', error);
    res.status(500).json({ message: 'Server error while fetching trending products' });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Server error while fetching featured products' });
  }
});

module.exports = router;

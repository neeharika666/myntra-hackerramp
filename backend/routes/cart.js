const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart.js');
const Product = require('../models/Product.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Find the user's cart
    console.log("req.user._id", req.user._id);
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name brand images final_price');

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    // Remove any items where product no longer exists or inactive
    const validItems = cart.items;

    cart.items = validItems;
    console.log("cart", cart);
    await cart.save();

    res.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error while fetching cart' });
  }
});


// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', authenticateToken, [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], async (req, res) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    const { productId, quantity } = req.body;

    // ✅ Just check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    // ✅ Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // ✅ Add item to cart (no stock, no variants)
    const existingItem = cart.items.find(item => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();

    // ✅ Populate cart with product info
    await cart.populate('items.product', 'name brand images price');

    res.json({
      message: 'Item added to cart successfully',
      cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error while adding item to cart' });
  }
});


// @route   PUT /api/cart/update
// @desc    Update item quantity in cart
// @access  Private
router.put('/update', authenticateToken, [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('variant.size').notEmpty().withMessage('Size is required'),
  body('variant.color').notEmpty().withMessage('Color is required'),
  body('quantity').isInt({ min: 0, max: 10 }).withMessage('Quantity must be between 0 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, variant, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    if (quantity === 0) {
      // Remove item from cart
      await cart.removeItem(productId, variant);
    } else {
      // Check stock availability
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: 'Product not found or unavailable' });
      }

      const variantList = Array.isArray(product.variants) && product.variants.length
        ? product.variants
        : (Array.isArray(product.variations) ? product.variations : []);
      const productVariant = variantList.find(
        v => v.size === variant.size && v.color === variant.color
      );

      if (!productVariant || productVariant.stock < quantity) {
        return res.status(400).json({ 
          message: `Only ${productVariant?.stock || 0} items available in stock` 
        });
      }

      // Update quantity
      await cart.updateQuantity(productId, variant, quantity);
    }

    // Populate the updated cart
    await cart.populate('items.product', 'name brand images variants variations');

    res.json({
      message: 'Cart updated successfully',
      cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error while updating cart' });
  }
});

// @route   DELETE /api/cart/remove
// @desc    Remove item from cart
// @access  Private
router.delete('/remove', authenticateToken, [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('variant.size').notEmpty().withMessage('Size is required'),
  body('variant.color').notEmpty().withMessage('Color is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, variant } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.removeItem(productId, variant);
    await cart.populate('items.product', 'name brand images variants');

    res.json({
      message: 'Item removed from cart successfully',
      cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error while removing item from cart' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.clearCart();

    res.json({
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error while clearing cart' });
  }
});

module.exports = router;

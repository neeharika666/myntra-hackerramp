const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order.js');
const Cart = require('../models/Cart.js');
const Product = require('../models/Product.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', authenticateToken, [
  body('shippingAddress.name').notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.phone').matches(/^[6-9]\d{9}$/).withMessage('Valid shipping phone is required'),
  body('shippingAddress.pincode').matches(/^\d{6}$/).withMessage('Valid shipping pincode is required'),
  body('shippingAddress.address').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.city').notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.state').notEmpty().withMessage('Shipping state is required'),
  body('paymentMethod').isIn(['COD', 'Card', 'UPI', 'Net Banking', 'Wallet']).withMessage('Valid payment method is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate all items and calculate pricing
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          message: `Product ${product?.name || 'Unknown'} is no longer available` 
        });
      }

      const variant = product.variants.find(
        v => v.size === cartItem.variant.size && v.color === cartItem.variant.color
      );

      if (!variant || variant.stock < cartItem.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}` 
        });
      }

      orderItems.push({
        product: product._id,
        variant: cartItem.variant,
        quantity: cartItem.quantity,
        price: variant.price,
        originalPrice: variant.originalPrice
      });

      subtotal += variant.price * cartItem.quantity;
    }

    // Calculate shipping (free above ₹999)
    const shipping = subtotal >= 999 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + shipping + tax;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentDetails: {
        method: paymentMethod,
        status: paymentMethod === 'COD' ? 'Pending' : 'Pending'
      },
      pricing: {
        subtotal,
        shipping,
        discount: 0,
        tax,
        total
      },
      notes
    });

    await order.save();

    // Update product stock and sales
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 
          'variants.$[elem].stock': -item.quantity,
          sales: item.quantity
        }
      }, {
        arrayFilters: [{ 
          'elem.size': item.variant.size, 
          'elem.color': item.variant.color 
        }]
      });
    }

    // Clear cart
    await cart.clearCart();

    // Populate order for response
    await order.populate('items.product', 'name brand images');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error while creating order' });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { user: req.user._id };
    if (status) filter.orderStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(filter)
      .populate('items.product', 'name brand images')
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
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get single order details
// @access  Private
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    }).populate('items.product', 'name brand images variants');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error while fetching order' });
  }
});

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put('/:orderId/cancel', authenticateToken, [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['Pending', 'Confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 
          'variants.$[elem].stock': item.quantity,
          sales: -item.quantity
        }
      }, {
        arrayFilters: [{ 
          'elem.size': item.variant.size, 
          'elem.color': item.variant.color 
        }]
      });
    }

    await order.cancelOrder(reason);
    await order.populate('items.product', 'name brand images');

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error while cancelling order' });
  }
});

// @route   PUT /api/orders/:orderId/return
// @desc    Request return for order
// @access  Private
router.put('/:orderId/return', authenticateToken, [
  body('reason').notEmpty().withMessage('Return reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ 
        message: 'Return can only be requested for delivered orders' 
      });
    }

    // Check if return is within 30 days
    const deliveryDate = order.trackingDetails.deliveredAt;
    const daysSinceDelivery = (new Date() - deliveryDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 30) {
      return res.status(400).json({ 
        message: 'Return period has expired (30 days from delivery)' 
      });
    }

    // For now, just update the order status
    // In a real application, you'd create a return request
    order.orderStatus = 'Returned';
    order.returnReason = reason;
    await order.save();

    res.json({
      message: 'Return request submitted successfully',
      order
    });
  } catch (error) {
    console.error('Return order error:', error);
    res.status(500).json({ message: 'Server error while processing return' });
  }
});

module.exports = router;

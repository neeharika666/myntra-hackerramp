const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/addresses
// @desc    Get user's addresses
// @access  Private
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error while fetching addresses' });
  }
});

// @route   PUT /api/users/addresses/:addressId
// @desc    Update address
// @access  Private
router.put('/addresses/:addressId', authenticateToken, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('pincode').optional().matches(/^\d{6}$/).withMessage('Please enter a valid 6-digit pincode'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { addressId } = req.params;
    const updateData = req.body;

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: { 'addresses.$[].isDefault': false }
      });
    }

    const user = await User.findOneAndUpdate(
      { 
        _id: req.user._id, 
        'addresses._id': addressId 
      },
      { 
        $set: Object.keys(updateData).reduce((acc, key) => {
          acc[`addresses.$.${key}`] = updateData[key];
          return acc;
        }, {})
      },
      { new: true }
    ).select('addresses');

    if (!user) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error while updating address' });
  }
});

// @route   DELETE /api/users/addresses/:addressId
// @desc    Delete address
// @access  Private
router.delete('/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    ).select('addresses');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error while deleting address' });
  }
});

// @route   PUT /api/users/addresses/:addressId/default
// @desc    Set address as default
// @access  Private
router.put('/addresses/:addressId/default', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    // First, unset all defaults
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'addresses.$[].isDefault': false }
    });

    // Then set the selected address as default
    const user = await User.findOneAndUpdate(
      { 
        _id: req.user._id, 
        'addresses._id': addressId 
      },
      { 
        $set: { 'addresses.$.isDefault': true }
      },
      { new: true }
    ).select('addresses');

    if (!user) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({
      message: 'Default address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ message: 'Server error while setting default address' });
  }
});

module.exports = router;

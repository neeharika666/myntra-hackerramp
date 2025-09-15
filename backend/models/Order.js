const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      size: { type: String, required: true },
      color: { type: String, required: true }
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number
    }
  }],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    pincode: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true }
  },
  billingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    pincode: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true }
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['COD', 'Card', 'UPI', 'Net Banking', 'Wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    transactionId: String,
    paidAt: Date
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  trackingDetails: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  notes: String,
  cancellationReason: String,
  returnReason: String,
  refundAmount: Number,
  refundedAt: Date
}, {
  timestamps: true
});

// Index for user and order number
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `MYN${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.orderStatus = status;
  
  if (status === 'Shipped' && additionalData.trackingNumber) {
    this.trackingDetails.trackingNumber = additionalData.trackingNumber;
    this.trackingDetails.carrier = additionalData.carrier;
    this.trackingDetails.shippedAt = new Date();
  }
  
  if (status === 'Delivered') {
    this.trackingDetails.deliveredAt = new Date();
  }
  
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = function(reason) {
  this.orderStatus = 'Cancelled';
  this.cancellationReason = reason;
  return this.save();
};

// Method to process return
orderSchema.methods.processReturn = function(reason, refundAmount) {
  this.orderStatus = 'Returned';
  this.returnReason = reason;
  this.refundAmount = refundAmount;
  this.refundedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);

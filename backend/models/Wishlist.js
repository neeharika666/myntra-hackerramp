const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for user
wishlistSchema.index({ user: 1 });

// Pre-save middleware to calculate total items
wishlistSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  next();
});

// Method to add item to wishlist
wishlistSchema.methods.addItem = function(productId) {
  const existingItem = this.items.find(
    item => item.product.toString() === productId.toString()
  );

  if (!existingItem) {
    this.items.push({ product: productId });
  }
  
  return this.save();
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  
  return this.save();
};

// Method to check if item is in wishlist
wishlistSchema.methods.hasItem = function(productId) {
  return this.items.some(
    item => item.product.toString() === productId.toString()
  );
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Wishlist', wishlistSchema);

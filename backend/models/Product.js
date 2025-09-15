const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    required: [true, 'Subcategory is required']
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' }
  }],
  variants: [{
    size: { type: String, required: true },
    color: { type: String, required: true },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    sku: { type: String, unique: true, sparse: true }
  }],
  features: [String],
  specifications: {
    material: String,
    care: String,
    fit: String,
    occasion: String,
    pattern: String,
    sleeve: String,
    neck: String,
    length: String,
    closure: String
  },
  tags: [String],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    images: [String],
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text', 
  tags: 'text' 
});

// Index for filtering
productSchema.index({ category: 1, subcategory: 1, brand: 1 });
productSchema.index({ 'variants.price': 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.variants.length > 0) {
    const variant = this.variants[0];
    if (variant.originalPrice && variant.originalPrice > variant.price) {
      return Math.round(((variant.originalPrice - variant.price) / variant.originalPrice) * 100);
    }
  }
  return 0;
});

// Method to get lowest price
productSchema.methods.getLowestPrice = function() {
  if (this.variants.length === 0) return 0;
  return Math.min(...this.variants.map(v => v.price));
};

// Method to get highest price
productSchema.methods.getHighestPrice = function() {
  if (this.variants.length === 0) return 0;
  return Math.max(...this.variants.map(v => v.price));
};

// Method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.variants.some(variant => variant.stock > 0);
};

module.exports = mongoose.model('Product', productSchema);

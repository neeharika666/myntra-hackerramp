// import mongoose from 'mongoose';
const mongoose = require('mongoose');

const { Schema } = mongoose;

const VariationSchema = new Schema({
  size: { type: String },
  color: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: { type: String },
});

const ProductSpecificationSchema = new Schema({
  key: String,
  value: String,
});

const ProductSchema = new Schema(
  {
    product_id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    product_description: { type: String },
    rating: { type: Number, default: 0 },
    ratings_count: { type: Number, default: 0 },
    initial_price: { type: String },
    final_price: { type: String },
    currency: { type: String, default: 'INR' },
    discount: { type: Number, default: 0 },
    images: [String], // array of image URLs
    delivery_options: [String],
    product_details: { type: Object },
    breadcrumbs: [String],
    product_specifications: [ProductSpecificationSchema],
    amount_of_stars: { type: Object },
    seller_name: { type: String },
    seller_information: { type: String },
    sizes: [String],
    variations: [VariationSchema],
    best_offer: { type: Object },
    more_offers: [Object],
    url: { type: String },
    category: { type: mongoose.Types.ObjectId, ref: 'Category' },
    subcategory: { type: mongoose.Types.ObjectId, ref: 'Subcategory' },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Product', ProductSchema);

// export default mongoose.model('Product', ProductSchema);

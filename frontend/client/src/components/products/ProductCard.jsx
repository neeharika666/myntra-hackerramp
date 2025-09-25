// src/components/ProductCard/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  // check if this product is in wishlist
  const isWishlisted = wishlist?.items?.some((item) => {
    const itemProductId = item?.product?._id || item?.product;
    return itemProductId === product?._id;
  }) || false;

  // product images & price calculations
  const images = Array.isArray(product?.images) ? product.images : [];
  const primaryImage =
    images?.[0]?.url || (typeof images?.[0] === 'string' ? images[0] : '/placeholder-product.jpg');

  const parsePrice = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numeric = value.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(numeric);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const variantsSource = Array.isArray(product?.variants)
    ? product.variants
    : (Array.isArray(product?.variations) ? product.variations : []);
  const variants = variantsSource.length
    ? variantsSource.map((v) => ({
        size: v?.size || 'STD',
        color: v?.color || 'Default',
        price: typeof v?.price === 'number' ? v.price : parsePrice(v?.price),
        stock: typeof v?.stock === 'number' ? v.stock : 1,
      }))
    : (parsePrice(product?.final_price) > 0
        ? [{ size: 'STD', color: 'Default', price: parsePrice(product?.final_price), stock: 1 }]
        : []);

  const prices = variants
    .map((v) => v?.price)
    .filter((p) => typeof p === 'number' && !Number.isNaN(p));
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const highestPrice = prices.length ? Math.max(...prices) : 0;
  const originalPrice = product?.variants?.[0]?.originalPrice ?? null;
  const discount =
    originalPrice && lowestPrice > 0
      ? Math.round(((originalPrice - lowestPrice) / originalPrice) * 100)
      : 0;

  // toggle wishlist
  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    if (isTogglingWishlist) return;
    setIsTogglingWishlist(true);

    try {
      const productId = String(product?._id || '');
      if (!productId) {
        toast.error('Invalid product id');
        return;
      }
      if (isWishlisted) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(productId)).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist toggle failed:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      return;
    }

    if (isAddingToCart) return;
    setIsAddingToCart(true);

    try {
      await dispatch(
        addToCart({
          productId: product._id,
          quantity: 1,
        })
      ).unwrap();
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Virtual Try-On handler
  // Virtual Try-On handler
  const handleVirtualTryOn = (e) => {
    e.preventDefault();
    e.stopPropagation();
  
    try {
      // Get existing array from localStorage
      const stored = localStorage.getItem('virtualTryOnProducts');
      let productsArray = stored ? JSON.parse(stored) : [];
      localStorage.removeItem('virtualTryOnProduct');

      // Ensure it's an array
      if (!Array.isArray(productsArray)) productsArray = [productsArray];
  
      // Check for duplicates
      const exists = productsArray.some(p => p._id === product._id);
      if (!exists) {
        productsArray.push(product); // add the new product
        toast.success('Product added to Virtual Try-On!');
      } else {
        toast('Product already in Virtual Try-On');
      }
  
      // Save back to localStorage
      localStorage.setItem('virtualTryOnProducts', JSON.stringify(productsArray));
    } catch (err) {
      console.error('Failed to save Virtual Try-On product', err);
      toast.error('Something went wrong');
    }
  };
  
  // price formatter
  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-link">
        <div className="product-image-container">
          <img
            src={primaryImage}
            alt={images?.[0]?.alt || product?.title || product?.name || 'Product'}
            className="product-image"
            loading="lazy"
          />

          {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
        </div>

        <div className="product-info">
          <div className="product-brand">{product?.seller_name || product?.brand || ''}</div>
          <h3 className="product-name">{product?.title || product?.name || ''}</h3>

          <div className="product-rating">
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`star ${i < Math.floor(Number(product?.rating?.average) || 0) ? 'filled' : ''}`}
                />
              ))}
            </div>
            <span className="rating-count">({Number(product?.rating?.count) || 0})</span>
          </div>

          <div className="product-price">
            <span className="current-price">
              {prices.length === 0
                ? ''
                : lowestPrice === highestPrice
                ? formatPrice(lowestPrice)
                : `${formatPrice(lowestPrice)} - ${formatPrice(highestPrice)}`}
            </span>
            {originalPrice && lowestPrice > 0 && originalPrice > lowestPrice && (
              <span className="original-price">{formatPrice(originalPrice)}</span>
            )}
          </div>

          <div className="product-colors">
            {variants.slice(0, 4).map((variant, index) => (
              <div
                key={index}
                className="color-dot"
                style={{
                  backgroundColor:
                    (typeof variant?.color === 'string' && variant.color.toLowerCase()) || '#ccc',
                }}
                title={variant?.color || 'Color'}
              />
            ))}
            {variants.length > 4 && <span className="more-colors">+{variants.length - 4}</span>}
          </div>
        </div>
      </Link>

      {/* Buttons outside Link */}
      <div className="product-actions">
        <button
          className={`action-button wishlist-button ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FiHeart />
        </button>

        <button
          className="action-button cart-button"
          onClick={handleAddToCart}
          title="Add to cart"
        >
          <FiShoppingBag />
        </button>

        <button
          className="action-button tryon-button"
          onClick={handleVirtualTryOn}
          title="Virtual Try-On"
        >
          Try-On
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

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
  const { isAuthenticated } = useSelector(state => state.auth);
  const { wishlist } = useSelector(state => state.wishlist);

  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = wishlist?.items.some(item => item.product._id === product._id);

  const primaryImage = product.images[0]?.url || '/placeholder-product.jpg';
  const lowestPrice = Math.min(...product.variants.map(v => v.price));
  const highestPrice = Math.max(...product.variants.map(v => v.price));
  const originalPrice = product.variants[0]?.originalPrice;
  const discount = originalPrice
    ? Math.round(((originalPrice - lowestPrice) / originalPrice) * 100)
    : 0;

  const handleWishlistToggle = async e => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = async e => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      return;
    }

    if (isAddingToCart) return;

    setIsAddingToCart(true);

    try {
      const availableVariant = product.variants.find(v => v.stock > 0);
      if (!availableVariant) {
        toast.error('Product is out of stock');
        return;
      }

      await dispatch(
        addToCart({
          productId: product._id,
          variant: {
            size: availableVariant.size,
            color: availableVariant.color,
          },
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

  const formatPrice = price => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-link">
        <div className="product-image-container">
          <img
            src={primaryImage}
            alt={product.images[0]?.alt || product.name}
            className="product-image"
            loading="lazy"
          />

          {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}

          <div className="product-actions">
            <button
              className={`action-button wishlist-button ${isWishlisted ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-label="Toggle wishlist"
            >
              <FiHeart />
            </button>

            <button
              className="action-button cart-button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || !product.variants.some(v => v.stock > 0)}
              title="Add to cart"
              aria-label="Add to cart"
            >
              <FiShoppingBag />
            </button>
          </div>
        </div>

        <div className="product-info">
          <div className="product-brand">{product.brand}</div>
          <h3 className="product-name">{product.name}</h3>

          <div className="product-rating">
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`star ${i < Math.floor(product.rating.average) ? 'filled' : ''}`}
                />
              ))}
            </div>
            <span className="rating-count">({product.rating.count})</span>
          </div>

          <div className="product-price">
            <span className="current-price">
              {lowestPrice === highestPrice
                ? formatPrice(lowestPrice)
                : `${formatPrice(lowestPrice)} - ${formatPrice(highestPrice)}`}
            </span>
            {originalPrice && originalPrice > lowestPrice && (
              <span className="original-price">{formatPrice(originalPrice)}</span>
            )}
          </div>

          <div className="product-colors">
            {product.variants.slice(0, 4).map((variant, index) => (
              <div
                key={index}
                className="color-dot"
                style={{ backgroundColor: variant.color.toLowerCase() }}
                title={variant.color}
              />
            ))}
            {product.variants.length > 4 && (
              <span className="more-colors">+{product.variants.length - 4}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;

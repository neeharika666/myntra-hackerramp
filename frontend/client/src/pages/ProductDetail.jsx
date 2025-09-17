import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI } from '../services/api.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice.jsx';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice.jsx';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();

  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const { data, isLoading, error } = useQuery(['product', id], async () => {
    const res = await productsAPI.getProduct(id);
    return res.data;
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="container"><h2>Failed to load product.</h2></div>;

  const product = data?.product || {};
  const images = Array.isArray(product?.images) ? product.images : [];
  const title = product?.name || product?.title || '';
  const description = product?.description || product?.product_description || '';
  const rating = Number(product?.rating?.average ?? product?.rating ?? 0) || 0;
  const ratingsCount = Number(product?.rating?.count ?? product?.ratings_count ?? 0) || 0;
  const currency = product?.currency || 'INR';
  const parsePrice = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numeric = value.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(numeric);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  // Normalize variants from backend (supports `variants` or `variations`; create default if only price present)
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
  const originalPrice = product?.variants?.[0]?.originalPrice ?? null;
  const lowestPrice = prices.length ? Math.min(...prices) : parsePrice(product?.final_price);
  const discount = product?.discount ?? (originalPrice && lowestPrice ? Math.round(((originalPrice - lowestPrice) / originalPrice) * 100) : 0);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const isWishlisted = wishlist?.items?.some((item) => {
    const itemProductId = item?.product?._id || item?.product;
    return itemProductId === product?._id;
  }) || false;

  const availableVariant = variants.length
    ? (variants.find((v) => Number(v?.stock) > 0) || variants[0])
    : null;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      return;
    }
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      if (!availableVariant || Number(availableVariant?.stock) <= 0) {
        toast.error('Product is out of stock');
        return;
      }
      await dispatch(
        addToCart({
          productId: product._id,
          variant: {
            size: availableVariant?.size,
            color: availableVariant?.color,
          },
          quantity: 1,
        })
      ).unwrap();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to update wishlist');
      return;
    }
    if (isTogglingWishlist) return;
    setIsTogglingWishlist(true);
    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update wishlist');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <div className="product-detail container">
      <div className="pd-header">
        <h1>{title}</h1>
        {ratingsCount > 0 && (
          <div className="pd-rating">
            <span>{rating.toFixed(1)}</span>
            <span>({ratingsCount})</span>
          </div>
        )}
      </div>

      <div className="pd-content">
        <div className="pd-images">
          {images.slice(0, 6).map((img, idx) => (
            <img key={idx} src={img?.url || img} alt={img?.alt || title || 'Product'} loading="lazy" />
          ))}
        </div>

        <div className="pd-info">
          <div className="pd-pricing">
            <div className="pd-final">{lowestPrice ? formatPrice(lowestPrice) : ''}</div>
            {originalPrice && lowestPrice && originalPrice > lowestPrice && (
              <div className="pd-original">{formatPrice(originalPrice)}</div>
            )}
            {discount ? <div className="pd-discount">{discount}% OFF</div> : null}
          </div>

          {description ? <p className="pd-description">{description}</p> : null}

          <div className="pd-actions">
            <button
              className="pd-add-to-cart"
              onClick={handleAddToCart}
              disabled={isAddingToCart || !availableVariant || Number(availableVariant?.stock) <= 0}
            >
              {isAddingToCart ? 'Adding…' : 'Add to Cart'}
            </button>
            <button
              className={`pd-wishlist ${isWishlisted ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              disabled={isTogglingWishlist}
            >
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

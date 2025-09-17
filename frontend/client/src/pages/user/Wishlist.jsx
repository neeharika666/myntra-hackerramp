import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import ProductCard from '../../components/products/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist, loading, error } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container">
        <h1>Wishlist</h1>
        <p className="error">Error loading wishlist: {error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>My Wishlist</h1>
      {wishlist?.items?.length === 0 ? (
        <div className="empty-wishlist">
          <h3>Your wishlist is empty</h3>
          <p>Add some products to your wishlist to see them here.</p>
        </div>
      ) : (
        <>
          <p className="wishlist-count">{wishlist?.totalItems || 0} items in your wishlist</p>
          <div className="products-grid">
            {wishlist?.items?.map((item) => (
              <div key={item._id} className="wishlist-item">
                <ProductCard product={item.product} />
                <button 
                  className="remove-from-wishlist"
                  onClick={() => handleRemoveFromWishlist(item.product._id)}
                >
                  Remove from Wishlist
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getCart, removeFromCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';
import './cart.css';

const Cart = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.cart);
  const items = cart?.items || [];

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  const handleRemove = async (productId) => {
    try {
      await dispatch(removeFromCart(productId)).unwrap();
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-page container">
      <h1>Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-item" key={item.product._id}>
                <Link to={`/products/${item.product._id}`}>
                  <img
                    src={item.product.images?.[0]?.url || item.product.images || ''}
                    alt={item.product.name}
                    className="cart-item-img"
                  />
                </Link>
                <div className="cart-item-info">
                  <Link to={`/products/${item.product._id}`} className="cart-item-name">
                    <h3>{item.product.name}</h3>
                  </Link>
                  <p>Price: ₹{item.price}</p>
                  <p>Quantity: {item.quantity}</p>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.product._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <p>Total: ₹{totalPrice}</p>
            <button className="checkout-btn">Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

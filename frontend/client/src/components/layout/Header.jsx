import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice.jsx';
import { getCart } from '../../store/slices/cartSlice.jsx';
import { getWishlist } from '../../store/slices/wishlistSlice.jsx';
import { setSearchOpen } from '../../store/slices/uiSlice.jsx';
import { categoriesAPI } from '../../services/api.jsx';
import {
  FiSearch,
  FiUser,
  FiShoppingBag,
  FiHeart,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { searchOpen } = useSelector((state) => state.ui);

  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCart());
      dispatch(getWishlist());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setShowUserMenu(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      dispatch(setSearchOpen(false));
    }
  };

  const cartItemCount = cart?.totalItems || 0;
  const wishlistItemCount = wishlist?.totalItems || 0;

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">MyShop</Link>
        </div>

        {/* Desktop categories */}
        <nav className="categories">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.slug}`} className="category-link">
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <FiSearch />
          </button>
        </form>

        {/* Icons */}
        <div className="header-icons">
          <div className="icon" onClick={() => navigate('/wishlist')}>
            <FiHeart />
            {wishlistItemCount > 0 && <span className="badge">{wishlistItemCount}</span>}
          </div>
          <div className="icon" onClick={() => navigate('/cart')}>
            <FiShoppingBag />
            {cartItemCount > 0 && <span className="badge">{cartItemCount}</span>}
          </div>
          <div className="icon user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
            <FiUser />
            {showUserMenu && (
              <div className="user-dropdown">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile">Profile</Link>
                    <Link to="/orders">Orders</Link>
                    <button onClick={handleLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="mobile-category-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>
            Cart ({cartItemCount})
          </Link>
          <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)}>
            Wishlist ({wishlistItemCount})
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                Profile
              </Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;

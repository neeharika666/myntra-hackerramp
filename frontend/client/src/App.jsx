import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUserData } from './store/slices/authSlice.jsx';

// Components
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AdminRoute from './components/auth/AdminRoute.jsx';
import Recommendations from './pages/Recommendations.jsx';
// Pages
import ColorMapper from "./pages/user/ColorMapper.jsx";
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Category from './pages/Category.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/auth/Login.jsx';
import VirtualTry from './pages/VirtualTry.jsx';
import Register from './pages/auth/Register.jsx';
import Profile from './pages/user/Profile.jsx';
import Cart from './pages/user/Cart.jsx';
import Wishlist from './pages/user/Wishlist.jsx';
import Orders from './pages/user/Orders.jsx';
import OrderDetail from './pages/user/OrderDetail.jsx';
import Checkout from './pages/user/Checkout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/Products.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminCategories from './pages/admin/Categories.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(loadUserData());
    }
  }, [dispatch, token, isAuthenticated]);

  return (
    <div className="App">
      <Header />
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/colourmap" element={<ColorMapper />} />
          <Route path="/virtualtry" element={<VirtualTry />} />

          
          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/festive"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
         
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <AdminCategories />
              </AdminRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI, categoriesAPI } from '../services/api.jsx';
import ProductCard from '../components/products/ProductCard.jsx';
import CategoryCard from '../components/categories/CategoryCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    'categories',
    () => categoriesAPI.getCategories(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch featured products
  const { isLoading: featuredLoading } = useQuery(
    'featured-products',
    () => productsAPI.getFeaturedProducts(8),
    {
      onSuccess: (response) => {
        setFeaturedProducts(response.data.products);
      },
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch trending products
  const { isLoading: trendingLoading } = useQuery(
    'trending-products',
    () => productsAPI.getTrendingProducts(8),
    {
      onSuccess: (response) => {
        setTrendingProducts(response.data.products);
      },
      staleTime: 5 * 60 * 1000,
    }
  );

  const categories = categoriesData?.data.categories || [];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Fashion & Lifestyle</h1>
            <p>Discover the latest trends in fashion, beauty, and lifestyle</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop Now
            </Link>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="Fashion Hero"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          {categoriesLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="categories-grid">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard key={category._id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products?featured=true" className="view-all-link">
              View All
            </Link>
          </div>
          {featuredLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Products */}
      <section className="trending-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trending Now</h2>
            <Link to="/products?sort=popular" className="view-all-link">
              View All
            </Link>
          </div>
          {trendingLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="products-grid">
              {trendingProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Subscribe to our newsletter for the latest fashion trends and exclusive offers</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter your email address" />
              <button className="btn btn-primary">Subscribe</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🚚</div>
              <h3>Free Shipping</h3>
              <p>Free shipping on orders above ₹999</p>
            </div>
            <div className="feature">
              <div className="feature-icon">↩️</div>
              <h3>Easy Returns</h3>
              <p>30-day return policy</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Secure Payment</h3>
              <p>100% secure payment options</p>
            </div>
            <div className="feature">
              <div className="feature-icon">💬</div>
              <h3>24/7 Support</h3>
              <p>Round-the-clock customer support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

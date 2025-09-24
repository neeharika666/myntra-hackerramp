import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import ProductCard from '../components/products/ProductCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import './Home.css';

const Home = () => {
  const { data: trendingData, isLoading: trendingLoading } = useQuery(
    ['trending-products'],
    async () => {
      const response = await axios.post('http://localhost:5003/api/recommend/trending');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000,
      onError: (error) => console.error('Error fetching trending products', error),
    }
  );

  const trendingProducts = trendingData?.results || [];

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
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
              alt="Fashion Hero"
            />
          </div>
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
          ) : trendingProducts.length === 0 ? (
            <p>No trending products found.</p>
          ) : (
            <div className="products-grid">
              {trendingProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="product-link"
                >
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

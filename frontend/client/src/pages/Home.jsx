import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import CategoryCard from '../components/categories/CategoryCard.jsx';
import ProductCard from '../components/products/ProductCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { categoriesAPI, productsAPI } from '../services/api.jsx';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);

  // =========================
  // Fetch categories
  // =========================
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    'categories',
    () => categoriesAPI.getCategories(),
    { staleTime: 5 * 60 * 1000 }
  );

  // =========================
  // Fetch featured products from recommendation API
  // =========================
  // const { data: featuredProducts, isLoading: featuredLoading } = useQuery(
    const { isLoading: featuredLoading } = useQuery(
      ['featured-recommendations', 'jeans'],
      async () => {
        const response = await axios.post('http://localhost:5003/api/recommend', {
          keywords: ['top','kurti','sarees','sharara'],
          top_n: 40,
        });
        console.log(response.data)
        return response.data; // just return the data
      },
      {
        onSuccess: (data) => {
          setFeaturedProducts(data); // update your local state here
        },
        staleTime: 5 * 60 * 1000, // cache for 5 minutes
        onError: (error) => console.error('Error fetching featured products', error),
      }
    );
  

  // =========================
  // Fetch trending products
  // =========================
  const { isLoading: trendingLoading } = useQuery(
    ['trending-products'],
    async () => {
      const response = await axios.post('http://localhost:5003/api/recommend/trending');
      console.log(response)
      return response.data;
    },
    {
      onSuccess: (data) => setTrendingProducts(data.results),
      staleTime: 5 * 60 * 1000,
      onError: (error) => console.error('Error fetching trending products', error),
    }
  );

  const categories = categoriesData?.data.categories || [];

  // Format price
  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

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
    ) : featuredProducts.length === 0 ? (
      <p>No recommended products found.</p>
    ) : (
      <div className="products-grid">
        {featuredProducts.map((product) => {
          // Get primary image URL and handle relative paths
          const primaryImage =
            product.image_url?.startsWith('http')
              ? product.image_url
              : `http://localhost:5003${product.image_url}`;

          // Calculate discount if needed
          const discount =
            product.initial_price && product.final_price
              ? Math.round(
                  ((product.initial_price - product.final_price) /
                    product.initial_price) *
                    100
                )
              : 0;

          return (
            <ProductCard
              key={product._id}
              product={{
                ...product,
                primaryImage,
                discount,
                prices: [product.final_price, product.initial_price],
                lowestPrice: product.final_price,
                highestPrice: product.initial_price,
                variants: product.variants || [],
                images: product.images || [{ url: primaryImage }],
              }}
            />
          );
        })}
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

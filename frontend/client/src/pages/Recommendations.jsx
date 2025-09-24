// src/pages/Recommendations.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/products/ProductCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import './Recommandations.css';

const Recommendations = () => {
  const [city, setCity] = useState('');
  const [festiveProducts, setFestiveProducts] = useState([]);
  const [weatherProducts, setWeatherProducts] = useState([]);
  const [fashionText, setFashionText] = useState('');
  const [weatherText, setWeatherText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!city.trim()) return alert('Please enter your city');
    setLoading(true);
  
    try {
      const response = await axios.post("http://localhost:5003/api/recommend", { city });
  
      // Axios response is already an object if Flask returns JSON
      const data = response.data;
      console.log(data)

      
      console.log("Fashion Text:", data.fashion_text);
      console.log("Festive Products:", data.festive_products);
  
      setFestiveProducts(data.festive_products || []);
      setWeatherProducts(data.weather_products || []);
      setFashionText(data.fashion_text || '');
      setWeatherText(data.weather_text || '');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      alert('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };
  
  
  

  return (
    <div className="recommendations-page">
      <h1>Recommendations</h1>

      {/* City input */}
      <div className="city-input">
        <input
          type="text"
          placeholder="Enter your city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={fetchRecommendations}>Get Recommendations</button>
      </div>

      {loading && <LoadingSpinner />}

      {/* Festive Fashion Section */}
      <section className="recommendation-section">
        <h2>Festive Fashion</h2>
        {fashionText ? <p className="section-text">{fashionText}</p> : <p>No fashion text available.</p>}
        {festiveProducts.length > 0 ? (
          <div className="products-grid">
            {festiveProducts.map((product) => (
              <ProductCard key={product._id || product.product_id} product={product} />
            ))}
          </div>
        ) : (
          <p>No festive products available.</p>
        )}
      </section>

      {/* Weather-specific Fashion Section */}
      <section className="recommendation-section">
        <h2>Weather-specific Fashion</h2>
        {weatherText ? <p className="section-text">{weatherText}</p> : <p>No weather text available.</p>}
        {weatherProducts.length > 0 ? (
          <div className="products-grid">
            {weatherProducts.map((product) => (
              <ProductCard key={product._id || product.product_id} product={product} />
            ))}
          </div>
        ) : (
          <p>No weather-specific products available.</p>
        )}
      </section>
    </div>
  );
};

export default Recommendations;

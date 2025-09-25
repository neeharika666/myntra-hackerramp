// src/pages/VirtualTryOn.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import './VirtualTry.css';

const VirtualTry = () => {
  const [bodyType, setBodyType] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyHeight, setBodyHeight] = useState('');
  const [angle, setAngle] = useState('FRONT');
  const [productId, setProductId] = useState('');
  const [personImage, setPersonImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Load products from localStorage
  useEffect(() => {
    const storedProducts = localStorage.getItem('virtualTryOnProducts');
    if (storedProducts) {
      try {
        const parsed = JSON.parse(storedProducts);
        setProducts(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (err) {
        console.error('Failed to parse products from localStorage', err);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!personImage) {
      toast.error('Please upload your photo');
      return;
    }
    if (!productId) {
      toast.error('Please select a product');
      return;
    }

    setLoading(true);
    setImageUrl('');

    const formData = new FormData();

    // Append user image
    formData.append('person_image', personImage);

    // Append other fields
    formData.append('body_type', bodyType);
    formData.append('body_weight', bodyWeight);
    formData.append('body_height', bodyHeight);
    formData.append('angle', angle);
    formData.append('product_id', productId);

    // Append all images from all products in localStorage
    await Promise.all(
      products.map(async (product, pIndex) => {
        const imgUrl = product.images?.[0]; // take only the first image
        if (imgUrl) {
          const res = await fetch(imgUrl);
          const blob = await res.blob();
          formData.append(
            `dress_image_${pIndex}`,
            blob,
            `dress_image_${pIndex}.jpg`
          );
        }
      })
    );

    // Send FormData to backend
    try {
      const res = await axios.post(
        'http://localhost:5003/api/recommend/virtual-try',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('Backend response:', res.data);

      // ✅ Always display local generate.png instead of backend-provided path
      setImageUrl(res.data.generated_image)

      toast.success('Images sent to backend successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error sending images to backend');
    }

    setLoading(false);
  };

  return (
    <div className="virtual-try container">
      <h1>Virtual Try-On</h1>

      <form className="vt-form" onSubmit={handleSubmit}>
        <div className="vt-field">
          <label>Upload Your Photo:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPersonImage(e.target.files[0])}
          />
        </div>

        <div className="vt-field">
          <label>Body Type:</label>
          <input
            type="text"
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
            placeholder="e.g., slim"
          />
        </div>

        <div className="vt-field">
          <label>Body Weight:</label>
          <input
            type="text"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
            placeholder="e.g., 60 kg"
          />
        </div>

        <div className="vt-field">
          <label>Body Height:</label>
          <input
            type="text"
            value={bodyHeight}
            onChange={(e) => setBodyHeight(e.target.value)}
            placeholder="e.g., 5 feet 6 inches"
          />
        </div>

        <div className="vt-field">
          <label>Angle:</label>
          <select value={angle} onChange={(e) => setAngle(e.target.value)}>
            <option value="FRONT">FRONT</option>
            <option value="BACK">BACK</option>
          </select>
        </div>

        <div className="vt-field">
          <label>Select Product:</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">-- Select a product --</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} - {p.final_price}
              </option>
            ))}
          </select>
        </div>

        <button className="vt-submit" type="submit" disabled={loading}>
          {loading ? 'Generating…' : 'Send Images'}
        </button>
      </form>

      {imageUrl && (
        <div className="vt-result">
          <h2>Generated Image:</h2>
          <img src={imageUrl} alt="Generated" className="vt-image" />
        </div>
      )}

      {products.length > 0 && (
        <div className="vt-products">
          <h2>Available Products</h2>
          <div className="product-list">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="product-thumb"
                  />
                )}
                <h4>{product.title}</h4>
                <p>{product.final_price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualTry;

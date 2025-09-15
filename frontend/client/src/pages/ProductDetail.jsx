import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="container">
      <h1>Product Detail</h1>
      <p>Product ID: {id}</p>
      <p>This page will show detailed product information, images, reviews, and add to cart functionality.</p>
    </div>
  );
};

export default ProductDetail;

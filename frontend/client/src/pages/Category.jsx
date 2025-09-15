import React from 'react';
import { useParams } from 'react-router-dom';

const Category = () => {
  const { slug } = useParams();

  return (
    <div className="container">
      <h1>Category: {slug}</h1>
      <p>This page will show products filtered by category.</p>
    </div>
  );
};

export default Category;

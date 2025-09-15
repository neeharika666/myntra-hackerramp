import React from 'react';
import { Link } from 'react-router-dom';
import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/category/${category.slug}`} className="category-card">
      <div className="category-image-container">
        <img
          src={category.image?.url}
          alt={category.image?.alt || category.name}
          className="category-image"
          loading="lazy"
        />
        <div className="category-overlay">
          <h3 className="category-name">{category.name}</h3>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;

import React from 'react';
import { useParams } from 'react-router-dom';

const OrderDetail = () => {
  const { id } = useParams();

  return (
    <div className="container">
      <h1>Order Detail</h1>
      <p>Order ID: {id}</p>
      <p>This page will show detailed order information.</p>
    </div>
  );
};

export default OrderDetail;

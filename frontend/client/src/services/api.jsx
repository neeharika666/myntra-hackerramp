import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  
  register: (userData) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  
  addAddress: (addressData) => api.post('/auth/address', addressData),
};

// Products API
export const productsAPI = {
  // getProducts: (params) => api.get('/products', { params }),
  getProducts: async (params) => {
    console.log("Fetching products with params:", params);
    const res = await api.get("/products", { params });
    console.log("Fetched products response:", res.data.products);
    return res;
  },
  
  
  getProduct: (id) => api.get(`/products/${id}`),
  
  getProductsByCategory: (categorySlug, params) =>
    api.get(`/products/category/${categorySlug}`, { params }),
  
  getSearchSuggestions: (query) =>
    api.get('/products/search/suggestions', { params: { q: query } }),
  
  getTrendingProducts: (limit) =>
    api.get('/products/trending', { params: { limit } }),
  
  getFeaturedProducts: (limit) =>
    api.get('/products/featured', { params: { limit } }),
};

// Categories API
export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (slug) => api.get(`/categories/${slug}`),
  getSubcategories: (slug) => api.get(`/categories/${slug}/subcategories`),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (itemData) => api.post('/cart/add', itemData),
  updateCartItem: (itemData) => api.put('/cart/update', itemData),
  removeFromCart: (itemData) => api.delete('/cart/remove', { data: itemData }),
  clearCart: () => api.delete('/cart/clear'),
};

// Wishlist API
export const wishlistAPI = {
  // getWishlist: () => api.get('/wishlist',),
  getWishlist: async () => {
    try {
      const userData = localStorage.getItem('user'); 
      if (!userData) {
        console.error("No userData found in localStorage");
        return;
      }
  
      const parsedData = JSON.parse(userData);
      if (!parsedData?.id) {
        console.error("No user id in parsedData", parsedData);
        return;
      } 
  
      console.log("Calling API for user:", parsedData.id);
  
      const response = await api.get('/wishlist/wish', {
        params: { userId: parsedData.id },
      });
  
      console.log("Wishlist Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  }
  
  ,
  addToWishlist: (productId) => api.post('/wishlist/add', { productId }),
  removeFromWishlist: (productId) => api.delete('/wishlist/remove', { data: { productId } }),
  clearWishlist: () => api.delete('/wishlist/clear'),
  checkWishlistItem: (productId) => api.get(`/wishlist/check/${productId}`),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
  cancelOrder: (orderId, reason) => api.put(`/orders/${orderId}/cancel`, { reason }),
  requestReturn: (orderId, reason) => api.put(`/orders/${orderId}/return`, { reason }),
};

// Users API
export const usersAPI = {
  getAddresses: () => api.get('/users/addresses'),
  updateAddress: (addressId, addressData) => api.put(`/users/addresses/${addressId}`, addressData),
  deleteAddress: (addressId) => api.delete(`/users/addresses/${addressId}`),
  setDefaultAddress: (addressId) => api.put(`/users/addresses/${addressId}/default`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (productData) => api.post('/admin/products', productData),
  updateProduct: (id, productData) => api.put(`/admin/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (categoryData) => api.post('/admin/categories', categoryData),
};

export default api;

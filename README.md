# Myntra Clone - MERN Stack E-commerce Application

A comprehensive e-commerce platform built with the MERN stack (MongoDB, Express.js, React, Node.js) that replicates the core functionality of Myntra, a popular fashion and lifestyle e-commerce platform.

## 🚀 Features

### User Features
- **User Authentication**: Registration, login, profile management
- **Product Browsing**: Browse products by categories, search, filter, and sort
- **Product Details**: Detailed product views with images, variants, and reviews
- **Shopping Cart**: Add/remove items, quantity management
- **Wishlist**: Save favorite products for later
- **Order Management**: Place orders, track status, order history
- **Address Management**: Multiple shipping addresses
- **Responsive Design**: Mobile-first responsive design

### Admin Features
- **Dashboard**: Analytics and overview
- **Product Management**: Add, edit, delete products
- **Order Management**: Process orders, update status
- **Category Management**: Manage product categories
- **User Management**: View user information

### Technical Features
- **JWT Authentication**: Secure user authentication
- **RESTful API**: Well-structured API endpoints
- **Data Validation**: Input validation on both client and server
- **Error Handling**: Comprehensive error handling
- **Image Upload**: Product image management
- **Search & Filter**: Advanced product search and filtering
- **Pagination**: Efficient data pagination
- **Real-time Updates**: Live cart and wishlist updates

## 🛠️ Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication
- **bcryptjs**: Password hashing
- **Multer**: File uploads
- **Cloudinary**: Image storage
- **Stripe**: Payment processing
- **Nodemailer**: Email notifications

### Frontend
- **React**: UI library
- **TypeScript**: Type safety
- **Redux Toolkit**: State management
- **React Query**: Data fetching and caching
- **React Router**: Client-side routing
- **React Hook Form**: Form handling
- **Yup**: Form validation
- **Styled Components**: CSS-in-JS styling
- **React Icons**: Icon library
- **React Hot Toast**: Notifications

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myntra-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/myntra-clone
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:3000

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Stripe (for payments)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Email (for notifications)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

4. **Start the server**
   ```bash
   npm run server
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

### Full Stack Development

To run both backend and frontend simultaneously:

```bash
# From the root directory
npm run dev
```

## 🗄️ Database Schema

### User Model
- Personal information (name, email, phone, gender, date of birth)
- Authentication (password, JWT tokens)
- Addresses (multiple shipping addresses)
- Role-based access (user/admin)

### Product Model
- Basic info (name, description, brand, category)
- Variants (size, color, price, stock)
- Images and specifications
- Ratings and reviews
- SEO and analytics

### Order Model
- Order details and status tracking
- Shipping and billing addresses
- Payment information
- Order items and pricing

### Cart & Wishlist Models
- User-specific cart and wishlist
- Product references and quantities
- Real-time updates

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:slug` - Get products by category
- `GET /api/products/search/suggestions` - Search suggestions

### Cart & Wishlist
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove from cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/products` - Manage products
- `GET /api/admin/orders` - Manage orders

## 🎨 UI Components

### Layout Components
- **Header**: Navigation, search, user menu, cart/wishlist
- **Footer**: Links, social media, newsletter
- **Sidebar**: Filters, categories

### Product Components
- **ProductCard**: Product display with actions
- **ProductDetail**: Detailed product view
- **ProductGrid**: Product listing layout

### Form Components
- **Login/Register**: Authentication forms
- **Checkout**: Order placement form
- **Profile**: User profile management

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables
3. Deploy with Git

### Frontend Deployment (Netlify/Vercel)
1. Build the React app
2. Deploy to hosting platform
3. Configure environment variables

### Database (MongoDB Atlas)
1. Create MongoDB Atlas cluster
2. Configure connection string
3. Set up database access

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Adapted layout with collapsible filters
- **Mobile**: Touch-friendly interface with bottom navigation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test
```

## 📈 Performance Optimizations

- **Image Optimization**: Lazy loading and responsive images
- **Code Splitting**: React lazy loading
- **Caching**: React Query for API caching
- **Pagination**: Efficient data loading
- **Bundle Optimization**: Webpack optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Myntra for design inspiration
- React and Node.js communities
- Open source contributors

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

**Note**: This is a learning project and is not affiliated with Myntra. It's built for educational purposes to demonstrate MERN stack development skills.

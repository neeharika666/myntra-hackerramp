import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-content">
            {/* Online Shopping */}
            <div className="footer-section">
              <h3>Online Shopping</h3>
              <ul>
                <li><Link to="/category/men">Men</Link></li>
                <li><Link to="/category/women">Women</Link></li>
                <li><Link to="/category/kids">Kids</Link></li>
                <li><Link to="/category/home-living">Home & Living</Link></li>
                <li><Link to="/category/beauty">Beauty</Link></li>
                <li><Link to="/category/sports">Sports</Link></li>
              </ul>
            </div>

            {/* Customer Policies */}
            <div className="footer-section">
              <h3>Customer Policies</h3>
              <ul>
                <li><Link to="/contact-us">Contact Us</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/t&c">T&C</Link></li>
                <li><Link to="/terms-of-use">Terms Of Use</Link></li>
                <li><Link to="/track-orders">Track Orders</Link></li>
                <li><Link to="/shipping">Shipping</Link></li>
                <li><Link to="/cancellation">Cancellation</Link></li>
                <li><Link to="/returns">Returns</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/grievance-officer">Grievance Officer</Link></li>
              </ul>
            </div>

            {/* Experience */}
            <div className="footer-section">
              <h3>Experience</h3>
              <ul>
                <li><Link to="/mobile-app">Mobile App</Link></li>
                <li><Link to="/gift-cards">Gift Cards</Link></li>
                <li><Link to="/myntra-insider">Myntra Insider</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/corporate-gifts">Corporate Gifts</Link></li>
              </ul>
            </div>

            {/* Keep In Touch */}
            <div className="footer-section">
              <h3>Keep In Touch</h3>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <FiFacebook />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <FiTwitter />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <FiInstagram />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  <FiYoutube />
                </a>
              </div>
              <div className="newsletter">
                <h4>Subscribe to our newsletter</h4>
                <div className="newsletter-form">
                  <input type="email" placeholder="Enter your email" />
                  <button>Subscribe</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="footer-bottom-left">
              <p>&copy; 2024 Myntra Clone. All rights reserved.</p>
            </div>
            <div className="footer-bottom-right">
              <p>Made with ❤️ for learning purposes</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

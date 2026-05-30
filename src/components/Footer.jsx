import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <span className="logo-icon">🧼</span>
            <span>LaundryHub</span>
          </div>
          <p className="footer-description">
            Your trusted partner for premium laundry care solutions since 2020.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" title="Facebook">f</a>
            <a href="#" className="social-link" title="Twitter">𝕏</a>
            <a href="#" className="social-link" title="Instagram">📷</a>
            <a href="#" className="social-link" title="LinkedIn">in</a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#products">Products</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Customer Service</h4>
          <ul className="footer-links">
            <li><a href="#contact">Contact Us</a></li>
            <li><a href="#shipping">Shipping Info</a></li>
            <li><a href="#returns">Returns</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms & Conditions</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Get in Touch</h4>
          <div className="contact-info">
            <div className="contact-item">
              <Phone size={18} />
              <span>+91 9876 543 210</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>support@laundryhub.com</span>
            </div>
            <div className="contact-item">
              <MapPin size={18} />
              <span>Mumbai, India 400001</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h4>Newsletter</h4>
          <p>Subscribe for exclusive deals and tips</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Your email" />
            <button>Subscribe</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 LaundryHub. All rights reserved.</p>
        <div className="payment-methods">
          <span>Payment Methods:</span>
          <div className="payment-icons">💳 🏦 ₹ 📱</div>
        </div>
      </div>
    </footer>
  );
}

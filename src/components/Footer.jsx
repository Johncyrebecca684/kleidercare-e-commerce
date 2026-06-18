import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="footer animate-fade-in">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <img src="/kc-logo.png" alt="Kleider Care" className="footer-brand-logo" style={{height: '35px'}} />
          </div>
          <p className="footer-description">
            Your trusted partner for complete laundry solutions — from machines to chemicals. Since 2020.
          </p>
          <ul className="example-2">
            <li className="icon-content">
              <a href="https://www.facebook.com/kleidercare" target="_blank" rel="noopener noreferrer" data-social="facebook" aria-label="Facebook">
                <div className="filled"></div>
                <FaFacebook size={20} />
              </a>
              <div className="tooltip">Facebook</div>
            </li>
            <li className="icon-content">
              <a href="https://instagram.com/kleidercare" target="_blank" rel="noopener noreferrer" data-social="instagram" aria-label="Instagram">
                <div className="filled"></div>
                <FaInstagram size={20} />
              </a>
              <div className="tooltip">Instagram</div>
            </li>
            <li className="icon-content">
              <a href="https://linkedin.com/company/kleidercare" target="_blank" rel="noopener noreferrer" data-social="linkedin" aria-label="LinkedIn">
                <div className="filled"></div>
                <FaLinkedin size={20} />
              </a>
              <div className="tooltip">LinkedIn</div>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Quick links</h4>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/cart">Cart</a></li>
            <li><a href="/#products">Products</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul className="footer-links">
            <li><a href="https://www.kleidercare.com/contact-us" target="_blank" rel="noopener noreferrer">Contact Us</a></li>
            <li><button onClick={() => navigate('/track-order')} className="trackOrderLink">Track Order</button></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Get in Touch</h4>
          <div className="contact-info">
            <div className="contact-item">
              <Phone size={18} />
              <a href="tel:+919876543210">+91 9876 543 210</a>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <a href="mailto:info@kleidercare.com">info@kleidercare.com</a>
            </div>
            <div className="contact-item">
              <MapPin size={18} />
              <span>Mumbai, India 400001</span>
            </div>
          </div>
        </div>


      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 All rights reserved. Kleider Care.</p>
        <div className="footer-bottom-links">
          <a href="https://www.kleidercare.com/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
          <a href="https://www.kleidercare.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}

import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp } from 'react-icons/fa';
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
            Your trusted partner for professional laundry services and franchise oppurtunities
          </p>
          <ul className="example-2">
            <li className="icon-content">
              <a href="https://www.facebook.com/profile.php?id=61570405707839" target="_blank" rel="noopener noreferrer" data-social="facebook" aria-label="Facebook">
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
              <a href="https://wa.me/919384814933" target="_blank" rel="noopener noreferrer" data-social="whatsapp" aria-label="WhatsApp">
                <div className="filled"></div>
                <FaWhatsapp size={20} />
              </a>
              <div className="tooltip">WhatsApp</div>
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
          <h4>Contact Info</h4>
          <div className="contact-info">
            <div className="contact-item" style={{ color: '#ffffff', fontWeight: '600' }}>
              Kleider Care Pvt Ltd
            </div>
            <div className="contact-item">
              <MapPin size={18} />
              <span>
                91/1, Periyar Salai Signal,<br />
                Palavakkam ECR, Chennai-600028
              </span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <a href="mailto:support@kleidercare.com">support@kleidercare.com</a>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <a href="tel:+919384814933">+919384814933</a>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <a href="tel:+919944328471">+919944328471</a>
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

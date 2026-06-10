import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import './CheckoutPage.css';

export default function CheckoutPage({ items, total, onPlaceOrder }) {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Calculate breakdown if not provided directly
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = Math.round(subtotal * 0.05);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);
    
    const newOrder = {
      orderId: 'ORD' + Math.floor(Math.random() * 1000000),
      date: new Date().toLocaleDateString(),
      items: items,
      total: total,
      status: 'Processing'
    };

    // Process order and then redirect
    setTimeout(() => {
      onPlaceOrder(newOrder); // Clears cart and saves order
      navigate('/');
    }, 4000);
  };

  if (isSuccess) {
    return (
      <div className="checkout-page-wrapper animate-fade-in">
        <div className="checkout-page-container">
          <div className="checkout-success-page">
            <CheckCircle size={80} className="success-icon-page" />
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your purchase, {formData.name}. We've sent a confirmation email to {formData.email}.</p>
            <p>You will be redirected to the homepage shortly...</p>
            <Link to="/" className="back-to-home-btn" style={{marginTop: '20px'}}>
              Return to Homepage Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If items is empty and not success, redirect to cart or show empty state
  if (items.length === 0) {
    return (
      <div className="checkout-page-wrapper animate-fade-in">
        <div className="checkout-page-container">
           <div className="checkout-success-page">
            <h2>No items to checkout</h2>
            <p>Your cart is empty.</p>
            <Link to="/" className="back-to-home-btn" style={{marginTop: '20px'}}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page-wrapper animate-fade-in">
      <div className="checkout-page-container">
        <div className="checkout-page-header">
          <Link to="/cart" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', marginBottom: '15px', fontWeight: '500' }}>
            <ArrowLeft size={18} /> Back to Cart
          </Link>
          <h1 style={{ color: 'white' }}>Secure Checkout</h1>
        </div>

        <div className="checkout-page-content">
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-page-form">
              <div className="checkout-page-section">
                <h3>Contact Information</h3>
                <div className="form-group-page">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} />
                </div>
                <div className="form-row-page">
                  <div className="form-group-page">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group-page">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="checkout-page-section">
                <h3>Shipping Address</h3>
                <div className="form-group-page">
                  <label htmlFor="address">Address</label>
                  <textarea id="address" name="address" required value={formData.address} onChange={handleChange} rows="3"></textarea>
                </div>
                <div className="form-row-page">
                  <div className="form-group-page">
                    <label htmlFor="city">City</label>
                    <input type="text" id="city" name="city" required value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="form-group-page">
                    <label htmlFor="state">State</label>
                    <input type="text" id="state" name="state" required value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="form-group-page">
                    <label htmlFor="pincode">Pincode</label>
                    <input type="text" id="pincode" name="pincode" required value={formData.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="checkout-summary-section">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#001a4d', margin: '0 0 20px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px'}}>Order Summary</h3>
            
            <div className="summary-items-page">
              {items.map(item => (
                <div key={item.id} className="summary-item-page">
                  <span className="summary-item-page-name">{item.name} <span style={{color: '#888'}}>x {item.quantity}</span></span>
                  <span className="summary-item-page-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-totals-page">
              <div className="summary-row-page">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row-page">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
              <div className="summary-row-page">
                <span>Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="summary-row-page total">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="place-order-btn-page" 
              onClick={handleSubmit}
            >
              Place Order (₹{total})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

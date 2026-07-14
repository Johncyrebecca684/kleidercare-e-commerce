import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import './CartPage.css';

export default function CartPage({ items, onUpdateQuantity, onRemoveItem, loggedInUser, onLoginOpen }) {
  const navigate = useNavigate();
  
  const subtotal = Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18);
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  return (
    <div className="cart-page-wrapper animate-fade-in">
      <div className="cart-page-container">
        <div className="cart-page-header">
          <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1a4a8d', textDecoration: 'none', marginBottom: '15px', fontWeight: '600' }}>
            <ArrowLeft size={18} /> Continue Shopping
          </Link>
          <h1>Your Shopping Cart</h1>
        </div>

      {items.length === 0 ? (
        <div className="empty-cart-page">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any laundry products to your cart yet.</p>
          <Link to="/" className="continue-shopping-btn-main">
            Start Shopping <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="cart-page-content">
          <div className="cart-items-section">
            {items.map(item => (
              <div key={item.id} className="cart-page-item">
                <img src={item.image} alt={item.name} className="cart-page-item-image" />
                
                <div className="cart-page-item-details">
                  <h3 className="cart-page-item-name">{item.name}</h3>
                  <p className="cart-page-item-price">₹{item.price}</p>
                </div>

                <div className="cart-page-item-actions">
                  <button 
                    className="cart-page-quantity-btn"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity === 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="cart-page-quantity">{item.quantity}</span>
                  <button 
                    className="cart-page-quantity-btn"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="cart-page-item-total">
                  ₹{Math.round((item.price * item.quantity) * 100) / 100}
                </div>

                <button 
                  className="cart-page-remove-btn"
                  onClick={() => onRemoveItem(item.id)}
                  title="Remove Item"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary-section">
            <div className="summary-header">
              <h3>Order Summary</h3>
            </div>
            
            <div className="summary-row">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="summary-row">
              <span>Shipping Estimate</span>
              <span className={shipping === 0 ? 'free' : ''}>
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax (18%)</span>
              <span>₹{tax}</span>
            </div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            {subtotal > 0 && subtotal <= 500 && (
              <div className="free-shipping-offer-page">
                💡 Add ₹{500 - subtotal} more for FREE shipping!
              </div>
            )}

            <button 
              className="checkout-btn-main"
              onClick={() => {
                if (!loggedInUser) {
                  onLoginOpen();
                } else {
                  navigate('/checkout');
                }
              }}
            >
              Proceed to Checkout
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

import { X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import './Cart.css';

export default function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={onClose}></div>}
      
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="close-cart" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-content">
          {items.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some laundry products to get started!</p>
              <button className="continue-shopping-btn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map(item => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={item.name} className="cart-item-image" />
                    
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-price">₹{item.price}</p>
                    </div>

                    <div className="cart-item-actions">
                      <button 
                        className="quantity-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity === 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₹{item.price * item.quantity}
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'free' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Tax (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>

                {subtotal <= 500 && (
                  <div className="free-shipping-offer">
                    💡 Add ₹{500 - subtotal} more for FREE shipping!
                  </div>
                )}
              </div>

              <div className="cart-actions">
                <button className="checkout-btn">
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>
                <button className="continue-shopping-btn-secondary" onClick={onClose}>
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

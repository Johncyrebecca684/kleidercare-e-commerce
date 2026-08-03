import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowRight, ArrowLeft, Sparkles, Check, ShoppingBag, ShieldCheck } from 'lucide-react';
import './CartPage.css';

export default function CartPage({ 
  items = [], 
  allProducts = [],
  onAddToCart,
  onUpdateQuantity, 
  onRemoveItem, 
  loggedInUser, 
  onLoginOpen,
  installationAddon = { selected: false, fee: 999 },
  setInstallationAddon
}) {
  const navigate = useNavigate();

  // Dynamically select real store products (spare parts, chemicals, accessories) from our catalog
  let recommendedAddons = allProducts
    .filter(p => !items.some(cartItem => cartItem.id === p.id))
    .filter(p => p.category === 'Genuine Spare Parts' || p.category === 'Chemicals' || p.category === 'Seko' || p.price < 5000)
    .slice(0, 4);

  // Fallback: If no specific add-on matched, take any 4 catalog products not in cart
  if (recommendedAddons.length < 4) {
    const fallbackAddons = allProducts.filter(p => !items.some(cartItem => cartItem.id === p.id) && !recommendedAddons.some(r => r.id === p.id));
    recommendedAddons = [...recommendedAddons, ...fallbackAddons].slice(0, 4);
  }
  
  const subtotal = Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
  const nonChemicalSubtotal = items.filter(item => item.category !== 'Chemicals').reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = (subtotal > 500 || (items.length > 0 && nonChemicalSubtotal === 0)) ? 0 : 50;
  const tax = items.reduce((sum, item) => {
    const itemGst = item.priceWithGst ? (item.priceWithGst - item.price) : (Math.round(item.price * 1.18) - item.price);
    return sum + (itemGst * item.quantity);
  }, 0);
  const installationFee = installationAddon.selected ? installationAddon.fee : 0;
  const total = Math.round((subtotal + shipping + tax + installationFee) * 100) / 100;

  const handleAddAddon = (addon) => {
    if (onAddToCart) {
      onAddToCart(addon);
    }
  };

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
            <div className="cart-items-list">
              {items.map(item => (
                <div key={item.cartItemId || item.id} className="cart-page-item">
                  <img src={item.image} alt={item.name} className="cart-page-item-image" />
                  
                  <div className="cart-page-item-details">
                    <h3 className="cart-page-item-name">{item.name}</h3>
                    {item.selectedWarranty && item.selectedWarranty.type !== 'None' && (
                      <div className="item-warranty-badge">
                        🛡️ {item.selectedWarranty.title} (+₹{item.selectedWarranty.price.toLocaleString('en-IN')})
                      </div>
                    )}
                    <p className="cart-page-item-price">₹{item.price.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="cart-page-item-actions">
                    <button 
                      className="cart-page-quantity-btn"
                      onClick={() => onUpdateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                      disabled={item.quantity === 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="cart-page-quantity">{item.quantity}</span>
                    <button 
                      className="cart-page-quantity-btn"
                      onClick={() => onUpdateQuantity(item.cartItemId || item.id, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="cart-page-item-total">
                    ₹{(Math.round((item.price * item.quantity) * 100) / 100).toLocaleString('en-IN')}
                  </div>

                  <button 
                    className="cart-page-remove-btn"
                    onClick={() => onRemoveItem(item.cartItemId || item.id)}
                    title="Remove Item"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* CART RECOMMENDATIONS / UPSELL WIDGET */}
            <div className="cart-recommendations-widget">
              <div className="recommendations-widget-header">
                <Sparkles size={20} className="sparkle-icon" />
                <div>
                  <h3>Recommended Add-Ons for Your Cart</h3>
                  <p>Frequently bought together to improve performance & machine longevity</p>
                </div>
              </div>

              <div className="recommendations-grid">
                {recommendedAddons.map(addon => {
                  const existing = items.find(i => i.id === addon.id || i.name === addon.name);
                  const addonOrigPrice = addon.originalPrice || Math.round(addon.price * 1.32);
                  const discountPct = Math.round(((addonOrigPrice - addon.price) / addonOrigPrice) * 100);

                  return (
                    <div key={addon.id} className="addon-recommend-card">
                      <div className="addon-card-left">
                        <img src={addon.image} alt={addon.name} className="addon-img" />
                      </div>

                      <div className="addon-card-mid">
                        <h4 className="addon-title">{addon.name}</h4>
                        <p className="addon-desc">{addon.description || `${addon.category} spare part`}</p>
                        <div className="addon-price-line">
                          <span className="addon-curr-price">₹{addon.price.toLocaleString('en-IN')}</span>
                          <span className="addon-orig-price">₹{addonOrigPrice.toLocaleString('en-IN')}</span>
                          <span className="addon-save-tag">Save {discountPct}%</span>
                        </div>
                      </div>

                      <div className="addon-card-right">
                        {existing ? (
                          <button
                            className="addon-added-btn"
                            onClick={() => handleAddAddon(addon)}
                          >
                            <Check size={14} /> Added ({existing.quantity})
                          </button>
                        ) : (
                          <button
                            className="addon-add-btn"
                            onClick={() => handleAddAddon(addon)}
                          >
                            <Plus size={14} /> Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="summary-header">
              <h3>Order Summary</h3>
            </div>
            
            <div className="summary-row">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {installationAddon.selected && (
              <div className="summary-row addon-row">
                <span>Professional Installation</span>
                <span>+₹{installationAddon.fee.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping Estimate</span>
              <span className={shipping === 0 ? 'free' : ''}>
                {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax (18% GST)</span>
              <span>₹{tax.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>

            {subtotal > 0 && shipping > 0 && (
              <div className="free-shipping-offer-page">
                💡 Add ₹{(500 - subtotal).toLocaleString('en-IN')} more for FREE shipping!
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


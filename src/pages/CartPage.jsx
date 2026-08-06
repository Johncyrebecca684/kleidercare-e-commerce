import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowRight, ArrowLeft, Sparkles, Check, ShoppingBag, ShieldCheck } from 'lucide-react';
import { getRecommendations } from '../utils/recommendationEngine';
import './CartPage.css';

export default function CartPage({
  items = [],
  allProducts = [],
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onAddAddon,
  onRemoveAddon,
  loggedInUser,
  onLoginOpen,
  installationAddon = { selected: false, fee: 999 },
  setInstallationAddon
}) {
  const navigate = useNavigate();

  // Helper to check if a product is eligible for AMC
  const isAmcApplicable = (item) => {
    if (!item) return false;
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    if (
      cat.includes('part') ||
      cat.includes('chemical') ||
      cat.includes('detergent') ||
      cat.includes('accessory') ||
      name.includes('bearing') ||
      name.includes('sensor') ||
      name.includes('pump') ||
      name.includes('heater') ||
      name.includes('valve') ||
      name.includes('filter') ||
      name.includes('hose') ||
      name.includes('belt')
    ) {
      return false;
    }

    return (
      cat.includes('laundry machine') ||
      cat.includes('lg') ||
      cat.includes('speed queen') ||
      cat.includes('pon') ||
      cat.includes('equipment') ||
      name.includes('washer') ||
      name.includes('dryer') ||
      name.includes('stacker') ||
      name.includes('giant') ||
      name.includes('titan') ||
      name.includes('machine')
    );
  };

  const getAmcRatesForItem = (item) => {
    const pName = (item?.name || '').toLowerCase();
    const pCat = (item?.category || '').toLowerCase();
    if (pName.includes('lg') || pName.includes('stacker')) {
      return { nonComp: 12500, comp: 18500 };
    } else if (pName.includes('washer') || pCat.includes('washer')) {
      return { nonComp: 15000, comp: 21500 };
    } else if (pName.includes('dryer') || pCat.includes('dryer')) {
      return { nonComp: 9000, comp: 14000 };
    }
    return { nonComp: 12500, comp: 18500 };
  };

  // Use centralized recommendation engine for cart upsell
  const cartRecommendations = getRecommendations({
    type: 'cart_upsell',
    products: allProducts,
    cartItems: items,
    wishlistItems: [],
    searchHistory: [],
    browsingHistory: [],
    limit: 4
  });

  const subtotal = Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
  const nonChemicalSubtotal = items.filter(item => item.category !== 'Chemicals').reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippableSubtotal = items.filter(item => item.category !== 'Chemicals' && item.name !== 'Paper').reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const showShipping = items.length > 0 && shippableSubtotal > 0;
  const shipping = 0; // TEMP: forced to 0 for payment gateway testing
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
                      {item.selectedWarranty && item.selectedWarranty !== 'none' && item.amcWarrantyInfo && (
                        <div
                          className="item-warranty-badge"
                          style={{
                            fontSize: '12px',
                            color: '#0f2b5c',
                            fontWeight: '600',
                            marginTop: '4px',
                            background: '#f0f7ff',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          <span>🛡️ {item.amcWarrantyInfo.type} (+₹{item.amcWarrantyInfo.price.toLocaleString('en-IN')}/yr)</span>
                          <button
                            type="button"
                            onClick={() => onRemoveAddon && onRemoveAddon(item.cartItemId || item.id, 'warranty')}
                            style={{
                              background: '#dbeafe',
                              border: 'none',
                              color: '#1e40af',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              marginLeft: '4px'
                            }}
                            title="Remove AMC Extended Warranty"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      {item.includeProgramSetup && (
                        <div
                          className="item-warranty-badge"
                          style={{
                            fontSize: '12px',
                            color: '#0284c7',
                            fontWeight: '600',
                            marginTop: '4px',
                            background: '#f0f9ff',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid #bae6fd'
                          }}
                        >
                          <span>⚙️ Machine Program Setup (+₹3,500)</span>
                          <button
                            type="button"
                            onClick={() => onRemoveAddon && onRemoveAddon(item.cartItemId || item.id, 'setup')}
                            style={{
                              background: '#e0f2fe',
                              border: 'none',
                              color: '#0369a1',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              marginLeft: '4px'
                            }}
                            title="Remove Machine Program Setup"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      {/* INLINE AMC ADD-ON SELECTOR FOR APPLICABLE COMMERCIAL MACHINERY */}
                      {isAmcApplicable(item) && (
                        <div className="cart-amc-addon-selector" style={{ marginTop: '8px', marginBottom: '6px' }}>
                          {(!item.selectedWarranty || item.selectedWarranty === 'none') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f2b5c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ShieldCheck size={13} color="#0284c7" /> Add Kleider Care AMC Warranty:
                              </span>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => onAddAddon && onAddAddon(item.cartItemId || item.id, 'non-comprehensive')}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    borderRadius: '5px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#334155',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  + Non-Comprehensive (₹{getAmcRatesForItem(item).nonComp.toLocaleString('en-IN')})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAddAddon && onAddAddon(item.cartItemId || item.id, 'comprehensive')}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    borderRadius: '5px',
                                    border: '1px solid #0284c7',
                                    background: '#f0f9ff',
                                    color: '#0369a1',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  + Comprehensive (₹{getAmcRatesForItem(item).comp.toLocaleString('en-IN')})
                                </button>
                              </div>
                            </div>
                          )}

                          {!item.includeProgramSetup && (
                            <button
                              type="button"
                              onClick={() => onAddAddon && onAddAddon(item.cartItemId || item.id, 'setup')}
                              style={{
                                marginTop: '6px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                borderRadius: '5px',
                                border: '1px dashed #0284c7',
                                background: '#ffffff',
                                color: '#0284c7',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              + Add Machine Program Setup (+₹3,500)
                            </button>
                          )}
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
                  {cartRecommendations.map(({ product: addon, reason }) => {
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
                          {reason && <p className="addon-reason-text">✨ {reason}</p>}
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

              {/* AMC Extended Warranty Breakdown in Order Summary */}
              {items.some(i => i.selectedWarranty && i.selectedWarranty !== 'none' && i.amcWarrantyInfo) && (
                <div className="summary-row addon-row" style={{ color: '#0f2b5c', fontWeight: '600' }}>
                  <span>🛡️ Extended Warranty & AMC</span>
                  <span>
                    +₹{items
                      .filter(i => i.selectedWarranty && i.selectedWarranty !== 'none' && i.amcWarrantyInfo)
                      .reduce((sum, i) => sum + (i.amcWarrantyInfo.price * i.quantity), 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Machine Program Setup Breakdown in Order Summary */}
              {items.some(i => i.includeProgramSetup) && (
                <div className="summary-row addon-row" style={{ color: '#0284c7', fontWeight: '600' }}>
                  <span>⚙️ Machine Program Setup</span>
                  <span>
                    +₹{items
                      .filter(i => i.includeProgramSetup)
                      .reduce((sum, i) => sum + (3500 * i.quantity), 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {showShipping && (
                <div className="summary-row">
                  <span>Shipping Estimate</span>
                  <span className={shipping === 0 ? 'free' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
              )}
              <div className="summary-row">
                <span>Tax (18% GST)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>

              {showShipping && subtotal > 0 && shipping > 0 && (
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


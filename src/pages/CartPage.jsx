import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowRight, ArrowLeft, Sparkles, Check, ShoppingBag, ShoppingCart, ShieldCheck, Settings, MapPin, Truck, X } from 'lucide-react';
import { getRecommendations } from '../utils/recommendationEngine';
import { formatImageUrl } from '../utils/imageUtils';
import EmptyCartAnimation from '../components/EmptyCartAnimation';
import SetupProgramButton from '../components/SetupProgramButton';
import ProceedToCheckoutButton from '../components/ProceedToCheckoutButton';
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

  // Helper to check if a product is eligible for AMC (ONLY for LG machines)
  const isAmcApplicable = (item) => {
    return isLgItem(item);
  };

  const isLgItem = (item) => {
    const pName = (item?.name || '').toLowerCase();
    const pCat = (item?.category || '').toLowerCase();
    const brand = (item?.specifications?.['Brand'] || item?.specifications?.['brand'] || '').toLowerCase();
    const specs = JSON.stringify(item?.specifications || {}).toLowerCase();

    return (
      brand.includes('lg') ||
      pCat.includes('lg') ||
      pName.includes('lg') ||
      pName.includes('giant') ||
      pName.includes('titan') ||
      specs.includes('lg') ||
      specs.includes('cwg') ||
      specs.includes('cwt')
    );
  };

  const getAmcRatesForItem = (item) => {
    const pName = (item?.name || '').toLowerCase();
    const specs = JSON.stringify(item?.specifications || {}).toLowerCase();
    const capacity = (item?.specifications?.['Capacity'] || item?.specifications?.['capacity'] || '').toLowerCase();

    const is15kg =
      pName.includes('15') ||
      pName.includes('titan') ||
      capacity.includes('15') ||
      specs.includes('15kg') ||
      specs.includes('15 kg') ||
      specs.includes('titan') ||
      specs.includes('cwt');

    if (is15kg) {
      return { price: 18000 };
    }
    return { price: 15000 };
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
  const shipping = 0; // ₹0 collected online because freight is To-Pay upon delivery
  const tax = items.reduce((sum, item) => {
    const itemGst = item.priceWithGst ? (item.priceWithGst - item.price) : (Math.round(item.price * 1.18) - item.price);
    return sum + (itemGst * item.quantity);
  }, 0);
  const installationFee = installationAddon.selected ? installationAddon.fee : 0;
  const total = Math.round((subtotal + tax + installationFee) * 100) / 100;

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
          <h1 className="cart-main-heading">Your Shopping Cart</h1>
        </div>

        {/* AMAZON-STYLE MOBILE TOP CHECKOUT BLOCK (MOBILE ONLY) */}
        {items.length > 0 && (
          <div className="mobile-cart-top-summary">
            <h2 className="mobile-shopping-cart-title">Shopping Cart</h2>
            <div className="mobile-cart-total-row">
              <span className="mobile-total-label">Total </span>
              <span className="mobile-total-val">₹{total.toLocaleString('en-IN')}.00</span>
              <button
                type="button"
                className="mobile-view-details-btn"
                onClick={() => {
                  const summaryEl = document.querySelector('.cart-summary-section');
                  if (summaryEl) {
                    summaryEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                View details
              </button>
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <ProceedToCheckoutButton
                onClick={() => {
                  if (!loggedInUser) {
                    onLoginOpen();
                  } else {
                    navigate('/checkout');
                  }
                }}
                defaultText={`Proceed to Buy (${items.reduce((s, i) => s + i.quantity, 0)} ${items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'})`}
                proceedingText="Securing Checkout..."
                size="md"
              />
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-cart-page">
            <EmptyCartAnimation />
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
                    <Link to={`/product/${item.id}`} className="cart-page-item-image-link">
                      <img src={formatImageUrl(item.image)} alt={item.name} className="cart-page-item-image" />
                    </Link>

                    <div className="cart-page-item-details">
                      <Link to={`/product/${item.id}`} className="cart-page-item-name-link">
                        <h3 className="cart-page-item-name">{item.name}</h3>
                      </Link>
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldCheck size={14} color="#0f2b5c" /> {item.amcWarrantyInfo.type} (+₹{item.amcWarrantyInfo.price.toLocaleString('en-IN')}/yr)
                          </span>
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
                              marginLeft: '4px'
                            }}
                            title="Remove AMC Extended Warranty"
                          >
                            <X size={11} strokeWidth={2.5} />
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Settings size={14} color="#0284c7" /> Machine Program Setup (+₹18,000)
                          </span>
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
                              marginLeft: '4px'
                            }}
                            title="Remove Machine Program Setup"
                          >
                            <X size={11} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                      {/* INLINE AMC ADD-ON SELECTOR FOR APPLICABLE COMMERCIAL MACHINERY */}
                      {isAmcApplicable(item) && (
                        <div className="cart-amc-addon-selector" style={{ marginTop: '8px', marginBottom: '6px' }}>
                          {(!item.selectedWarranty || item.selectedWarranty === 'none') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f2b5c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ShieldCheck size={13} color="#0284c7" /> Add Kleider Care AMC Plan:
                              </span>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => onAddAddon && onAddAddon(item.cartItemId || item.id, 'amc')}
                                  style={{
                                    padding: '4px 10px',
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
                                  + Add AMC Plan (₹{getAmcRatesForItem(item).price.toLocaleString('en-IN')} + 18% GST = ₹{Math.round(getAmcRatesForItem(item).price * 1.18).toLocaleString('en-IN')})
                                </button>
                              </div>
                            </div>
                          )}

                          {!item.includeProgramSetup && (
                            <div style={{ marginTop: '6px' }}>
                              <SetupProgramButton
                                active={false}
                                onToggle={() => onAddAddon && onAddAddon(item.cartItemId || item.id, 'setup')}
                                defaultText="+ Add Machine Program Setup (+₹18,000)"
                                activeText="✓ Program Setup Added"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              />
                            </div>
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
                    <p>Frequently bought together to improve performance &amp; machine longevity</p>
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
                          <Link to={`/product/${addon.id}`} className="addon-card-left-link">
                            <img src={addon.image} alt={addon.name} className="addon-img" />
                          </Link>
                        </div>

                        <div className="addon-card-mid">
                          <Link to={`/product/${addon.id}`} className="addon-title-link">
                            <h4 className="addon-title">{addon.name}</h4>
                          </Link>
                          {reason && (
                            <p className="addon-reason-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={12} color="#f59e0b" /> {reason}
                            </p>
                          )}
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
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <ShieldCheck size={14} color="#0f2b5c" /> Extended Warranty &amp; AMC
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                      Base: ₹{items.filter(i => i.selectedWarranty && i.selectedWarranty !== 'none' && i.amcWarrantyInfo).reduce((sum, i) => sum + (i.amcWarrantyInfo.price * i.quantity), 0).toLocaleString('en-IN')} | GST @ 18%: ₹{items.filter(i => i.selectedWarranty && i.selectedWarranty !== 'none' && i.amcWarrantyInfo).reduce((sum, i) => sum + Math.round(i.amcWarrantyInfo.price * 0.18 * i.quantity), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span>
                    +₹{items
                      .filter(i => i.selectedWarranty && i.selectedWarranty !== 'none' && i.amcWarrantyInfo)
                      .reduce((sum, i) => sum + (Math.round(i.amcWarrantyInfo.price * 1.18) * i.quantity), 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Machine Program Setup Breakdown in Order Summary */}
              {items.some(i => i.includeProgramSetup) && (
                <div className="summary-row addon-row" style={{ color: '#0284c7', fontWeight: '600' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Settings size={14} color="#0284c7" /> Machine Program Setup
                  </span>
                  <span>
                    +₹{items
                      .filter(i => i.includeProgramSetup)
                      .reduce((sum, i) => sum + (18000 * i.quantity), 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Delivery / Freight Notice Box (No Dropdown) */}
              <div className="cart-delivery-location-box" style={{ marginTop: '14px', marginBottom: '14px', background: '#fff7ed', padding: '12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Truck size={15} color="#ea580c" /> Freight & Delivery Policy
                </label>
                <p style={{ fontSize: '11px', color: '#9a3412', margin: 0, lineHeight: '1.4' }}>
                  Delivery charges are <strong>not collected online</strong>. Customers will pay the actual freight/transport charges directly to the delivery partner upon arrival.
                </p>
              </div>

              <div className="summary-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Shipping / Delivery</span>
                  <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: '600' }}>Pay directly to transporter on delivery</span>
                </div>
                <span style={{ color: '#ea580c', fontWeight: '700', fontSize: '12px' }}>PAY ON DELIVERY</span>
              </div>
              <div className="summary-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Tax (18% GST)</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Includes 18% GST on Products & AMC</span>
                </div>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ marginTop: '24px' }}>
                <ProceedToCheckoutButton
                  onClick={() => {
                    if (!loggedInUser) {
                      onLoginOpen();
                    } else {
                      navigate('/checkout');
                    }
                  }}
                  defaultText="Proceed to Checkout"
                  proceedingText="Securing Checkout..."
                  size="lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


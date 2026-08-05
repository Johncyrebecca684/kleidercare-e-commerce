import { useState } from 'react';
import {
  X,
  Heart,
  ShoppingCart,
  Star,
  ShieldCheck,
  Share2,
  Play,
  CreditCard,
  Zap
} from 'lucide-react';
import './ProductDetailModal.css';

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  wishlistItems = [],
  onToggleWishlist
}) {
  if (!product) return null;

  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedColor, setSelectedColor] = useState('Commercial Stainless Steel');
  const [selectedVariant, setSelectedVariant] = useState(
    product.specifications?.Capacity || 'Standard Capacity'
  );
  const [activeTab, setActiveTab] = useState('specs');
  const [showShareNotice, setShowShareNotice] = useState(false);

  const isWishlisted = wishlistItems.some(item => item.id === product.id);
  const isOutOfStock = (product.stock !== undefined && Number(product.stock) <= 0) || product.stockStatus === 'Out of Stock';

  const effectiveOriginalPrice = product.originalPrice || Math.round(product.price * 1.32);
  const discountPct = Math.round(((effectiveOriginalPrice - product.price) / effectiveOriginalPrice) * 100);

  const finishOptions = [
    { name: 'Commercial Stainless Steel', colorHex: '#94a3b8', img: product.image },
    { name: 'Titanium Silver', colorHex: '#64748b', img: product.image },
    { name: 'Industrial Black', colorHex: '#1e293b', img: product.image }
  ];

  const variantOptions = [
    { label: 'Standard', capacity: 'Standard', price: product.price, disc: discountPct },
    { label: 'Heavy Duty', capacity: 'Heavy Duty (+20%)', price: Math.round(product.price * 1.18), disc: discountPct },
    { label: 'Ultra Commercial', capacity: 'Ultra Commercial (+40%)', price: Math.round(product.price * 1.35), disc: discountPct }
  ];

  const handleShare = () => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const shareMsg = `Check out *${product?.name || 'Commercial Equipment'}* on Kleider Care:\n\nPrice: ₹${(product?.price || 0).toLocaleString('en-IN')}\n\nView product link: ${productUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`;

    window.open(whatsappUrl, '_blank');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(productUrl);
    }
    setShowShareNotice(true);
    setTimeout(() => setShowShareNotice(false), 2500);
  };

  return (
    <div className="pdp-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="pdp-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="pdp-close-btn" onClick={onClose} aria-label="Close detail modal">
          <X size={22} />
        </button>

        {/* BREADCRUMB NAV */}
        <div className="pdp-breadcrumb">
          <span>Home</span> / <span>Commercial Laundry</span> / <span>{product.category}</span> / <span className="active">{product.name}</span>
        </div>

        <div className="pdp-body">
          {/* LEFT MEDIA SHOWCASE COLUMN */}
          <div className="pdp-media-column">
            <div className="pdp-main-image-box">
              <img src={selectedImage} alt={product.name} className="pdp-main-image" />

              <div className="pdp-overlay-icons">
                <button
                  className={`pdp-icon-btn ${isWishlisted ? 'wishlisted' : ''}`}
                  onClick={() => onToggleWishlist(product)}
                  title="Wishlist"
                >
                  <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <button className="pdp-icon-btn" onClick={handleShare} title="Share via WhatsApp">
                  <Share2 size={18} />
                </button>
              </div>

              {showShareNotice && <div className="pdp-share-toast">💬 Opening WhatsApp & Link Copied!</div>}
            </div>

            {/* GALLERY THUMBNAILS & DEMO PREVIEW */}
            <div className="pdp-thumbnails-strip">
              <button
                className={`pdp-thumb-btn ${selectedImage === product.image ? 'active' : ''}`}
                onClick={() => setSelectedImage(product.image)}
              >
                <img src={product.image} alt="Front View" />
              </button>

              <div className="pdp-thumb-video-box" title="Watch Product Demo">
                <img src={product.image} alt="Video Preview" />
                <div className="pdp-play-overlay">
                  <Play size={16} fill="#fff" />
                </div>
              </div>
            </div>

            <div className="pdp-trust-shield">
              <ShieldCheck size={18} className="shield-icon" />
              <span>KleiderCare Trust Shield — 100% Genuine Commercial Certified Equipment</span>
            </div>
          </div>

          {/* RIGHT PRODUCT INFO COLUMN */}
          <div className="pdp-info-column">
            <h1 className="pdp-title">{product.name}</h1>

            {/* RATING & REVIEWS ROW */}
            <div className="pdp-rating-row">
              <span className="pdp-rating-badge">
                {product.rating || 4.3} <Star size={12} fill="#fff" color="#fff" />
              </span>
              <span className="pdp-reviews-count">
                {(product.reviews ? product.reviews * 30 : 12450).toLocaleString('en-IN')} Ratings & {(product.reviews || 890).toLocaleString('en-IN')} Reviews
              </span>
            </div>

            {/* PRICE & DISCOUNT DISPLAY */}
            <div className="pdp-price-box">
              <div className="pdp-price-main">
                <span className="pdp-current-price">₹{product.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="pdp-discount-row">
                <span className="pdp-original-price">₹{effectiveOriginalPrice.toLocaleString('en-IN')}</span>
                <span className="pdp-discount-pct">↓{discountPct}% OFF</span>
              </div>
              <div className="pdp-gst-note">Inclusive of all taxes & GST invoice available</div>
            </div>

            {/* COLOR / FINISH SELECTOR */}
            <div className="pdp-option-section">
              <div className="pdp-option-title">
                Selected Color/Finish: <strong>{selectedColor}</strong>
              </div>
              <div className="pdp-color-options">
                {finishOptions.map((opt) => (
                  <button
                    key={opt.name}
                    className={`pdp-color-thumb ${selectedColor === opt.name ? 'active' : ''}`}
                    onClick={() => setSelectedColor(opt.name)}
                  >
                    <img src={opt.img} alt={opt.name} />
                    <span>{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VARIANT / CAPACITY SELECTOR */}
            <div className="pdp-option-section">
              <div className="pdp-option-title">
                Variant / Capacity: <strong>{selectedVariant}</strong>
              </div>
              <div className="pdp-variant-options">
                {variantOptions.map((varOpt) => (
                  <button
                    key={varOpt.label}
                    className={`pdp-variant-card ${selectedVariant === varOpt.capacity ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(varOpt.capacity)}
                  >
                    <div className="var-label">{varOpt.label}</div>
                    <div className="var-price-row">
                      <span className="var-disc">↓{varOpt.disc}%</span>
                      <span className="var-price">₹{varOpt.price.toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCT DESCRIPTION & SPECIFICATIONS TABLE */}
            <div className="pdp-specs-section">
              <div className="pdp-tabs-header">
                <button
                  className={`pdp-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('specs')}
                >
                  Key Specifications
                </button>
                <button
                  className={`pdp-tab-btn ${activeTab === 'desc' ? 'active' : ''}`}
                  onClick={() => setActiveTab('desc')}
                >
                  Product Description
                </button>
              </div>

              {activeTab === 'specs' ? (
                <div className="pdp-specs-table">
                  {product.specifications ? (
                    Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="pdp-spec-row">
                        <span className="pdp-spec-key">{key}</span>
                        <span className="pdp-spec-val">{val}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="pdp-spec-row">
                        <span className="pdp-spec-key">Category</span>
                        <span className="pdp-spec-val">{product.category}</span>
                      </div>
                      <div className="pdp-spec-row">
                        <span className="pdp-spec-key">Build Grade</span>
                        <span className="pdp-spec-val">Industrial Commercial Heavy-Duty</span>
                      </div>
                      <div className="pdp-spec-row">
                        <span className="pdp-spec-key">Warranty</span>
                        <span className="pdp-spec-val">2 Years Commercial Warranty Included</span>
                      </div>
                      <div className="pdp-spec-row">
                        <span className="pdp-spec-key">Installation</span>
                        <span className="pdp-spec-val">Free On-site Professional Installation</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="pdp-desc-text">
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS (ADD TO CART, EMI, BUY NOW) */}
            <div className="pdp-action-bar">
              <button
                className={`pdp-cart-btn ${isOutOfStock ? 'pdp-btn-disabled' : ''}`}
                onClick={() => { if (!isOutOfStock) { onAddToCart(product); onClose(); } }}
                disabled={isOutOfStock}
                style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', background: '#94a3b8' } : {}}
              >
                <ShoppingCart size={18} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                className={`pdp-emi-btn ${isOutOfStock ? 'pdp-btn-disabled' : ''}`}
                onClick={() => { if (!isOutOfStock) { onAddToCart(product); onClose(); } }}
                disabled={isOutOfStock}
                style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', background: '#64748b' } : {}}
              >
                <CreditCard size={18} />
                <span>
                  <strong>{isOutOfStock ? 'Unavailable' : 'Buy with EMI'}</strong>
                  <small>{isOutOfStock ? 'Item Out of Stock' : `From ₹${Math.round(product.price / 12).toLocaleString('en-IN')}/mo`}</small>
                </span>
              </button>

              <button
                className={`pdp-buynow-btn ${isOutOfStock ? 'pdp-btn-disabled' : ''}`}
                onClick={() => { if (!isOutOfStock) { onBuyNow ? onBuyNow(product) : onAddToCart(product); onClose(); } }}
                disabled={isOutOfStock}
                style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', background: '#475569' } : {}}
              >
                <Zap size={18} />
                <span>{isOutOfStock ? 'Out of Stock' : `Buy Now at ₹${product.price.toLocaleString('en-IN')}`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

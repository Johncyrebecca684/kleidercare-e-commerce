import { useState } from 'react';
import {
  X,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Share2,
  CreditCard,
  Zap,
  Sparkles,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Plus
} from 'lucide-react';
import { getProductType, getRecommendedTargetType, getRecommendationReason } from '../utils/recommendationEngine';
import { formatImageUrl } from '../utils/imageUtils';
import LottieAnimation from './LottieAnimation';
import AddToCartButton from './AddToCartButton';
import BuyNowButton from './BuyNowButton';
import EmiButton from './EmiButton';
import WishlistButton from './WishlistButton';
import './ProductDetailModal.css';

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  wishlistItems = [],
  onToggleWishlist,
  allProducts = []
}) {
  if (!product) return null;

  const formattedProductImage = formatImageUrl(product.image);
  const [selectedImage, setSelectedImage] = useState(formattedProductImage);
  const [addonAdded, setAddonAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const allGalleryImages = Array.from(
    new Set([
      formattedProductImage,
      ...(Array.isArray(product?.images) ? product.images : []),
      selectedImage
    ].filter(Boolean).map(img => formatImageUrl(img)))
  );

  const currentImgIdx = allGalleryImages.indexOf(selectedImage);
  const safeImgIdx = currentImgIdx >= 0 ? currentImgIdx : 0;

  const handlePrevImage = () => {
    const prevIdx = safeImgIdx > 0 ? safeImgIdx - 1 : allGalleryImages.length - 1;
    setSelectedImage(allGalleryImages[prevIdx]);
  };

  const handleNextImage = () => {
    const nextIdx = safeImgIdx < allGalleryImages.length - 1 ? safeImgIdx + 1 : 0;
    setSelectedImage(allGalleryImages[nextIdx]);
  };

  const currentType = getProductType(product);
  const targetType = getRecommendedTargetType(currentType);
  const recommendedAddon = targetType && allProducts.length > 0
    ? allProducts.find(p => p.id !== product.id && getProductType(p) === targetType)
    : null;
  const recommendationReason = recommendedAddon ? getRecommendationReason(currentType, recommendedAddon) : '';
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
            <div className="pdp-main-image-box" style={{ position: 'relative' }}>
              <img src={selectedImage || product.image} alt={product.name} className="pdp-main-image" />

              {/* GALLERY PREV & NEXT NAVIGATION BUTTONS */}
              {allGalleryImages.length > 1 && (
                <>
                  <button
                    className="pdp-gallery-nav-btn pdp-gallery-nav-prev"
                    onClick={handlePrevImage}
                    title="Previous Image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="pdp-gallery-nav-btn pdp-gallery-nav-next"
                    onClick={handleNextImage}
                    title="Next Image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <div className="pdp-overlay-icons">
                <WishlistButton
                  isWishlisted={isWishlisted}
                  onToggle={() => onToggleWishlist(product)}
                  size="md"
                />
                <button className="pdp-icon-btn" onClick={handleShare} title="Share via WhatsApp">
                  <Share2 size={18} />
                </button>
              </div>

              {showShareNotice && <div className="pdp-share-toast">💬 Opening WhatsApp & Link Copied!</div>}
            </div>

            {/* GALLERY THUMBNAILS */}
            <div className="pdp-thumbnails-strip">
              {allGalleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  className={`pdp-thumb-btn ${selectedImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setSelectedImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`View ${idx + 1}`} />
                </button>
              ))}
            </div>

            <div className="pdp-trust-shield">
              <ShieldCheck size={18} className="shield-icon" />
              <span>KleiderCare Trust Shield — 100% Genuine Commercial Certified Equipment</span>
            </div>
          </div>

          {/* RIGHT PRODUCT INFO COLUMN */}
          <div className="pdp-info-column">
            <h1 className="pdp-title">{product.name}</h1>

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
                        <span className="pdp-spec-val">Free in South India region (Location charges apply for North region)</span>
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

            {/* REGIONAL INSTALLATION POLICY NOTICE */}
            <div className="pdp-installation-policy-card" style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#0369a1',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              <MapPin size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#0f2b5c', display: 'block', marginBottom: '2px', fontSize: '13px' }}>
                  Regional Installation Policy
                </strong>
                <span>
                  For all LG Commercial Laundry Machines, installation fees are <strong>FREE for India's South region</strong>. For the North region and other locations, installation charges apply based on the delivery location.
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS (ADD TO CART, EMI, BUY NOW) */}
            <div className="pdp-action-bar">
              <AddToCartButton
                className="pdp-cart-btn-animated"
                onClick={() => {
                  if (!isOutOfStock) {
                    onAddToCart(product);
                    setTimeout(() => {
                      onClose();
                    }, 1400);
                  }
                }}
                isOutOfStock={isOutOfStock}
                defaultText="Add to Cart"
                addedText="Added to Cart!"
                size="md"
              />

              <EmiButton
                className="pdp-emi-btn-animated"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                isOutOfStock={isOutOfStock}
                monthlyPrice={product.price / 12}
                defaultTitle="Buy with EMI"
                size="md"
              />

              <BuyNowButton
                className="pdp-buynow-btn-animated"
                onClick={() => {
                  if (!isOutOfStock) {
                    if (onBuyNow) {
                      onBuyNow(product);
                    } else {
                      onAddToCart(product);
                    }
                    onClose();
                  }
                }}
                isOutOfStock={isOutOfStock}
                price={product.price}
                defaultText="Buy Now"
                processingText="Proceeding..."
                size="md"
              />
            </div>

            {/* RECOMMENDED COMPANION BOX */}
            {recommendedAddon && (
              <div className="pdp-modal-recommendation-box" style={{
                marginTop: '16px',
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '12px',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={22} color="#0284c7" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      Recommended Companion
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                      {recommendedAddon.name} — <span style={{ color: '#16a34a' }}>₹{recommendedAddon.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px', fontWeight: 500 }}>
                      ✨ {recommendationReason}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onAddToCart(recommendedAddon);
                    setAddonAdded(true);
                    setTimeout(() => setAddonAdded(false), 2000);
                  }}
                  style={{
                    padding: '8px 14px',
                    background: addonAdded ? '#16a34a' : '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  {addonAdded ? '✓ Added to Cart' : '+ Add Companion'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

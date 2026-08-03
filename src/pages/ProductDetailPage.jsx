import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import {
  Heart,
  ShoppingCart,
  Star,
  ShieldCheck,
  Share2,
  Play,
  CreditCard,
  Zap,
  ArrowLeft,
  CheckCircle,
  Truck,
  Wrench,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  MessageSquare,
  Plus,
  PackageCheck,
  ShoppingBag
} from 'lucide-react';
import { getRecommendations } from '../utils/recommendationEngine';
import { useBrowsingTracker } from '../hooks/useBrowsingTracker';
import './ProductDetailPage.css';

export default function ProductDetailPage({
  products = [],
  onAddToCart,
  cartCount,
  wishlistItems = [],
  onToggleWishlist,
  loggedInUser,
  onLoginOpen,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = products.find(p => String(p.id) === String(id)) || products[0];

  const [selectedImage, setSelectedImage] = useState(product?.image || '');
  const [selectedColor, setSelectedColor] = useState('Commercial Stainless Steel');
  const [selectedVariant, setSelectedVariant] = useState(
    product?.specifications?.Capacity || 'Standard Capacity'
  );
  const [activeTab, setActiveTab] = useState('specs');
  const [showShareNotice, setShowShareNotice] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // CLIENT REVIEWS & FEEDBACK STATE
  const [reviewsList, setReviewsList] = useState([
    {
      id: 1,
      rating: 4.0,
      headline: 'Wonderful',
      specs: 'Review for: Capacity 7 kg • Color Middle Free Silver • Connectivity Non-WiFi • Star Rating 5',
      comment: 'Excellent product, I purchased for our commercial business setup warranty card signed properly. Great performance and low sound operation!',
      author: 'Neelam Anand',
      location: 'Shillong',
      helpfulCount: 880,
      unhelpfulCount: 199,
      date: 'Sep, 2023',
      isVerified: true,
      userVoted: null,
      image: null
    },
    {
      id: 2,
      rating: 5.0,
      headline: 'Fabulous!',
      specs: 'Review for: Capacity 8 kg • Color Middle Black • Connectivity Non-WiFi • Star Rating 5',
      comment: 'Good product. Highly durable drum and fast spinning speeds. Reduced drying time drastically for our heavy laundry operations.',
      author: 'Prasad Raj',
      location: 'Isnapur',
      helpfulCount: 512,
      unhelpfulCount: 43,
      date: 'Nov, 2023',
      isVerified: true,
      userVoted: null,
      image: product?.image
    },
    {
      id: 3,
      rating: 5.0,
      headline: 'Superb Quality & Value',
      specs: 'Review for: Commercial Grade Heavy Duty • Stainless Steel Finish',
      comment: 'Zero downtime after 6 months of continuous operation. The KleiderCare team completed installation within 24 hours of delivery. Excellent service!',
      author: 'Vikram Mehta',
      location: 'Mumbai',
      helpfulCount: 320,
      unhelpfulCount: 18,
      date: 'Feb, 2024',
      isVerified: true,
      userVoted: null,
      image: null
    }
  ]);

  const { recordView } = useBrowsingTracker();

  useEffect(() => {
    if (product) {
      recordView(product);
    }
  }, [product, recordView]);

  // FREQUENTLY BOUGHT TOGETHER BUNDLE STATE via Recommendation Engine
  const fbtRecommendations = getRecommendations({
    type: 'frequently_bought_together',
    products,
    currentProduct: product,
    limit: 2
  });

  const bundleAddon1 = fbtRecommendations[0]?.product || products.find(p => p.id !== product?.id);
  const bundleAddon1Reason = fbtRecommendations[0]?.reason;
  const bundleAddon2 = fbtRecommendations[1]?.product || products.find(p => p.id !== product?.id && p.id !== bundleAddon1?.id);
  const bundleAddon2Reason = fbtRecommendations[1]?.reason;

  const [checkedBundleItems, setCheckedBundleItems] = useState({ item1: true, item2: true });
  const [bundleNotice, setBundleNotice] = useState(false);

  const selectedBundleCount = 1 + (checkedBundleItems.item1 && bundleAddon1 ? 1 : 0) + (checkedBundleItems.item2 && bundleAddon2 ? 1 : 0);

  const rawBundleTotal = (product?.price || 0) + 
    (checkedBundleItems.item1 && bundleAddon1 ? bundleAddon1.price : 0) + 
    (checkedBundleItems.item2 && bundleAddon2 ? bundleAddon2.price : 0);

  const finalBundleTotal = Math.round(rawBundleTotal * 0.9); // 10% extra bundle discount

  const handleAddBundleToCart = () => {
    onAddToCart(product);

    if (checkedBundleItems.item1 && bundleAddon1) {
      onAddToCart(bundleAddon1);
    }
    if (checkedBundleItems.item2 && bundleAddon2) {
      onAddToCart(bundleAddon2);
    }

    setBundleNotice(true);
    setTimeout(() => setBundleNotice(false), 2500);
  };

  const handleVoteHelpful = (reviewId, type) => {
    setReviewsList(prev => prev.map(r => {
      if (r.id === reviewId) {
        if (r.userVoted === type) return r;
        let newHelpful = r.helpfulCount;
        let newUnhelpful = r.unhelpfulCount;

        if (type === 'helpful') {
          newHelpful += 1;
          if (r.userVoted === 'unhelpful') newUnhelpful -= 1;
        } else {
          newUnhelpful += 1;
          if (r.userVoted === 'helpful') newHelpful -= 1;
        }

        return {
          ...r,
          helpfulCount: newHelpful,
          unhelpfulCount: newUnhelpful,
          userVoted: type
        };
      }
      return r;
    }));
  };

  const handleCreateReview = (e) => {
    e.preventDefault();
    if (!newReview.headline || !newReview.comment || !newReview.author) return;

    const created = {
      id: Date.now(),
      rating: Number(newReview.rating),
      headline: newReview.headline,
      specs: `Review for: ${selectedVariant} • Color ${selectedColor}`,
      comment: newReview.comment,
      author: newReview.author,
      location: newReview.location || 'India',
      helpfulCount: 0,
      unhelpfulCount: 0,
      date: 'Just now',
      isVerified: true,
      userVoted: null,
      image: null
    };

    setReviewsList([created, ...reviewsList]);
    setNewReview({ rating: 5, headline: '', comment: '', author: '', location: '' });
    setShowReviewForm(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) {
      setSelectedImage(product.image);
      setSelectedVariant(product.specifications?.Capacity || 'Standard Capacity');
    }
  }, [id, product]);

  if (!product) {
    return (
      <div className="pdp-page-container">
        <Header
          cartCount={cartCount}
          wishlistCount={wishlistItems.length}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onSigninClick={onLoginOpen}
          loggedInUser={loggedInUser}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
        <div className="pdp-not-found">
          <h2>Product Not Found</h2>
          <button className="pdp-back-shop-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Products
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isWishlisted = wishlistItems.some(item => item.id === product.id);
  const effectiveOriginalPrice = product.originalPrice || Math.round(product.price * 1.32);
  const discountPct = Math.round(((effectiveOriginalPrice - product.price) / effectiveOriginalPrice) * 100);

  const sameCategoryProducts = products.filter(p => p.category === product.category);

  const relatedProducts = products
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const carouselRef = useState(null)[0] || { current: null };
  
  // Create similar products list (using other products or duplicated to fill carousel)
  let similarProducts = products.filter(p => p.id !== product.id && p.category === product.category);
  if (similarProducts.length < 5) {
    similarProducts = [...similarProducts, ...products.filter(p => p.id !== product.id)];
  }

  const scrollCarousel = (direction) => {
    const track = document.getElementById('similar-carousel-track');
    if (track) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShowShareNotice(true);
      setTimeout(() => setShowShareNotice(false), 2000);
    }
  };

  const handleAddToCartClick = () => {
    onAddToCart(product);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNowClick = () => {
    onAddToCart(product);
    navigate('/cart');
  };

  return (
    <div className="pdp-page-wrapper">
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistItems.length}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onSigninClick={onLoginOpen}
        loggedInUser={loggedInUser}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />

      <main className="pdp-main-content">
        {/* BREADCRUMB NAV & BACK BUTTON */}
        <div className="pdp-top-bar">
          <button className="pdp-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Products
          </button>
          <div className="pdp-breadcrumb-trail">
            <span onClick={() => navigate('/')}>Home</span> <ChevronRight size={12} />
            <span onClick={() => { onCategoryChange('All'); navigate('/'); }}>Products</span> <ChevronRight size={12} />
            <span onClick={() => { onCategoryChange(product.category); navigate('/'); }}>{product.category}</span> <ChevronRight size={12} />
            <span className="current">{product.name}</span>
          </div>
        </div>

        {/* FULL SCREEN PDP GRID */}
        <div className="pdp-fullscreen-grid">
          {/* LEFT COLUMN: MEDIA GALLERY & SHOWCASE */}
          <div className="pdp-media-gallery">
            <div className="pdp-main-view-container">
              <img src={selectedImage} alt={product.name} className="pdp-hero-image" />
              
              <div className="pdp-floating-actions">
                <button
                  className={`pdp-action-icon ${isWishlisted ? 'active' : ''}`}
                  onClick={() => onToggleWishlist(product)}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart size={20} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#475569'} />
                </button>
                <button className="pdp-action-icon" onClick={handleShare} title="Share Link">
                  <Share2 size={20} />
                </button>
              </div>

              {showShareNotice && <div className="pdp-copied-toast">✓ Link copied to clipboard!</div>}
            </div>

            {/* THUMBNAIL GALLERY STRIP */}
            <div className="pdp-thumbnails-row">
              <button
                className={`pdp-thumb-card ${selectedImage === product.image ? 'active' : ''}`}
                onClick={() => setSelectedImage(product.image)}
              >
                <img src={product.image} alt="Front View" />
              </button>

              <div className="pdp-thumb-video-card">
                <img src={product.image} alt="Demo Video" />
                <div className="pdp-video-badge">
                  <Play size={14} fill="#fff" />
                </div>
              </div>
            </div>

            <div className="pdp-guarantee-card">
              <ShieldCheck size={20} className="guarantee-icon" />
              <div>
                <strong>KleiderCare Certified Equipment</strong>
                <p>100% Genuine Manufacturer Product with Commercial Warranty & On-site Service</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PRODUCT DETAILS & PURCHASING OPTIONS */}
          <div className="pdp-details-panel">
            <h1 className="pdp-page-title">{product.name}</h1>

            {/* RATING & REVIEWS */}
            <div className="pdp-rating-strip">
              <span className="pdp-star-badge">
                {product.rating || 4.3} <Star size={12} fill="#fff" color="#fff" />
              </span>
              <span className="pdp-rating-counts">
                {(product.reviews ? product.reviews * 30 : 12450).toLocaleString('en-IN')} Ratings & {(product.reviews || 890).toLocaleString('en-IN')} Reviews
              </span>
            </div>

            {/* PRICE CARD */}
            <div className="pdp-price-hero-card">
              <div className="pdp-price-top">
                <span className="pdp-big-price">₹{product.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="pdp-price-savings">
                <span className="pdp-strike-price">₹{effectiveOriginalPrice.toLocaleString('en-IN')}</span>
                <span className="pdp-savings-badge">↓{discountPct}% OFF</span>
              </div>
              <div className="pdp-tax-info">Inclusive of all taxes. GST invoice available for business claims.</div>
            </div>

            {/* REAL AVAILABLE MODELS IN THIS CATEGORY */}
            {sameCategoryProducts.length > 1 && (
              <div className="pdp-selector-group">
                <div className="pdp-group-label">
                  Available Models in <strong>{product.category}</strong>:
                </div>
                <div className="pdp-models-grid">
                  {sameCategoryProducts.slice(0, 6).map((model) => (
                    <button
                      key={model.id}
                      className={`pdp-model-chip ${model.id === product.id ? 'active' : ''}`}
                      onClick={() => navigate(`/product/${model.id}`)}
                    >
                      <span className="model-chip-name">{model.name}</span>
                      <span className="model-chip-price">₹{model.price.toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCT SPECIFICATIONS & DESCRIPTION */}
            <div className="pdp-info-tabs-box">
              <div className="pdp-tabs-nav">
                <button
                  className={`pdp-tab ${activeTab === 'specs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('specs')}
                >
                  Technical Specifications
                </button>
                <button
                  className={`pdp-tab ${activeTab === 'desc' ? 'active' : ''}`}
                  onClick={() => setActiveTab('desc')}
                >
                  Product Description
                </button>
              </div>

              {activeTab === 'specs' ? (
                <div className="pdp-specs-grid">
                  {product.specifications ? (
                    Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="pdp-spec-item">
                        <span className="spec-label">{key}</span>
                        <span className="spec-value">{val}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="pdp-spec-item">
                        <span className="spec-label">Category</span>
                        <span className="spec-value">{product.category}</span>
                      </div>
                      <div className="pdp-spec-item">
                        <span className="spec-label">Build Grade</span>
                        <span className="spec-value">Industrial Heavy Duty</span>
                      </div>
                      <div className="pdp-spec-item">
                        <span className="spec-label">Warranty</span>
                        <span className="spec-value">2 Years Commercial Support</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="pdp-description-content">
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            {/* FIXED ACTION BUTTONS BAR */}
            <div className="pdp-primary-actions">
              <button className="pdp-btn-cart" onClick={handleAddToCartClick}>
                <ShoppingCart size={18} />
                Add to Cart
              </button>

              <button className="pdp-btn-emi" onClick={handleAddToCartClick}>
                <CreditCard size={18} />
                <div>
                  <strong>Buy with EMI</strong>
                  <small>From ₹{Math.round(product.price / 12).toLocaleString('en-IN')}/mo</small>
                </div>
              </button>

              <button className="pdp-btn-buynow" onClick={handleBuyNowClick}>
                <Zap size={18} />
                <span>Buy Now at ₹{product.price.toLocaleString('en-IN')}</span>
              </button>
            </div>

            {addedNotice && (
              <div className="pdp-added-banner">✓ Added to cart successfully!</div>
            )}
          </div>
        </div>

        {/* FREQUENTLY BOUGHT TOGETHER BUNDLE SECTION */}
        <section className="frequently-bought-section">
          <div className="fbt-header">
            <div className="fbt-title-group">
              <PackageCheck size={22} className="fbt-icon" />
              <div>
                <h2 className="fbt-heading">Frequently Bought Together</h2>
                <p className="fbt-subheading">Bundle these complementary items with your product and save an extra 10% on the total order</p>
              </div>
            </div>
            <span className="fbt-discount-badge">⚡ 10% Extra Bundle Discount</span>
          </div>

          <div className="fbt-content-grid">
            {/* IMAGES COMBO ROW */}
            <div className="fbt-images-combo">
              <div className="fbt-img-box main">
                <img src={product.image} alt={product.name} />
                <span className="fbt-item-tag">This item</span>
              </div>

              {checkedBundleItems.item1 && bundleAddon1 && (
                <>
                  <span className="fbt-plus-symbol">+</span>
                  <div className="fbt-img-box">
                    <img src={bundleAddon1.image} alt={bundleAddon1.name} />
                  </div>
                </>
              )}

              {checkedBundleItems.item2 && bundleAddon2 && (
                <>
                  <span className="fbt-plus-symbol">+</span>
                  <div className="fbt-img-box">
                    <img src={bundleAddon2.image} alt={bundleAddon2.name} />
                  </div>
                </>
              )}
            </div>

            {/* CHECKBOXES & PRICE SUMMARY */}
            <div className="fbt-details-summary">
              <div className="fbt-checkbox-list">
                <label className="fbt-checkbox-row disabled">
                  <input type="checkbox" checked disabled />
                  <span>
                    <strong>This item:</strong> {product.name} — <span className="fbt-item-price">₹{product.price.toLocaleString('en-IN')}</span>
                  </span>
                </label>

                {bundleAddon1 && (
                  <label className="fbt-checkbox-row">
                    <input
                      type="checkbox"
                      checked={checkedBundleItems.item1}
                      onChange={(e) => setCheckedBundleItems(prev => ({ ...prev, item1: e.target.checked }))}
                    />
                    <span>
                      <strong>Add-on 1:</strong> {bundleAddon1.name} — <span className="fbt-item-price">₹{bundleAddon1.price.toLocaleString('en-IN')}</span>
                      {bundleAddon1Reason && <span style={{ display: 'block', fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>✨ {bundleAddon1Reason}</span>}
                    </span>
                  </label>
                )}

                {bundleAddon2 && (
                  <label className="fbt-checkbox-row">
                    <input
                      type="checkbox"
                      checked={checkedBundleItems.item2}
                      onChange={(e) => setCheckedBundleItems(prev => ({ ...prev, item2: e.target.checked }))}
                    />
                    <span>
                      <strong>Add-on 2:</strong> {bundleAddon2.name} — <span className="fbt-item-price">₹{bundleAddon2.price.toLocaleString('en-IN')}</span>
                      {bundleAddon2Reason && <span style={{ display: 'block', fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>✨ {bundleAddon2Reason}</span>}
                    </span>
                  </label>
                )}
              </div>

              {/* BUNDLE TOTAL & 1-CLICK ADD BUTTON */}
              <div className="fbt-summary-action-box">
                <div className="fbt-price-total">
                  <span className="fbt-total-label">Total Bundle Price ({selectedBundleCount} items):</span>
                  <div className="fbt-price-numbers">
                    <span className="fbt-strike">₹{rawBundleTotal.toLocaleString('en-IN')}</span>
                    <span className="fbt-final">₹{finalBundleTotal.toLocaleString('en-IN')}</span>
                    <span className="fbt-save-pill">Save 10% Extra</span>
                  </div>
                </div>

                <button className="fbt-add-all-btn" onClick={handleAddBundleToCart}>
                  <ShoppingBag size={18} />
                  Add Selected ({selectedBundleCount} items) to Cart
                </button>

                {bundleNotice && <div className="fbt-added-toast">✓ Added bundle items to cart!</div>}
              </div>
            </div>
          </div>
        </section>

        {/* SIMILAR PRODUCTS SECTION */}
        {similarProducts.length > 0 && (
          <section className="similar-products-section">
            <div className="similar-section-header">
              <h2>Similar Products</h2>
              <div className="similar-top-nav">
                <button
                  className="similar-circle-nav-btn"
                  onClick={() => scrollCarousel('right')}
                  aria-label="Next products"
                >
                  →
                </button>
              </div>
            </div>

            <div className="similar-carousel-container">
              <div className="similar-carousel-track" id="similar-carousel-track">
                {similarProducts.map((simProd, idx) => {
                  const simOrigPrice = simProd.originalPrice || Math.round(simProd.price * 1.35);
                  const simDiscount = Math.round(((simOrigPrice - simProd.price) / simOrigPrice) * 100);
                  const isBestseller = idx % 2 === 0;

                  return (
                    <div
                      key={simProd.id + '-' + idx}
                      className="similar-product-card"
                      onClick={() => {
                        navigate(`/product/${simProd.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="similar-image-container">
                        <img src={simProd.image} alt={simProd.name} className="similar-card-img" />
                        
                        {isBestseller ? (
                          <span className="similar-bestseller-badge">Bestseller</span>
                        ) : (
                          <span className="similar-ad-badge">AD</span>
                        )}

                        <div className="similar-rating-pill">
                          <span>{simProd.rating || 4.4}</span>
                          <Star size={10} fill="#fff" color="#fff" />
                        </div>
                      </div>

                      <div className="similar-card-details">
                        <h4 className="similar-card-name">{simProd.name}</h4>
                        <div className="similar-discount-text">{simDiscount}% OFF</div>
                        <div className="similar-card-price-row">
                          <span className="similar-card-orig-price">₹{simOrigPrice.toLocaleString('en-IN')}</span>
                          <span className="similar-card-curr-price">₹{simProd.price.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="similar-bank-offer-text">₹{Math.round(simProd.price * 0.9).toLocaleString('en-IN')} with Bank offer</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="similar-floating-arrow-btn"
                onClick={() => scrollCarousel('right')}
                aria-label="Scroll Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </section>
        )}

        {/* CLIENT FEEDBACKS & REVIEWS SECTION */}
        <section className="client-reviews-section">
          <div className="reviews-section-header">
            <div>
              <h2 className="reviews-title">Ratings & Client Feedbacks</h2>
              <p className="reviews-subtitle">Real verified customer feedback and operational reviews</p>
            </div>
          </div>

          {/* CLIENT REVIEWS FEED LIST */}
          <div className="reviews-feed-list">
            {reviewsList.map((rev) => (
              <div key={rev.id} className="client-review-card">
                {/* RATING & HEADLINE */}
                <div className="rev-stars-row">
                  <div className="rev-green-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        fill={star <= Math.floor(rev.rating) ? '#16a34a' : '#e2e8f0'}
                        color={star <= Math.floor(rev.rating) ? '#16a34a' : '#cbd5e1'}
                      />
                    ))}
                  </div>
                  <span className="rev-rating-score">{rev.rating.toFixed(1)}</span>
                  <span className="rev-headline-dot">•</span>
                  <span className="rev-headline-text">{rev.headline}</span>
                </div>

                {/* REVIEW SPECS SUBTITLE */}
                <div className="rev-specs-subtitle">{rev.specs}</div>

                {/* REVIEW COMMENT TEXT */}
                <p className="rev-comment-text">{rev.comment}</p>

                {/* USER ATTACHED PHOTO THUMBNAIL */}
                {rev.image && (
                  <div className="rev-image-thumb-box">
                    <img src={rev.image} alt="Client attached photo" />
                  </div>
                )}

                {/* AUTHOR NAME & LOCATION */}
                <div className="rev-author-line">
                  {rev.author} {rev.location && `, ${rev.location}`}
                </div>

                {/* HELPFUL / UNHELPFUL BUTTONS & VERIFIED TAG */}
                <div className="rev-action-footer">
                  <div className="rev-helpful-buttons">
                    <button
                      className={`helpful-btn ${rev.userVoted === 'helpful' ? 'active' : ''}`}
                      onClick={() => handleVoteHelpful(rev.id, 'helpful')}
                    >
                      <ThumbsUp size={14} />
                      <span>Helpful for {rev.helpfulCount}</span>
                    </button>

                    <button
                      className={`unhelpful-btn ${rev.userVoted === 'unhelpful' ? 'active' : ''}`}
                      onClick={() => handleVoteHelpful(rev.id, 'unhelpful')}
                    >
                      <ThumbsDown size={14} />
                      <span>{rev.unhelpfulCount}</span>
                    </button>
                  </div>

                  <div className="rev-verified-tag">
                    <CheckCircle2 size={14} className="verified-check-icon" />
                    <span>Verified Purchase • {rev.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

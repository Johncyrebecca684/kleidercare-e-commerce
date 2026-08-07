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
  ChevronUp,
  ChevronDown,
  Home,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  MessageSquare,
  Plus,
  PackageCheck,
  ShoppingBag,
  Phone,
  FileText,
  Calendar,
  X,
  Clock,
  Sparkles,
  Check,
  HelpCircle,
  Info
} from 'lucide-react';
import { getRecommendations, getProductType, getRecommendedTargetType } from '../utils/recommendationEngine';
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
  const [selectedWarranty, setSelectedWarranty] = useState('none'); // 'none', 'non-comprehensive', 'comprehensive'
  const [includeProgramSetup, setIncludeProgramSetup] = useState(false);
  const [showAmcScheduleModal, setShowAmcScheduleModal] = useState(false);
  const [showAmcDetails, setShowAmcDetails] = useState(true);

  // Check if AMC is applicable to the current product
  const isAmcApplicable = () => {
    if (!product) return false;
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const specs = JSON.stringify(product.specifications || {}).toLowerCase();

    // 1. Exclude chemical products & chemical packages
    const isChemicalRelated =
      cat.includes('chemical') ||
      cat.includes('detergent') ||
      name.includes('chemical') ||
      name.includes('detergent') ||
      name.includes('retail laundry package') ||
      name.includes('spotting') ||
      name.includes('stain') ||
      name.includes('emulsifier') ||
      name.includes('softener') ||
      desc.includes('detergent') ||
      desc.includes('emulsifier') ||
      desc.includes('softener') ||
      specs.includes('kc ld') ||
      specs.includes('eml conc');

    // 2. Exclude spare parts, accessories, and individual components
    const isSparePart =
      cat.includes('part') ||
      cat.includes('accessory') ||
      name.includes('bearing') ||
      name.includes('sensor') ||
      name.includes('pump') ||
      name.includes('heater') ||
      name.includes('valve') ||
      name.includes('filter') ||
      name.includes('hose') ||
      name.includes('belt');

    if (isChemicalRelated || isSparePart) {
      return false;
    }

    // 3. Check for Machine Packages (e.g. Giant Electric Package, Titan Gas Package, Wet Pro Package)
    const isMachinePackage =
      (cat.includes('package') || name.includes('package')) &&
      (name.includes('washer') ||
        name.includes('dryer') ||
        name.includes('giant') ||
        name.includes('titan') ||
        name.includes('wet pro') ||
        name.includes('machine') ||
        specs.includes('washer') ||
        specs.includes('dryer'));

    // 4. Applicable to Commercial Laundry Machines, Heavy Equipment & Machine Packages
    return (
      isMachinePackage ||
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

  // Official Kleider Care AMC Pricing based on product type
  const getAmcPrices = () => {
    const pName = (product?.name || '').toLowerCase();
    const pCat = (product?.category || '').toLowerCase();
    const specs = JSON.stringify(product?.specifications || {}).toLowerCase();

    if (pName.includes('titan') || specs.includes('titan')) {
      return { nonComp: 18000, comp: 26000, label: 'LG 15 kg Titan Commercial Package / Machine' };
    } else if (pName.includes('giant') || specs.includes('giant')) {
      return { nonComp: 14500, comp: 21000, label: 'LG 10 kg Giant Commercial Package / Machine' };
    } else if (pName.includes('lg') || pName.includes('stacker')) {
      return { nonComp: 12500, comp: 18500, label: 'LG Commercial Laundry Equipment' };
    } else if (pName.includes('washer') || pCat.includes('washer')) {
      return { nonComp: 15000, comp: 21500, label: 'Speed Queen / Heavy Duty Washer' };
    } else if (pName.includes('dryer') || pCat.includes('dryer')) {
      return { nonComp: 9000, comp: 14000, label: 'Speed Queen / Heavy Duty Dryer' };
    }
    return { nonComp: 15000, comp: 22500, label: 'Commercial Machine Package / Equipment' };
  };

  const amcRates = getAmcPrices();

  // Dynamic total price including selected AMC warranty and machine program setup
  const getCurrentProductTotalPrice = () => {
    if (!product) return 0;
    let total = product.price;
    if (selectedWarranty === 'non-comprehensive') {
      total += amcRates.nonComp;
    } else if (selectedWarranty === 'comprehensive') {
      total += amcRates.comp;
    }
    if (includeProgramSetup) {
      total += 3500;
    }
    return total;
  };

  const currentTotalPrice = getCurrentProductTotalPrice();

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
          products={products}
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

  // Create recommended & similar products list prioritizing rule matches:
  // Chemical -> Dosing Pump, Dosing Pump -> Chemical, Washer -> Dryer, Dryer -> Washer
  const currentProductType = getProductType(product);
  const targetRecommendedType = getRecommendedTargetType(currentProductType);

  let targetRecommendedProducts = [];
  if (targetRecommendedType) {
    targetRecommendedProducts = products.filter(p => p.id !== product.id && getProductType(p) === targetRecommendedType);
  }

  let sameCatProducts = products.filter(p => p.id !== product.id && p.category === product.category && !targetRecommendedProducts.some(t => t.id === p.id));
  let otherProducts = products.filter(p => p.id !== product.id && !targetRecommendedProducts.some(t => t.id === p.id) && !sameCatProducts.some(s => s.id === p.id));

  let similarProducts = [...targetRecommendedProducts, ...sameCatProducts, ...otherProducts];

  const getSectionTitle = () => {
    if (currentProductType === 'washer') return 'Recommended Dryers & Complementary Setup';
    if (currentProductType === 'dryer') return 'Recommended Washers & Complementary Setup';
    if (currentProductType === 'chemical') return 'Recommended Seko Dosing Pumps';
    if (currentProductType === 'dosing_pump') return 'Recommended Wet Cleaning Chemicals';
    return 'Recommended & Similar Products';
  };

  const scrollCarousel = (direction) => {
    const track = document.getElementById('similar-carousel-track');
    if (track) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleShare = () => {
    const productUrl = `${window.location.origin}/product/${product.id || id}`;
    const shareMsg = `Check out *${product?.name || 'Commercial Equipment'}* on Kleider Care:\n\nPrice: ₹${(product?.price || 0).toLocaleString('en-IN')}\n\nView product link: ${productUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`;

    window.open(whatsappUrl, '_blank');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(productUrl);
    }
    setShowShareNotice(true);
    setTimeout(() => setShowShareNotice(false), 2500);
  };

  const getProductForCart = () => {
    let extraCost = 0;
    let warrantyInfo = null;

    if (selectedWarranty === 'non-comprehensive') {
      extraCost += amcRates.nonComp;
      warrantyInfo = { type: 'Non-Comprehensive AMC', price: amcRates.nonComp, visits: '3/year', parts: 'Charged extra' };
    } else if (selectedWarranty === 'comprehensive') {
      extraCost += amcRates.comp;
      warrantyInfo = { type: 'Comprehensive AMC', price: amcRates.comp, visits: '3/year', parts: 'Included (excl. consumables)' };
    }

    if (includeProgramSetup) {
      extraCost += 3500;
    }

    if (extraCost > 0) {
      return {
        ...product,
        price: product.price + extraCost,
        basePrice: product.price,
        selectedWarranty,
        amcWarrantyInfo: warrantyInfo,
        includeProgramSetup
      };
    }
    return product;
  };

  const isOutOfStock = (product.stock !== undefined && Number(product.stock) <= 0) || product.stockStatus === 'Out of Stock';

  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(getProductForCart());
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    onAddToCart(getProductForCart());
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
        products={products}
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

        {/* STICKY PDP SUB-NAVIGATION TABS */}
        <div className="pdp-sticky-subnav">
          <div className="pdp-subnav-inner">
            <button
              className={`pdp-subnav-link ${activeTab === 'overview' || !activeTab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('overview');
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
            >
              Overview
            </button>
            <button
              className={`pdp-subnav-link ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('specs');
                document.getElementById('pdp-specs-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Tech Specs
            </button>
            <button
              className={`pdp-subnav-link ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('feedback');
                document.getElementById('pdp-feedback-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Customer Feedback & Reviews
            </button>
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

              {showShareNotice && <div className="pdp-copied-toast">💬 Opening WhatsApp & Link Copied!</div>}
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

            {/* RATING & REVIEWS & STOCK BADGE */}
            <div className="pdp-rating-strip" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span className="pdp-star-badge">
                {product.rating || 4.3} <Star size={12} fill="#fff" color="#fff" />
              </span>
              <span className="pdp-rating-counts">
                {(product.reviews ? product.reviews * 30 : 12450).toLocaleString('en-IN')} Ratings & {(product.reviews || 890).toLocaleString('en-IN')} Reviews
              </span>
              {isOutOfStock ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', fontWeight: '700', fontSize: '13px', border: '1px solid #fecaca' }}>
                  ⚠️ Currently Out of Stock
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a', fontWeight: '700', fontSize: '13px', border: '1px solid #bbf7d0' }}>
                  ✓ In Stock (Ready to Dispatch)
                </span>
              )}
            </div>

            {/* PRICE CARD */}
            <div className="pdp-price-hero-card">
              <div className="pdp-price-top">
                <span className="pdp-big-price">₹{currentTotalPrice.toLocaleString('en-IN')}</span>
                {currentTotalPrice > product.price && (
                  <span className="pdp-base-breakdown" style={{ fontSize: '13px', color: '#64748b', marginLeft: '10px', fontWeight: '500' }}>
                    (Base Machine: ₹{product.price.toLocaleString('en-IN')} + AMC/Add-on)
                  </span>
                )}
              </div>
              <div className="pdp-price-savings">
                <span className="pdp-strike-price">₹{(effectiveOriginalPrice + (currentTotalPrice - product.price)).toLocaleString('en-IN')}</span>
                <span className="pdp-savings-badge">↓{discountPct}% OFF</span>
              </div>
              <div className="pdp-tax-info">Inclusive of all taxes. GST invoice available for business claims.</div>
            </div>


            {/* PRODUCT SPECIFICATIONS & DESCRIPTION */}
            <div className="pdp-info-tabs-box" id="pdp-specs-section">
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

            {/* OFFICIAL KLEIDER CARE AMC & EXTENDED WARRANTY SECTION */}
            {isAmcApplicable() && (
              <div className="pdp-amc-section">
                <div className="pdp-amc-header">
                  <div className="amc-header-left">
                    <ShieldCheck size={22} className="amc-shield-icon" />
                    <div>
                      <h3>Kleider Care Extended Warranty & AMC</h3>
                      <p className="amc-subtitle">Annual Maintenance Contract tailored for {amcRates.label}</p>
                    </div>
                  </div>
                  <button
                    className="pdp-amc-toggle-btn"
                    onClick={() => setShowAmcDetails(!showAmcDetails)}
                    aria-label="Toggle AMC Details"
                  >
                    {showAmcDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {showAmcDetails && (
                  <div className="pdp-amc-body">
                    {/* AMC PLAN CARDS GRID */}
                    <div className="amc-cards-grid">
                      {/* PLAN 1: Non-Comprehensive AMC */}
                      <div
                        className={`amc-card ${selectedWarranty === 'non-comprehensive' ? 'selected' : ''}`}
                        onClick={() => setSelectedWarranty(selectedWarranty === 'non-comprehensive' ? 'none' : 'non-comprehensive')}
                      >
                        <div className="amc-card-badge non-comp">Standard Maintenance</div>
                        <h4 className="amc-plan-title">Non-Comprehensive AMC</h4>
                        <div className="amc-plan-price">
                          <span className="price-num">₹{amcRates.nonComp.toLocaleString('en-IN')}</span>
                          <span className="price-unit">/ year (excl. GST)</span>
                        </div>

                        <ul className="amc-features-list">
                          <li><CheckCircle2 size={16} className="feat-icon match" /> <span><strong>3 Preventive Visits</strong> / year</span></li>
                          <li><CheckCircle2 size={16} className="feat-icon match" /> <span><strong>Unlimited</strong> Breakdown Support</span></li>
                          <li><Clock size={16} className="feat-icon match" /> <span><strong>24–48 Hours</strong> Emergency Response</span></li>
                          <li><Wrench size={16} className="feat-icon match" /> <span>Safety & Performance Check</span></li>
                          <li><CheckCircle2 size={16} className="feat-icon match" /> <span>Vent Cleaning & Drum Disinfection</span></li>
                          <li className="excluded"><X size={16} className="feat-icon no-match" /> <span>Spare Parts (Charged Extra)</span></li>
                        </ul>

                        <button
                          className={`amc-select-btn ${selectedWarranty === 'non-comprehensive' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWarranty(selectedWarranty === 'non-comprehensive' ? 'none' : 'non-comprehensive');
                          }}
                        >
                          {selectedWarranty === 'non-comprehensive' ? '✓ Plan Selected' : 'Select Non-Comprehensive'}
                        </button>
                      </div>

                      {/* PLAN 2: Comprehensive AMC */}
                      <div
                        className={`amc-card featured ${selectedWarranty === 'comprehensive' ? 'selected' : ''}`}
                        onClick={() => setSelectedWarranty(selectedWarranty === 'comprehensive' ? 'none' : 'comprehensive')}
                      >
                        <div className="amc-card-badge comp">★ Best Protection (Parts Included)</div>
                        <h4 className="amc-plan-title">Comprehensive AMC</h4>
                        <div className="amc-plan-price">
                          <span className="price-num">₹{amcRates.comp.toLocaleString('en-IN')}</span>
                          <span className="price-unit">/ year (excl. GST)</span>
                        </div>

                        <ul className="amc-features-list">
                          <li><CheckCircle2 size={16} className="feat-icon match" /> <span><strong>3 Preventive Visits</strong> / year</span></li>
                          <li><CheckCircle2 size={16} className="feat-icon match" /> <span><strong>Unlimited</strong> Breakdown Support</span></li>
                          <li><ShieldCheck size={16} className="feat-icon match highlight" /> <span><strong>Spare Parts Included</strong> (excl. consumables)</span></li>
                          <li><Clock size={16} className="feat-icon match" /> <span><strong>24–48 Hours</strong> Priority Hotline Response</span></li>
                          <li><Wrench size={16} className="feat-icon match" /> <span>Vent Cleaning & Drum Disinfection</span></li>
                          <li><CheckCircle2 size={16} className="feat-icon match" /> <span>Calibration Check & Service Log</span></li>
                        </ul>

                        <button
                          className={`amc-select-btn featured ${selectedWarranty === 'comprehensive' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWarranty(selectedWarranty === 'comprehensive' ? 'none' : 'comprehensive');
                          }}
                        >
                          {selectedWarranty === 'comprehensive' ? '✓ Plan Selected' : 'Select Comprehensive'}
                        </button>
                      </div>
                    </div>

                    {/* MACHINE PROGRAMMING OPTION */}
                    <div className={`amc-addon-box ${includeProgramSetup ? 'selected' : ''}`}>
                      <div className="amc-addon-info">
                        <strong>Machine Program Setup (Up to 10 Programs in LG)</strong>
                        <p>Custom program parameters & calibration setup by certified technicians (@ ₹350/program)</p>
                      </div>
                      <div className="amc-addon-action">
                        <span className="amc-addon-price">+ ₹3,500</span>
                        <button
                          type="button"
                          className={`amc-addon-btn ${includeProgramSetup ? 'active' : ''}`}
                          onClick={() => setIncludeProgramSetup(!includeProgramSetup)}
                        >
                          {includeProgramSetup ? '✓ Program Setup Added' : 'Add Machine Program Setup'}
                        </button>
                      </div>
                    </div>

                    {/* ACTION BAR FOR SCHEDULE & CONTACT */}
                    <div className="amc-footer-bar">
                      <button className="amc-view-schedule-btn" onClick={() => setShowAmcScheduleModal(true)}>
                        <Calendar size={16} /> Annual Maintenance Coverage
                      </button>

                      <div className="amc-support-contact">
                        <Phone size={14} />
                        <span>Dedicated Hotline: <strong>+91 93848 14933 / +91 97890 20311</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 16-TASK QUARTERLY SCHEDULE MODAL */}
            {showAmcScheduleModal && (
              <div className="amc-modal-overlay" onClick={() => setShowAmcScheduleModal(false)}>
                <div className="amc-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="amc-modal-header">
                    <div>
                      <h3>Annual Maintenance Coverage:</h3>
                      <p>Quarterly maintenance breakdown for commercial laundry equipment</p>
                    </div>
                    <button className="amc-modal-close-btn" onClick={() => setShowAmcScheduleModal(false)}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="amc-modal-body">
                    <table className="amc-tasks-table">
                      <thead>
                        <tr>
                          <th>Sl No.</th>
                          <th>Maintenance Task</th>
                          <th>First Quarter</th>
                          <th>Second Quarter</th>
                          <th>Third Quarter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 1, name: 'Lint filter, drum, and seal cleaning', q1: true, q2: true, q3: true },
                          { id: 2, name: 'Motor, vibration, and bearing Inspection', q1: true, q2: true, q3: true },
                          { id: 3, name: 'Electrical system & firmware Diagnostics', q1: true, q2: true, q3: true },
                          { id: 4, name: 'Washer/Dryer simulation test', q1: true, q2: true, q3: true },
                          { id: 5, name: 'Grounding, gas line (if any), and shutdown system test', q1: true, q2: true, q3: true },
                          { id: 6, name: 'Detailed service reports with remarks and signatures', q1: true, q2: true, q3: true },
                          { id: 7, name: 'Comprehensive system health assessment', q1: true, q2: false, q3: false },
                          { id: 8, name: 'Thorough cleaning of machines', q1: true, q2: false, q3: false },
                          { id: 9, name: 'Baseline Condition Report', q1: true, q2: false, q3: false },
                          { id: 10, name: 'Inspection of safety and electrical systems', q1: false, q2: true, q3: false },
                          { id: 11, name: 'Checking hoses', q1: false, q2: true, q3: false },
                          { id: 12, name: 'Checking filter', q1: false, q2: true, q3: false },
                          { id: 13, name: 'Checking Inlet Pressure', q1: false, q2: true, q3: false },
                          { id: 14, name: 'Motor and Belt inspection', q1: false, q2: false, q3: true },
                          { id: 15, name: 'Deep cleaning of Dryer Vents', q1: false, q2: false, q3: true },
                          { id: 16, name: 'Submission of the final machine condition report', q1: false, q2: false, q3: true }
                        ].map((t) => (
                          <tr key={t.id}>
                            <td className="task-num">{t.id}</td>
                            <td className="task-name">{t.name}</td>
                            <td className="task-check">{t.q1 ? <Check size={18} className="check-icon" /> : '—'}</td>
                            <td className="task-check">{t.q2 ? <Check size={18} className="check-icon" /> : '—'}</td>
                            <td className="task-check">{t.q3 ? <Check size={18} className="check-icon" /> : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="amc-modal-footer">
                    <span>Emergency Response within 24–48 hours | support@kleidercare.com</span>
                    <button className="amc-modal-done-btn" onClick={() => setShowAmcScheduleModal(false)}>
                      Close Schedule
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FIXED ACTION BUTTONS BAR */}
            <div className="pdp-primary-actions">
              <button
                className={`pdp-btn-cart ${isOutOfStock ? 'pdp-btn-disabled' : ''}`}
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', background: '#94a3b8' } : {}}
              >
                <ShoppingCart size={18} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                className={`pdp-btn-emi ${isOutOfStock ? 'pdp-btn-disabled' : ''}`}
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', background: '#64748b' } : {}}
              >
                <CreditCard size={18} />
                <div>
                  <strong>{isOutOfStock ? 'Unavailable' : 'Buy with EMI'}</strong>
                  <small>{isOutOfStock ? 'Item Out of Stock' : `From ₹${Math.round(currentTotalPrice / 12).toLocaleString('en-IN')}/mo`}</small>
                </div>
              </button>

              <button
                className={`pdp-btn-buynow ${isOutOfStock ? 'pdp-btn-disabled' : ''}`}
                onClick={handleBuyNowClick}
                disabled={isOutOfStock}
                style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', background: '#475569' } : {}}
              >
                <Zap size={18} />
                <span>{isOutOfStock ? 'Out of Stock' : `Buy Now at ₹${currentTotalPrice.toLocaleString('en-IN')}`}</span>
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

        {/* SIMILAR & RECOMMENDED PRODUCTS SECTION */}
        {similarProducts.length > 0 && (
          <section className="similar-products-section">
            <div className="similar-section-header">
              <h2>{getSectionTitle()}</h2>
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
                  const isTargetRecommended = targetRecommendedType && getProductType(simProd) === targetRecommendedType;
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

                        {isTargetRecommended ? (
                          <span className="similar-bestseller-badge" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>✨ Recommended</span>
                        ) : isBestseller ? (
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
        <section className="client-reviews-section" id="pdp-feedback-section">
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

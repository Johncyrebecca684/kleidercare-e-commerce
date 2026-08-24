import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import {
  Heart,
  ShoppingCart,
  ShieldCheck,
  Share2,
  CreditCard,
  Zap,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  Truck,
  Wrench,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Home,
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
  Info,
  MapPin,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Layers,
  Percent,
  AlertTriangle
} from 'lucide-react';
import EmiOptionsModal from '../components/EmiOptionsModal';
import { getRecommendations, getProductType, getRecommendedTargetType, getProductCapacity, getDryerFuelType } from '../utils/recommendationEngine';
import { useBrowsingTracker } from '../hooks/useBrowsingTracker';
import { formatImageUrl } from '../utils/imageUtils';
import LottieAnimation from '../components/LottieAnimation';
import AddToCartButton from '../components/AddToCartButton';
import BuyNowButton from '../components/BuyNowButton';
import EmiButton from '../components/EmiButton';
import SetupProgramButton from '../components/SetupProgramButton';
import AmcPlanButton from '../components/AmcPlanButton';
import WishlistButton from '../components/WishlistButton';
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

  const rawProduct = products.find(p => String(p.id) === String(id)) || products[0];
  const product = useMemo(() => {
    if (!rawProduct) return null;
    return {
      ...rawProduct,
      image: formatImageUrl(rawProduct.image),
      images: Array.isArray(rawProduct.images)
        ? rawProduct.images.map(img => formatImageUrl(img))
        : [formatImageUrl(rawProduct.image)]
    };
  }, [rawProduct]);

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
  const [showEmiModal, setShowEmiModal] = useState(false);

  // Check if EMI is applicable to the current product (LG & Speed Queen products)
  const isEmiApplicable = () => {
    if (!product) return false;
    const cat = (product.category || '').toLowerCase();
    const subcat = (product.subcategory || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const brand = (product.specifications?.['Brand'] || product.specifications?.['brand'] || '').toLowerCase();
    const specs = JSON.stringify(product.specifications || {}).toLowerCase();

    const isLg =
      brand.includes('lg') ||
      cat.includes('lg') ||
      name.includes('lg') ||
      name.includes('giant') ||
      name.includes('titan') ||
      specs.includes('lg') ||
      specs.includes('cwg') ||
      specs.includes('cwt');

    const isSpeedQueen =
      brand.includes('speed queen') ||
      brand.includes('speedqueen') ||
      cat.includes('speed queen') ||
      cat.includes('speedqueen') ||
      subcat.includes('speed queen') ||
      subcat.includes('speedqueen') ||
      name.includes('speed queen') ||
      name.includes('speedqueen') ||
      name.includes('quantum touch');

    return isLg || isSpeedQueen;
  };

  // Gallery image list combining base product images
  const allGalleryImages = Array.from(
    new Set([
      product?.image,
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

  // Check if AMC is applicable to the current product (ONLY for LG machines)
  const isAmcApplicable = () => {
    if (!product) return false;
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const brand = (product.specifications?.['Brand'] || product.specifications?.['brand'] || '').toLowerCase();
    const specs = JSON.stringify(product.specifications || {}).toLowerCase();

    // Must be an LG machine
    return (
      brand.includes('lg') ||
      cat.includes('lg') ||
      name.includes('lg') ||
      name.includes('giant') ||
      name.includes('titan') ||
      specs.includes('lg') ||
      specs.includes('cwg') ||
      specs.includes('cwt')
    );
  };

  // Official Kleider Care AMC Pricing for LG machines (10kg = ₹15,000, 15kg = ₹18,000)
  const getAmcPrices = () => {
    const pName = (product?.name || '').toLowerCase();
    const specs = JSON.stringify(product?.specifications || {}).toLowerCase();
    const capacity = (product?.specifications?.['Capacity'] || product?.specifications?.['capacity'] || '').toLowerCase();

    const is15kg =
      pName.includes('15') ||
      pName.includes('titan') ||
      capacity.includes('15') ||
      specs.includes('15kg') ||
      specs.includes('15 kg') ||
      specs.includes('titan') ||
      specs.includes('cwt');

    if (is15kg) {
      return { price: 18000, label: 'LG 15 kg Commercial Machine' };
    }
    return { price: 15000, label: 'LG 10 kg Commercial Machine' };
  };

  const amcRates = getAmcPrices();

  // Dynamic total price including selected AMC warranty and machine program setup
  const getCurrentProductTotalPrice = () => {
    if (!product) return 0;
    let total = product.price;
    if (selectedWarranty && selectedWarranty !== 'none') {
      total += amcRates.price;
    }
    if (includeProgramSetup) {
      total += 18000;
    }
    return total;
  };

  const currentTotalPrice = getCurrentProductTotalPrice();

  const [showShareNotice, setShowShareNotice] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const { recordView } = useBrowsingTracker();
  const productId = product?.id;

  useEffect(() => {
    if (product && product.id) {
      recordView(product);
    }
  }, [productId, recordView]);

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
  const gst18Amount = Math.round(currentTotalPrice * 0.18);
  const totalWith18Gst = product.priceWithGst
    ? (product.priceWithGst + Math.round((currentTotalPrice - product.price) * 1.18))
    : Math.round(currentTotalPrice * 1.18);
  const originalWith18Gst = Math.round((effectiveOriginalPrice + (currentTotalPrice - product.price)) * 1.18);

  const sameCategoryProducts = products.filter(p => p.category === product.category);

  const relatedProducts = products
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const carouselRef = useState(null)[0] || { current: null };

  // Create recommended & similar products list prioritizing rule matches:
  // 15kg Washer -> 15kg Electric Dryer & 15kg Gas Dryer
  // Chemical -> Dosing Pump, Dosing Pump -> Chemical, Washer -> Dryer, Dryer -> Washer
  const currentProductType = getProductType(product);
  const currentProductCapacity = getProductCapacity(product);
  const targetRecommendedType = getRecommendedTargetType(currentProductType);

  let targetRecommendedProducts = [];
  if (targetRecommendedType) {
    targetRecommendedProducts = products
      .filter(p => p.id !== product.id && getProductType(p) === targetRecommendedType)
      .sort((a, b) => {
        const aCap = getProductCapacity(a);
        const bCap = getProductCapacity(b);
        const aMatch = currentProductCapacity && aCap === currentProductCapacity;
        const bMatch = currentProductCapacity && bCap === currentProductCapacity;

        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;

        // If both match or both don't match, sort electric before gas
        const aFuel = getDryerFuelType(a);
        const bFuel = getDryerFuelType(b);
        if (aFuel === 'electric' && bFuel === 'gas') return -1;
        if (aFuel === 'gas' && bFuel === 'electric') return 1;

        return 0;
      });
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

    if (selectedWarranty && selectedWarranty !== 'none') {
      extraCost += amcRates.price;
      warrantyInfo = {
        type: 'Kleider Care AMC',
        price: amcRates.price,
        gst: Math.round(amcRates.price * 0.18),
        totalWithGst: Math.round(amcRates.price * 1.18),
        visits: '3 Preventive Visits / year',
        response: '24–48 Hours Emergency Response'
      };
    }

    if (includeProgramSetup) {
      extraCost += 18000;
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

  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = (product.stock !== undefined && Number(product.stock) <= 0) || product.stockStatus === 'Out of Stock';

  const handleAddToCartClick = () => {
    if (isOutOfStock || isAdding) return;
    setIsAdding(true);
    onAddToCart(getProductForCart());
    setAddedNotice(true);
    setTimeout(() => {
      setIsAdding(false);
      setAddedNotice(false);
    }, 1800);
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
          </div>
        </div>

        {/* FULL SCREEN PDP GRID */}
        <div className="pdp-fullscreen-grid">
          {/* LEFT COLUMN: MEDIA GALLERY & SHOWCASE */}
          <div className="pdp-media-gallery">
            <div className="pdp-main-view-container">
              <img src={selectedImage || product.image} alt={product.name} className="pdp-hero-image" />

              {/* GALLERY PREV & NEXT NAVIGATION BUTTONS */}
              {allGalleryImages.length > 1 && (
                <>
                  <button
                    className="pdp-gallery-nav-btn pdp-gallery-nav-prev"
                    onClick={handlePrevImage}
                    title="Previous Product Image"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    className="pdp-gallery-nav-btn pdp-gallery-nav-next"
                    onClick={handleNextImage}
                    title="Next Product Image"
                    aria-label="Next Image"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* FLOATING ACTION ICONS */}
              <div className="pdp-floating-actions">
                <WishlistButton
                  isWishlisted={isWishlisted}
                  onToggle={() => onToggleWishlist(product)}
                  size="lg"
                />
                <button className="pdp-action-icon" onClick={handleShare} title="Share Link">
                  <Share2 size={20} />
                </button>
              </div>

              {showShareNotice && (
                <div className="pdp-copied-toast">
                  <MessageSquare size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Opening WhatsApp & Link Copied!
                </div>
              )}
            </div>

            {/* THUMBNAIL GALLERY STRIP */}
            <div className="pdp-thumbnails-row">
              {allGalleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  className={`pdp-thumb-card ${selectedImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setSelectedImage(imgUrl)}
                  title={`View product image ${idx + 1}`}
                >
                  <img src={imgUrl} alt={`View ${idx + 1}`} />
                </button>
              ))}
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

            {/* STOCK BADGE */}
            <div className="pdp-rating-strip" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {isOutOfStock ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', fontWeight: '700', fontSize: '13px', border: '1px solid #fecaca' }}>
                  <AlertTriangle size={15} /> Currently Out of Stock
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a', fontWeight: '700', fontSize: '13px', border: '1px solid #bbf7d0' }}>
                  <CheckCircle2 size={15} /> In Stock (Ready to Dispatch)
                </span>
              )}
            </div>

            {/* PRICE CARD WITH 18% GST */}
            <div className="pdp-price-hero-card">
              <div className="pdp-price-top">
                <span className="pdp-big-price">₹{totalWith18Gst.toLocaleString('en-IN')}</span>
                <span className="pdp-gst-pill">Incl. 18% GST</span>
              </div>

              <div className="pdp-gst-breakdown-row">
                <span className="pdp-breakdown-item">
                  Base Price: <strong>₹{currentTotalPrice.toLocaleString('en-IN')}</strong>
                </span>
                <span className="pdp-breakdown-sep">+</span>
                <span className="pdp-breakdown-item">
                  18% GST: <strong>₹{gst18Amount.toLocaleString('en-IN')}</strong>
                </span>
              </div>

              {currentTotalPrice > product.price && (
                <div className="pdp-base-breakdown" style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  (Base Machine: ₹{Math.round(product.price * 1.18).toLocaleString('en-IN')} + AMC/Add-on with GST)
                </div>
              )}

              <div className="pdp-price-savings">
                <span className="pdp-strike-price">₹{originalWith18Gst.toLocaleString('en-IN')}</span>
                <span className="pdp-savings-badge">↓{discountPct}% OFF</span>
              </div>

              <div className="pdp-tax-info">
                <FileText size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px', color: '#0284c7' }} />
                Inclusive of 18% GST. Valid Tax Invoice provided for B2B Input Tax Credit (ITC) claims.
              </div>
            </div>

            {/* EMI CHECKING TEASER STRIP (LG & SPEED QUEEN PRODUCTS) */}
            {isEmiApplicable() && (
              <div
                className="pdp-emi-teaser-card"
                onClick={() => setShowEmiModal(true)}
                role="button"
                tabIndex={0}
              >
                <div className="pdp-emi-teaser-left">
                  <div className="pdp-emi-badge-icon">
                    <Percent size={17} />
                  </div>
                  <div className="pdp-emi-text-wrapper">
                    <div>
                      <strong>EMI</strong> starts at <span className="pdp-emi-amount">₹{Math.round(currentTotalPrice * 0.048).toLocaleString('en-IN')}</span>/mo.
                      <span className="pdp-emi-nocost-badge">No Cost EMI available</span>
                    </div>
                  </div>
                </div>
                <div className="pdp-emi-options-trigger">
                  <span>EMI options</span>
                  <ChevronDown size={16} />
                </div>
              </div>
            )}


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
                    {/* AMC SINGLE PLAN CARD */}
                    <div className="amc-cards-grid single-plan">
                      <div
                        className={`amc-card single-amc-card featured ${selectedWarranty === 'amc' ? 'selected' : ''}`}
                        onClick={() => setSelectedWarranty(selectedWarranty === 'amc' ? 'none' : 'amc')}
                      >
                        <div className="amc-card-badge comp">
                          <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          Kleider Care AMC Plan
                        </div>
                        <h4 className="amc-plan-title">Annual Maintenance Contract (AMC)</h4>
                        <div className="amc-plan-price">
                          <span className="price-num">₹{amcRates.price.toLocaleString('en-IN')}</span>
                          <span className="price-unit">/ year (+ 18% GST: ₹{Math.round(amcRates.price * 0.18).toLocaleString('en-IN')} | Total: ₹{Math.round(amcRates.price * 1.18).toLocaleString('en-IN')})</span>
                        </div>

                        <ul className="amc-features-list">
                          <li><CheckCircle2 size={16} className="feat-icon match" /> <span><strong>3 Preventive Visits / year</strong></span></li>
                          <li><Clock size={16} className="feat-icon match" /> <span><strong>24–48 Hours Emergency Response</strong></span></li>
                          <li><Wrench size={16} className="feat-icon match" /> <span><strong>Safety & Performance Check</strong></span></li>
                          <li><ShieldCheck size={16} className="feat-icon match highlight" /> <span><strong>Vent Cleaning & Drum Disinfection</strong></span></li>
                        </ul>

                        <AmcPlanButton
                          active={selectedWarranty === 'amc'}
                          onToggle={(active) => setSelectedWarranty(active ? 'amc' : 'none')}
                          defaultText="Select AMC Plan"
                          activeText="AMC Plan Selected"
                        />
                      </div>
                    </div>

                    {/* MACHINE PROGRAMMING OPTION */}
                    <div className={`amc-addon-box ${includeProgramSetup ? 'selected' : ''}`}>
                      <div className="amc-addon-info">
                        <strong>Machine Program Setup (Up to 10 Programs in LG)</strong>
                        <p>Custom program parameters & calibration setup by certified technicians (@ ₹1,800/program)</p>
                      </div>
                      <div className="amc-addon-action">
                        <span className="amc-addon-price">+ ₹18,000</span>
                        <SetupProgramButton
                          active={includeProgramSetup}
                          onToggle={(val) => setIncludeProgramSetup(val)}
                          defaultText="Add Machine Program Setup"
                          activeText="Program Setup Added"
                        />
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

            {/* REGIONAL INSTALLATION POLICY NOTICE (AFTER AMC SECTION) */}
            {((product?.name || '').toLowerCase().includes('lg') ||
              (product?.category || '').toLowerCase().includes('lg') ||
              (product?.name || '').toLowerCase().includes('stacker') ||
              isAmcApplicable()) && (
                <div className="pdp-installation-policy-card" style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: '#0369a1',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  <MapPin size={20} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#0f2b5c', display: 'block', marginBottom: '2px', fontSize: '14px' }}>
                      Regional Installation Policy
                    </strong>
                    <span>
                      For all LG Commercial Laundry Machines, installation is <strong>FREE in South India</strong>. For North India and other regions, installation charges apply based on the location.
                    </span>
                  </div>
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
              <AddToCartButton
                className="pdp-btn-cart-animated"
                onClick={handleAddToCartClick}
                isOutOfStock={isOutOfStock}
                defaultText="Add to Cart"
                addedText="Added to Cart!"
                size="lg"
              />

              <EmiButton
                className="pdp-btn-emi-animated"
                onClick={() => setShowEmiModal(true)}
                isOutOfStock={isOutOfStock}
                monthlyPrice={Math.round(totalWith18Gst / 12)}
                defaultTitle="Buy with EMI"
                size="lg"
              />

              <BuyNowButton
                className="pdp-btn-buynow-animated"
                onClick={handleBuyNowClick}
                isOutOfStock={isOutOfStock}
                price={totalWith18Gst}
                defaultText="Buy Now"
                processingText="Proceeding..."
                size="lg"
              />
            </div>

            {addedNotice && (
              <div className="pdp-added-banner">
                <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Added to cart successfully!
              </div>
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
            <span className="fbt-discount-badge">
              <Zap size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              10% Extra Bundle Discount
            </span>
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
                      {bundleAddon1Reason && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
                          <Sparkles size={12} /> {bundleAddon1Reason}
                        </span>
                      )}
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
                      {bundleAddon2Reason && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
                          <Sparkles size={12} /> {bundleAddon2Reason}
                        </span>
                      )}
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

                <AddToCartButton
                  className="fbt-add-all-btn-animated"
                  onClick={handleAddBundleToCart}
                  defaultText={`Add Selected (${selectedBundleCount} items) to Cart`}
                  addedText={`Added ${selectedBundleCount} items to Cart!`}
                  size="md"
                />
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
                  <ChevronRight size={18} />
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
                          <span className="similar-bestseller-badge" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={12} /> Recommended
                          </span>
                        ) : isBestseller ? (
                          <span className="similar-bestseller-badge">Bestseller</span>
                        ) : (
                          <span className="similar-ad-badge">AD</span>
                        )}
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
      </main>

      {/* RAZORPAY EMI CHECKING MODAL */}
      <EmiOptionsModal
        isOpen={showEmiModal}
        onClose={() => setShowEmiModal(false)}
        productPrice={currentTotalPrice}
        productName={product.name}
      />

      <Footer />
    </div>
  );
}

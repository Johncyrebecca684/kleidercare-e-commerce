import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import {
  LayoutGrid,
  List,
  WashingMachine,
  Zap,
  Shirt,
  Wrench,
  FlaskConical,
  SlidersHorizontal,
  Sparkles,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Star
} from 'lucide-react';
import './ProductList.css';
import { getRecommendations } from '../utils/recommendationEngine';
import { getSearchResultsWithSimilar, scoreProductSearchRelevance } from '../utils/searchEngine';

const CATEGORY_ITEMS = [
  { name: 'All', icon: LayoutGrid, image: '/kc-logo.png', isLogo: true },
  { name: 'Stacker', icon: Layers, image: '/10kg stack.jpeg' },
  { name: 'Packages', icon: Package, image: '/washing-machine.png.png' },
  { name: 'LG Commercial Laundry Machines', icon: WashingMachine, image: '/10kglggiantwasher.png' },
  { name: 'Speed Queen Commercial Laundry Machines', icon: Zap, image: '/Speed Queen Quantum Touch Washer Extractor 18kg.png' },
  { name: 'PONY Finishing Equipments', icon: Shirt, image: '/PONY FVC Utility Ironing Tables.png' },
  { name: 'LG Genuine Spare Parts', icon: Wrench, image: '/Motor Assembly.png' },
  { name: 'Laundry Chemicals', icon: FlaskConical, image: '/chemical 1.png' },
  { name: 'Seko', icon: SlidersHorizontal, image: '/seko-3p.png' }
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popularity' },
  { id: 'price-low', label: 'Price -- Low to High' },
  { id: 'price-high', label: 'Price -- High to Low' },
  { id: 'rating', label: 'Highest Rating' },
  { id: 'discount', label: 'Discount' }
];

export default function ProductList({
  products,
  onAddToCart,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  wishlistItems = [],
  onToggleWishlist,
}) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('list');
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [browsingHistory, setBrowsingHistory] = useState([]);
  const categoryScrollRef = useRef(null);

  const scrollCategoryNav = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleProductSelect = (product) => {
    navigate(`/product/${product.id}`);
  };

  // Sidebar Filter States
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [onlyAssured, setOnlyAssured] = useState(false);
  const [capacityFilter, setCapacityFilter] = useState('all');

  const isMachineCategory = (category) => {
    if (!category) return true;
    const cat = category.toLowerCase();
    return (
      cat === 'all' ||
      cat === 'for you' ||
      cat.includes('laundry machine') ||
      cat.includes('lg') ||
      cat.includes('speed queen') ||
      cat.includes('washer') ||
      cat.includes('dryer') ||
      cat.includes('package')
    );
  };

  const showCapacityFilter = isMachineCategory(selectedCategory);

  const [accordionOpen, setAccordionOpen] = useState({
    sort: true,
    capacity: true,
    price: true,
    assured: true
  });

  const toggleAccordion = (section) => {
    setAccordionOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleClearFilters = () => {
    setMinPrice(0);
    setMaxPrice(500000);
    setOnlyAssured(false);
    setCapacityFilter('all');
    setSortBy('popular');
  };

  const isFilterActive = minPrice > 0 || maxPrice < 500000 || onlyAssured || (showCapacityFilter && capacityFilter !== 'all') || sortBy !== 'popular';

  // Track search history and browsing history in localStorage
  useEffect(() => {
    try {
      const savedSearches = JSON.parse(localStorage.getItem('kc_search_history') || '[]');
      setSearchHistory(savedSearches);

      const savedBrowsing = JSON.parse(localStorage.getItem('kc_browsing_history') || '[]');
      setBrowsingHistory(savedBrowsing);
    } catch {
      // ignore JSON error
    }
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 1) {
      setSearchHistory(prev => {
        const clean = searchTerm.trim().toLowerCase();
        const updated = [clean, ...prev.filter(s => s !== clean)].slice(0, 10);
        localStorage.setItem('kc_search_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [searchTerm]);

  // Compute search result sets and similarity using searchEngine
  const searchResultsData = useMemo(() => {
    return getSearchResultsWithSimilar(products, searchTerm);
  }, [products, searchTerm]);

  const filteredProducts = products.filter(product => {
    let matchesCategory = true;
    if (selectedCategory === 'For You' || selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Stacker' || selectedCategory === 'Stackers') {
      matchesCategory = product.category === 'Stacker' || product.category === 'Stackers' || (product.name && product.name.toLowerCase().includes('stacker'));
    } else if (selectedCategory === 'Packages') {
      matchesCategory = (product.category === 'Packages' || (product.badge && product.badge.toLowerCase().includes('package')) || (product.name && product.name.toLowerCase().includes('package'))) && product.category !== 'Stacker' && !(product.name && product.name.toLowerCase().includes('stacker'));
    } else if (selectedCategory === 'Laundry Chemicals' || selectedCategory === 'Chemicals') {
      const machinePackageNames = [
        'wet pro electric 15kg package',
        'titan electric 15kg package',
        'titan gas 15kg package',
        'giant electric 10kg package',
        'giant gas 15kg package',
        'giant gas 10kg package',
        'wet pro electric 15kg stacker',
        'titan electric 15kg stacker',
        'titan gas 15kg stacker',
        'giant electric 10kg stacker',
        'giant gas 10kg stacker'
      ];
      const isMachinePackage = machinePackageNames.some(pName => (product.name || '').toLowerCase().includes(pName));
      matchesCategory = product.category === 'Laundry Chemicals' || product.category === 'Chemicals' || (product.category === 'Packages' && !isMachinePackage && (product.name.toLowerCase().includes('chemical') || product.name === 'Retail Laundry Package'));
    } else if (selectedCategory === 'LG Genuine Spare Parts' || selectedCategory === 'Genuine Spare Parts') {
      matchesCategory = product.category === 'LG Genuine Spare Parts' || product.category === 'Genuine Spare Parts';
    } else if (
      selectedCategory === 'Speed Queen Commercial Laundry Machines' ||
      selectedCategory === 'Speed Queen' ||
      selectedCategory === 'Speed Queen Commercial Laundry'
    ) {
      const prodCat = (product.category || '').toLowerCase().trim();
      const prodSubcat = (product.subcategory || '').toLowerCase().trim();
      const prodName = (product.name || '').toLowerCase().trim();
      matchesCategory =
        prodCat.includes('speed queen') ||
        prodCat.includes('speedqueen') ||
        prodCat === 'speed queen commercial laundry machines' ||
        prodSubcat.includes('speed queen') ||
        prodSubcat.includes('speedqueen') ||
        prodName.includes('speed queen') ||
        prodName.includes('speedqueen') ||
        prodName.includes('quantum touch') ||
        prodName.includes('quantum');
    } else {
      matchesCategory = (product.category || '').trim().toLowerCase() === (selectedCategory || '').trim().toLowerCase();
    }

    if (
      (product.name === 'LG 15 Kg Wet Cleaning Washer' ||
        product.name === '15kg LG Titan Electric Dryer' ||
        product.name === 'LG Wet Cleaning Dryer 15KG (ELECTRIC)') &&
      selectedCategory !== 'LG Commercial Laundry Machines' &&
      selectedCategory !== 'All' &&
      selectedCategory !== 'For You'
    ) {
      matchesCategory = false;
    }

    let matchesSearch = true;
    if (searchTerm && searchTerm.trim()) {
      if (searchResultsData.exactMatches.length > 0) {
        matchesSearch = searchResultsData.exactMatches.some(p => p.id === product.id);
      } else {
        // If no exact matches, show top similar products in main grid
        matchesSearch = searchResultsData.similarProducts.some(p => p.id === product.id);
      }
    }

    if (!matchesCategory || !matchesSearch) return false;

    // Sidebar Filters
    if (product.price !== undefined && (product.price < minPrice || (maxPrice < 500000 && product.price > maxPrice))) return false;
    if (onlyAssured && (product.rating || 0) < 4.2) return false;

    if (showCapacityFilter && capacityFilter !== 'all') {
      const capSpec = (product.specifications?.Capacity || '').toLowerCase();
      const text = ((product.name || '') + ' ' + (product.description || '')).toLowerCase();

      if (capacityFilter === '10kg') {
        const is10 = capSpec.includes('10') || text.includes('10kg') || text.includes('10 kg') || text.includes('10.5');
        if (!is10) return false;
      }
      if (capacityFilter === '15kg') {
        const is15 = capSpec.includes('15') || text.includes('15kg') || text.includes('15 kg') || text.includes('14kg') || text.includes('14 kg');
        if (!is15) return false;
      }
    }

    return true;
  });

  // Calculate personalization via centralized recommendation engine
  const forYouRecommendations = selectedCategory === 'For You'
    ? getRecommendations({
      type: 'for_you_homepage',
      products: filteredProducts,
      cartItems: [],
      wishlistItems,
      searchHistory,
      browsingHistory,
      limit: filteredProducts.length
    })
    : [];

  // Build a map of productId -> reason for the For You tab
  const reasonMap = new Map();
  forYouRecommendations.forEach(r => reasonMap.set(r.product.id, r.reason));

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (searchTerm && searchTerm.trim() && sortBy === 'popular') {
      const scoreA = scoreProductSearchRelevance(a, searchTerm);
      const scoreB = scoreProductSearchRelevance(b, searchTerm);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }

    if (selectedCategory === 'For You' && sortBy === 'popular') {
      // Use engine scores
      const scoreA = forYouRecommendations.find(r => r.product.id === a.id)?.score || 0;
      const scoreB = forYouRecommendations.find(r => r.product.id === b.id)?.score || 0;
      return scoreB - scoreA;
    }

    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'discount': {
        const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      }
      case 'popular':
      default: {
        if (selectedCategory === 'LG Commercial Laundry Machines') {
          const isWasherA = (a.name || '').toLowerCase().includes('washer') ? 0 : 1;
          const isWasherB = (b.name || '').toLowerCase().includes('washer') ? 0 : 1;
          if (isWasherA !== isWasherB) return isWasherA - isWasherB;
        }
        return (b.reviews || 0) - (a.reviews || 0);
      }
    }
  });

  return (
    <section id="products" className="products-section animate-fade-in">
      <div className="section-header">
        <div className="header-content">
          <h2 className="section-title">Shop All Products</h2>
          <p className="section-subtitle">
            Machines, chemicals, detergents, and everything you need for complete laundry care.
          </p>
        </div>
      </div>

      <div className="filters-container">
        <div className="category-filters-wrapper">
          <button
            type="button"
            className="category-nav-arrow left"
            onClick={() => scrollCategoryNav('left')}
            aria-label="Scroll Categories Left"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="category-filters" ref={categoryScrollRef}>
            <div className="category-buttons">
              {CATEGORY_ITEMS.map(({ name, image, icon: Icon, isLogo }) => (
                <button
                  key={name}
                  type="button"
                  className={`category-item-pill ${selectedCategory === name ? 'active' : ''}`}
                  onClick={() => onCategoryChange(name)}
                >
                  <div className="category-img-circle">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className={`category-thumbnail-img ${isLogo ? 'logo-img' : ''}`}
                      />
                    ) : (
                      <Icon size={18} className="category-fallback-icon" />
                    )}
                  </div>
                  <span className="category-item-label">{name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="category-nav-arrow right"
            onClick={() => scrollCategoryNav('right')}
            aria-label="Scroll Categories Right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* AMAZON-STYLE MOBILE 2-TIER FILTER STRIP (MOBILE VIEW ONLY) */}
      <div className="mobile-amazon-filter-bar">
        {/* Main Filter Icon Button with badge */}
        <div className="mobile-filter-left-col">
          <button
            type="button"
            className={`amazon-filter-btn main-filter-icon-btn ${isFilterActive ? 'active' : ''}`}
            onClick={() => {
              // Cycle through sort options or trigger clear if active
              const nextSort = sortBy === 'popular' ? 'price-low' : sortBy === 'price-low' ? 'price-high' : sortBy === 'price-high' ? 'rating' : 'popular';
              setSortBy(nextSort);
            }}
            title="Filter Options"
          >
            <SlidersHorizontal size={17} />
            {isFilterActive && <span className="active-filter-badge-dot" />}
          </button>

          {/* Assured / Verified Toggle */}
          <button
            type="button"
            className={`amazon-prime-toggle-btn ${onlyAssured ? 'active' : ''}`}
            onClick={() => setOnlyAssured(prev => !prev)}
            title="Toggle Top Rated / Assured"
          >
            <span className="prime-check">✓</span>
            <span className={`prime-switch ${onlyAssured ? 'on' : 'off'}`}>
              <span className="prime-switch-thumb" />
            </span>
          </button>
        </div>

        {/* Right 2-row horizontal scrollable pills */}
        <div className="mobile-filter-right-grid">
          {/* Row 1: Quick Toggles */}
          <div className="filter-pill-row">
            <button
              type="button"
              className={`amazon-filter-btn ${sortBy === 'discount' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'discount' ? 'popular' : 'discount')}
            >
              All Discounts
            </button>

            <button
              type="button"
              className={`amazon-filter-btn ${maxPrice <= 50000 ? 'active' : ''}`}
              onClick={() => {
                if (maxPrice <= 50000) {
                  setMaxPrice(500000);
                } else {
                  setMinPrice(0);
                  setMaxPrice(50000);
                }
              }}
            >
              Today&apos;s Deals
            </button>
          </div>

          {/* Row 2: Dropdown Buttons */}
          <div className="filter-pill-row">
            {/* Sort Dropdown */}
            <div className="amazon-select-pill-wrap">
              <select
                className={`amazon-filter-select ${sortBy !== 'popular' ? 'active' : ''}`}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">Popular ▾</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Brands / Categories Dropdown */}
            <div className="amazon-select-pill-wrap">
              <select
                className={`amazon-filter-select ${selectedCategory !== 'All' ? 'active' : ''}`}
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
              >
                <option value="All">Brands ▾</option>
                <option value="LG Commercial Laundry Machines">LG Commercial</option>
                <option value="Speed Queen Commercial Laundry Machines">Speed Queen</option>
                <option value="PONY Finishing Equipments">PONY</option>
                <option value="Seko">Seko</option>
                <option value="LG Genuine Spare Parts">LG Genuine Spare Parts</option>
                <option value="Laundry Chemicals">Laundry Chemicals</option>
              </select>
            </div>

            {/* Price Dropdown */}
            <div className="amazon-select-pill-wrap">
              <select
                className={`amazon-filter-select ${minPrice > 0 || maxPrice < 500000 ? 'active' : ''}`}
                value={`${minPrice}-${maxPrice}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setMinPrice(min);
                  setMaxPrice(max);
                }}
              >
                <option value="0-500000">Price ▾</option>
                <option value="0-50000">Under ₹50,000</option>
                <option value="50000-150000">₹50,000 – ₹1.5L</option>
                <option value="150000-300000">₹1.5L – ₹3L</option>
                <option value="300000-500000">₹3L – ₹5L</option>
              </select>
            </div>

            {/* Capacity Dropdown (if applicable) */}
            {showCapacityFilter && (
              <div className="amazon-select-pill-wrap">
                <select
                  className={`amazon-filter-select ${capacityFilter !== 'all' ? 'active' : ''}`}
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                >
                  <option value="all">Capacity ▾</option>
                  <option value="10kg">10 Kg</option>
                  <option value="15kg">15 Kg</option>
                </select>
              </div>
            )}

            {/* Reset Button when filters active */}
            {isFilterActive && (
              <button
                type="button"
                className="amazon-filter-btn clear-pill-btn"
                onClick={handleClearFilters}
              >
                <RotateCcw size={11} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CATEGORY TITLE & VIEW TOGGLE BAR */}
      <div className="category-results-bar">
        <div className="category-title-heading">
          <h3>
            {selectedCategory === 'All' ? 'All Products' : selectedCategory === 'For You' ? 'Recommended For You' : selectedCategory}
          </h3>
          <span className="showing-count-text">
            (Showing 1 – {sortedProducts.length} products of {products.length} products)
          </span>
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
            aria-label="List View"
          >
            <List size={18} />
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT WITH LEFT SIDEBAR FILTER (DESKTOP) */}
      <div className="product-catalog-layout">
        {/* LEFT FILTER SIDEBAR */}
        <aside className="left-filter-sidebar">
          <div className="sidebar-filter-header">
            <div className="sidebar-filter-title">
              <Filter size={16} />
              <span>FILTERS</span>
            </div>
            {isFilterActive && (
              <button className="clear-filters-btn" onClick={handleClearFilters}>
                CLEAR ALL
              </button>
            )}
          </div>

          {/* SORT BY SECTION */}
          <div className="filter-group">
            <button className="filter-group-header" onClick={() => toggleAccordion('sort')}>
              <span>SORT BY</span>
              {accordionOpen.sort ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordionOpen.sort && (
              <div className="filter-group-content">
                {SORT_OPTIONS.map((opt) => (
                  <label key={opt.id} className="filter-checkbox-row">
                    <input
                      type="radio"
                      name="sidebar-sort"
                      checked={sortBy === opt.id}
                      onChange={() => setSortBy(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CAPACITY SECTION - ONLY SHOWN WHEN USER SELECTS MACHINES */}
          {showCapacityFilter && (
            <div className="filter-group">
              <button className="filter-group-header" onClick={() => toggleAccordion('capacity')}>
                <span>CAPACITY</span>
                {accordionOpen.capacity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {accordionOpen.capacity && (
                <div className="filter-group-content">
                  <label className="filter-checkbox-row">
                    <input
                      type="radio"
                      name="capacity"
                      checked={capacityFilter === 'all'}
                      onChange={() => setCapacityFilter('all')}
                    />
                    <span>All Capacities</span>
                  </label>
                  <label className="filter-checkbox-row">
                    <input
                      type="radio"
                      name="capacity"
                      checked={capacityFilter === '10kg'}
                      onChange={() => setCapacityFilter('10kg')}
                    />
                    <span>10 Kg</span>
                  </label>
                  <label className="filter-checkbox-row">
                    <input
                      type="radio"
                      name="capacity"
                      checked={capacityFilter === '15kg'}
                      onChange={() => setCapacityFilter('15kg')}
                    />
                    <span>15 Kg</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* PRICE SECTION */}
          <div className="filter-group">
            <button className="filter-group-header" onClick={() => toggleAccordion('price')}>
              <span>PRICE</span>
              {accordionOpen.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordionOpen.price && (
              <div className="filter-group-content">
                <div className="price-slider-bar">
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="10000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="range-input"
                  />
                </div>
                <div className="price-select-row">
                  <select
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="price-select"
                  >
                    <option value={0}>Min</option>
                    <option value={10000}>₹10,000</option>
                    <option value={50000}>₹50,000</option>
                    <option value={100000}>₹1,00,000</option>
                  </select>
                  <span className="price-to-text">to</span>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="price-select"
                  >
                    <option value={50000}>₹50,000</option>
                    <option value={150000}>₹1,50,000</option>
                    <option value={300000}>₹3,00,000</option>
                    <option value={500000}>₹5,00,000+</option>
                  </select>
                </div>
              </div>
            )}
          </div>

        </aside>

        {/* RIGHT PRODUCTS COLUMN */}
        <div className="catalog-products-main">
          {sortedProducts.length > 0 ? (
            <div className="products-container">
              {selectedCategory === 'Genuine Spare Parts' ? (
                <>
                  <div className={viewMode === 'grid' ? 'products-grid' : 'products-list-wrapper'}>
                    {sortedProducts.filter(p => p.subcategory !== 'Speed Queen').map((product, idx) => (
                      <ProductCard
                        key={product._id || product.id || product.sku || `sp-${idx}`}
                        product={product}
                        onAddToCart={onAddToCart}
                        wishlistItems={wishlistItems}
                        onToggleWishlist={onToggleWishlist}
                        viewMode={viewMode}
                        onSelectProduct={handleProductSelect}
                      />
                    ))}
                  </div>

                  {sortedProducts.some(p => p.subcategory === 'Speed Queen') && (
                    <div className="subcategory-section">
                      <div style={{ width: '100%', textAlign: 'center', margin: '40px 0 20px' }}>
                        <h2 style={{ fontSize: '1.75rem', color: '#0f2b5c', fontWeight: 'bold' }}>Speed Queen Spare Parts</h2>
                      </div>
                      <div className={viewMode === 'grid' ? 'products-grid' : 'products-list-wrapper'}>
                        {sortedProducts.filter(p => p.subcategory === 'Speed Queen').map((product, idx) => (
                          <ProductCard
                            key={product._id || product.id || product.sku || `sq-${idx}`}
                            product={product}
                            onAddToCart={onAddToCart}
                            wishlistItems={wishlistItems}
                            onToggleWishlist={onToggleWishlist}
                            viewMode={viewMode}
                            onSelectProduct={handleProductSelect}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={viewMode === 'grid' ? 'products-grid' : 'products-list-wrapper'}>
                  {sortedProducts.map((product, idx) => (
                    <ProductCard
                      key={product._id || product.id || product.sku || `prod-${idx}`}
                      product={product}
                      onAddToCart={onAddToCart}
                      wishlistItems={wishlistItems}
                      onToggleWishlist={onToggleWishlist}
                      viewMode={viewMode}
                      onSelectProduct={handleProductSelect}
                      recommendationReason={selectedCategory === 'For You' ? reasonMap.get(product.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-products">
              <div className="no-products-icon">🔍</div>
              <h3>No exact products found for &quot;{searchTerm}&quot;</h3>
              <p>We couldn&apos;t find an exact match, but try browsing our recommended categories or clearing your active filters.</p>
              <button className="clear-filters-btn-inline" onClick={handleClearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRODUCT DETAIL MODAL (PDP Template) */}
      {selectedDetailProduct && (
        <ProductDetailModal
          product={selectedDetailProduct}
          onClose={() => setSelectedDetailProduct(null)}
          onAddToCart={onAddToCart}
          wishlistItems={wishlistItems}
          onToggleWishlist={onToggleWishlist}
          allProducts={products}
        />
      )}
    </section>
  );
}

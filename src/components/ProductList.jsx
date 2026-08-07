import { useState, useEffect, useMemo } from 'react';
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
  Filter,
  RotateCcw
} from 'lucide-react';
import './ProductList.css';
import { getRecommendations } from '../utils/recommendationEngine';
import { getSearchResultsWithSimilar, scoreProductSearchRelevance } from '../utils/searchEngine';

const CATEGORY_ITEMS = [
  { name: 'All', icon: LayoutGrid },
  { name: 'For You', icon: Sparkles },
  { name: 'Stacker', icon: Layers },
  { name: 'Packages', icon: Package },
  { name: 'LG Commercial Laundry Machines', icon: WashingMachine },
  { name: 'Speed Queen Commercial Laundry Machines', icon: Zap },
  { name: 'PONY Finishing Equipments', icon: Shirt },
  { name: 'Genuine Spare Parts', icon: Wrench },
  { name: 'Chemicals', icon: FlaskConical },
  { name: 'Seko', icon: SlidersHorizontal }
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
  };

  const isFilterActive = minPrice > 0 || maxPrice < 500000 || onlyAssured || (showCapacityFilter && capacityFilter !== 'all');

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
    } else if (selectedCategory === 'Chemicals') {
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
      matchesCategory = product.category === 'Chemicals' || (product.category === 'Packages' && !isMachinePackage && (product.name.toLowerCase().includes('chemical') || product.name === 'Retail Laundry Package'));
    } else {
      matchesCategory = product.category === selectedCategory;
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
    if (product.price < minPrice || product.price > maxPrice) return false;
    if (onlyAssured && (product.rating || 0) < 4.2) return false;

    if (showCapacityFilter && capacityFilter !== 'all') {
      const capSpec = (product.specifications?.Capacity || '').toLowerCase();
      const text = (product.name + ' ' + (product.description || '')).toLowerCase();
      
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
      default:
        return (b.reviews || 0) - (a.reviews || 0);
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
        <div className="category-filters">
          <div className="filter-label">Categories:</div>
          <div className="category-buttons">
            {CATEGORY_ITEMS.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={`category-btn ${selectedCategory === name ? 'active' : ''}`}
                onClick={() => onCategoryChange(name)}
              >
                <Icon size={16} className="category-btn-icon" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY TITLE & SORT TAB BAR */}
      <div className="category-results-bar">
        <div className="category-title-heading">
          <h3>
            {selectedCategory === 'All' ? 'All Products' : selectedCategory === 'For You' ? 'Recommended For You' : selectedCategory}
          </h3>
          <span className="showing-count-text">
            (Showing 1 – {sortedProducts.length} products of {products.length} products)
          </span>
        </div>

        <div className="sort-tabs-container">
          <span className="sort-by-title">Sort By</span>
          <div className="sort-tab-buttons">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`sort-tab-btn ${sortBy === opt.id ? 'active' : ''}`}
                onClick={() => setSortBy(opt.id)}
              >
                {opt.label}
              </button>
            ))}
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
      </div>

      {/* MAIN LAYOUT WITH LEFT SIDEBAR FILTER */}
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
                    {sortedProducts.filter(p => p.subcategory !== 'Speed Queen').map(product => (
                      <ProductCard
                        key={product.id}
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
                        {sortedProducts.filter(p => p.subcategory === 'Speed Queen').map(product => (
                          <ProductCard
                            key={product.id}
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
                  {sortedProducts.map(product => (
                    <ProductCard
                      key={product.id}
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

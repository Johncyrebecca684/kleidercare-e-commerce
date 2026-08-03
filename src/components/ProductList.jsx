import { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  Star
} from 'lucide-react';
import './ProductList.css';

const CATEGORY_ITEMS = [
  { name: 'All', icon: LayoutGrid },
  { name: 'For You', icon: Sparkles },
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
  const [minRating, setMinRating] = useState(0);
  const [onlyAssured, setOnlyAssured] = useState(false);
  const [minDiscount, setMinDiscount] = useState(0);
  const [capacityFilter, setCapacityFilter] = useState('all');

  const [accordionOpen, setAccordionOpen] = useState({
    capacity: true,
    price: true,
    rating: true,
    assured: true,
    discount: true
  });

  const toggleAccordion = (section) => {
    setAccordionOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleClearFilters = () => {
    setMinPrice(0);
    setMaxPrice(500000);
    setMinRating(0);
    setOnlyAssured(false);
    setMinDiscount(0);
    setCapacityFilter('all');
  };

  const isFilterActive = minPrice > 0 || maxPrice < 500000 || minRating > 0 || onlyAssured || minDiscount > 0 || capacityFilter !== 'all';

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

  const filteredProducts = products.filter(product => {
    let matchesCategory = true;
    if (selectedCategory === 'For You' || selectedCategory === 'All') {
      matchesCategory = true;
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

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower);

    if (!matchesCategory || !matchesSearch) return false;

    // Sidebar Filters
    if (product.price < minPrice || product.price > maxPrice) return false;
    if (minRating > 0 && (product.rating || 4) < minRating) return false;
    if (onlyAssured && (product.rating || 0) < 4.2) return false;

    if (minDiscount > 0) {
      const disc = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 20;
      if (disc < minDiscount) return false;
    }

    if (capacityFilter !== 'all') {
      const text = (product.name + ' ' + product.description).toLowerCase();
      if (capacityFilter === '10-15kg' && !text.includes('10') && !text.includes('15') && !text.includes('14')) return false;
      if (capacityFilter === '15-25kg' && !text.includes('15') && !text.includes('18') && !text.includes('20') && !text.includes('24') && !text.includes('25')) return false;
      if (capacityFilter === '25kg+' && !text.includes('25') && !text.includes('28') && !text.includes('30') && !text.includes('35') && !text.includes('super')) return false;
    }

    return true;
  });

  // Calculate personalization score if For You is selected
  const getProductScore = (product) => {
    let score = 0;
    const catLower = product.category.toLowerCase();
    const nameLower = product.name.toLowerCase();

    if (wishlistItems.some(item => item.category === product.category || item.id === product.id)) {
      score += 10;
    }

    searchHistory.forEach(query => {
      if (catLower.includes(query) || nameLower.includes(query)) {
        score += 8;
      }
    });

    browsingHistory.forEach(item => {
      if (item === product.category || item === product.id) {
        score += 6;
      }
    });

    score += (product.rating || 4) * 2;
    return score;
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (selectedCategory === 'For You' && sortBy === 'popular') {
      return getProductScore(b) - getProductScore(a);
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

          {/* CAPACITY SECTION */}
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
                    checked={capacityFilter === '10-15kg'}
                    onChange={() => setCapacityFilter('10-15kg')}
                  />
                  <span>10 Kg - 15 Kg</span>
                </label>
                <label className="filter-checkbox-row">
                  <input
                    type="radio"
                    name="capacity"
                    checked={capacityFilter === '15-25kg'}
                    onChange={() => setCapacityFilter('15-25kg')}
                  />
                  <span>15 Kg - 25 Kg</span>
                </label>
                <label className="filter-checkbox-row">
                  <input
                    type="radio"
                    name="capacity"
                    checked={capacityFilter === '25kg+'}
                    onChange={() => setCapacityFilter('25kg+')}
                  />
                  <span>25 Kg+ Commercial</span>
                </label>
              </div>
            )}
          </div>

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

          {/* CUSTOMER RATINGS SECTION */}
          <div className="filter-group">
            <button className="filter-group-header" onClick={() => toggleAccordion('rating')}>
              <span>CUSTOMER RATINGS</span>
              {accordionOpen.rating ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordionOpen.rating && (
              <div className="filter-group-content">
                {[4, 3, 2, 1].map((starVal) => (
                  <label key={starVal} className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={minRating === starVal}
                      onChange={() => setMinRating(minRating === starVal ? 0 : starVal)}
                    />
                    <span className="rating-checkbox-text">
                      {starVal} <Star size={12} fill="#eab308" color="#eab308" /> & above
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ASSURED SECTION */}
          <div className="filter-group">
            <button className="filter-group-header" onClick={() => toggleAccordion('assured')}>
              <span>ASSURANCE</span>
              {accordionOpen.assured ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordionOpen.assured && (
              <div className="filter-group-content">
                <label className="filter-checkbox-row">
                  <input
                    type="checkbox"
                    checked={onlyAssured}
                    onChange={(e) => setOnlyAssured(e.target.checked)}
                  />
                  <span className="assured-filter-tag">⚡ Assured Products</span>
                </label>
              </div>
            )}
          </div>

          {/* DISCOUNT SECTION */}
          <div className="filter-group">
            <button className="filter-group-header" onClick={() => toggleAccordion('discount')}>
              <span>DISCOUNT</span>
              {accordionOpen.discount ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordionOpen.discount && (
              <div className="filter-group-content">
                {[30, 20, 10].map((discVal) => (
                  <label key={discVal} className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={minDiscount === discVal}
                      onChange={() => setMinDiscount(minDiscount === discVal ? 0 : discVal)}
                    />
                    <span>{discVal}% or more</span>
                  </label>
                ))}
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
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-products">
              <div className="no-products-icon">🔍</div>
              <h3>No products match your filters</h3>
              <p>Try adjusting your price range, ratings, or clearing filters</p>
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
        />
      )}
    </section>
  );
}

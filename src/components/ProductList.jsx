import { useState } from 'react';
import ProductCard from './ProductCard';
import { ChevronDown } from 'lucide-react';
import './ProductList.css';

export default function ProductList({
  products,
  onAddToCart,
  selectedCategory,
  onCategoryChange,
  searchTerm,
}) {
  const [sortBy, setSortBy] = useState('popular');

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' ? true : product.category === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
      default:
        return b.reviews - a.reviews;
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
            {['All', 'LG Commercial Laundry Machines', 'Speed Queen Commercial Laundry Machines', 'PONY Finishing Equipments', 'Genuine Spare Parts', 'Chemicals'].map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="sort-container">
          <div className="sort-label">Sort by:</div>
          <div className="sort-dropdown">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rating</option>
            </select>
            <ChevronDown size={18} className="select-icon" />
          </div>
        </div>
      </div>

      <div className="results-info">
        <span>{sortedProducts.length} products found</span>
      </div>

      {sortedProducts.length > 0 ? (
        <div className="products-container">
          {selectedCategory === 'Genuine Spare Parts' ? (
            <>
              <div className="products-grid">
                {sortedProducts.filter(p => p.subcategory !== 'Speed Queen').map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>

              {sortedProducts.some(p => p.subcategory === 'Speed Queen') && (
                <div className="subcategory-section">
                  <div style={{ width: '100%', textAlign: 'center', margin: '60px 0 30px' }}>
                    <h2 style={{ fontSize: '2rem', color: '#1a365d', fontWeight: 'bold' }}>Speed Queen Spare Parts</h2>
                  </div>
                  <div className="products-grid">
                    {sortedProducts.filter(p => p.subcategory === 'Speed Queen').map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={onAddToCart}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="products-grid">
              {sortedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="no-products">
          <div className="no-products-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search term</p>
        </div>
      )}
    </section>
  );
}

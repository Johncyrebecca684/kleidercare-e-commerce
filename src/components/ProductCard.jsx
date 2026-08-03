import { Heart, ShoppingCart, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useCompare } from '../context/CompareContext';
import './ProductCard.css';

const WARRANTY_OPTIONS = [
  { id: 'none', type: 'None', title: 'Standard (1-Yr Included)', price: 0 },
  { id: '1year', type: '1-Year', title: '+1-Yr Extended Warranty (+₹1,499)', price: 1499 },
  { id: '3year', type: '3-Year', title: '+3-Yr Commercial Care (+₹3,499)', price: 3499 }
];

export default function ProductCard({ product, onAddToCart, wishlistItems = [], onToggleWishlist, viewMode = 'list', onSelectProduct }) {
  const [showAddedNotice, setShowAddedNotice] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState(WARRANTY_OPTIONS[0]);
  const { isInCompare, toggleCompare, compareItems, maxCompare } = useCompare();
  const isCompared = isInCompare(product.id);

  const handleProductClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const currentPrice = product.price + selectedWarranty.price;
  const currentGstPrice = product.priceWithGst
    ? product.priceWithGst + Math.round(selectedWarranty.price * 1.18)
    : Math.round(currentPrice * 1.18);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart({
      ...product,
      selectedWarranty,
      priceWithWarranty: currentPrice,
      effectiveGstPrice: currentGstPrice
    });
    setShowAddedNotice(true);
    setTimeout(() => setShowAddedNotice(false), 2000);
  };

  const isWishlisted = wishlistItems.some(item => item.id === product.id);

  // Generate bullet specs list for List view
  const bulletSpecs = product.specifications
    ? Object.entries(product.specifications).slice(0, 4).map(([k, v]) => `${k}: ${v}`)
    : [
        'Commercial Heavy Duty Industrial Performance',
        'High Energy Efficiency & Reduced Water Usage',
        'Built-in Stainless Steel Heavy Duty Drum',
        '2 Years Warranty & On-Site Installation Support'
      ];

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 36;

  if (viewMode === 'list') {
    return (
      <article className="product-card list-mode-card">
        {/* LEFT COLUMN: Image & Compare */}
        <div className="list-col-left">
          <div className="list-image-wrapper" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
            <img
              src={product.image}
              alt={product.name}
              className={`product-image ${product.category && product.category.includes('Speed Queen') ? 'speed-queen-image' : ''} ${product.category === 'Seko' ? 'seko-image' : ''}`}
            />
            <button
              className={`wishlist-btn-card ${isWishlisted ? 'wishlisted' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
              aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          <label className="compare-checkbox-label">
            <input
              type="checkbox"
              checked={isCompared}
              onChange={() => toggleCompare(product)}
              disabled={!isCompared && compareItems.length >= maxCompare}
            />
            <span>{isCompared ? 'Comparing' : compareItems.length >= maxCompare ? 'Max 4 reached' : 'Add to Compare'}</span>
          </label>
        </div>

        {/* MIDDLE COLUMN: Title, Rating, Bullet Specs */}
        <div className="list-col-mid">
          <h3 className="list-product-name" onClick={handleProductClick}>{product.name}</h3>
          
          <div className="list-rating-row">
            <span className="rating-pill-green">
              {product.rating || 4.3} <Star size={11} fill="#fff" color="#fff" />
            </span>
            <span className="rating-counts">
              {(product.reviews ? product.reviews * 40 : 15973).toLocaleString('en-IN')} Ratings & {(product.reviews || 1218).toLocaleString('en-IN')} Reviews
            </span>
          </div>

          <ul className="list-bullet-specs" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
            {bulletSpecs.map((spec, idx) => (
              <li key={idx}>• {spec}</li>
            ))}
          </ul>
        </div>

        {/* RIGHT COLUMN: Price, Badges, Offer, Add to Cart */}
        <div className="list-col-right">
          <div className="list-price-row">
            <span className="list-current-price">₹{currentPrice.toLocaleString('en-IN')}</span>
            <span className="assured-badge">⚡Assured</span>
          </div>

          <div className="list-original-price-row">
            <span className="list-original-price">
              ₹{(product.originalPrice || Math.round(product.price * 1.35)).toLocaleString('en-IN')}
            </span>
            <span className="list-discount-tag">{discountPercent}% off</span>
          </div>

          <div className="list-bank-offer-tag">Bank Offer & GST Invoice Available</div>

          <button
            className="add-to-cart-btn list-cart-btn"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>

          {showAddedNotice && (
            <div className="added-notice">✓ Added to cart!</div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="product-card">
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.name,
          "image": `https://kleidercare.example.com${product.image}`,
          "description": product.description,
          "brand": {
            "@type": "Brand",
            "name": product.category
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviews
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": product.price,
            "availability": "https://schema.org/InStock"
          }
        })}
      </script>
      <div className="product-image-container" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
        <img
          src={product.image}
          alt={product.name}
          className={`product-image ${product.category && product.category.includes('Speed Queen') ? 'speed-queen-image' : ''} ${product.category === 'Seko' ? 'seko-image' : ''}`}
        />


        <button
          className={`wishlist-btn-card ${isWishlisted ? 'wishlisted' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <div className="overlay-actions">
          <button
            className="quick-add-btn"
            onClick={handleAddToCart}
            aria-label={`Quick add ${product.name} to cart`}
          >
            <ShoppingCart size={18} />
            Quick Add
          </button>
        </div>
      </div>

      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name" onClick={handleProductClick} style={{ cursor: 'pointer' }}>{product.name}</h3>
        <div className="description-wrapper">
          <p className={`product-description ${isDescExpanded ? 'expanded' : ''}`}>{product.description}</p>
          {product.description && product.description.length > 70 && (
            <button
              className="read-more-btn"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
            >
              {isDescExpanded ? 'less' : 'more...'}
            </button>
          )}
        </div>

        <div className="rating-section">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < Math.floor(product.rating) ? '#FFD700' : '#E0E0E0'}
                color={i < Math.floor(product.rating) ? '#FFD700' : '#E0E0E0'}
              />
            ))}
          </div>
          <span className="rating-text">{product.rating} ({product.reviews} reviews)</span>
        </div>

        {product.specifications && (
          <div className="specifications-container">
            <button
              className="toggle-specs-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label="Toggle specifications"
            >
              {isExpanded ? 'Hide Specifications' : 'View Specifications'}
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
              <ul className="specs-list">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <li key={key}>
                    <span className="spec-key">{key}:</span>
                    <span className="spec-value">{value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="price-section">
          <div className="price-row-main">
            <span className="current-price">₹{currentPrice.toLocaleString('en-IN')}</span>
            {product.originalPrice &&
              product.originalPrice !== product.price &&
              !(product.category && ['lg', 'speed queen', 'pony', 'seko'].some(keyword => product.category.toLowerCase().includes(keyword))) && (
                <span className="original-price">₹{(product.originalPrice + selectedWarranty.price).toLocaleString('en-IN')}</span>
              )}
          </div>
          <div className="gst-info">
            <span className="inclusive-text">
              ₹{currentGstPrice.toLocaleString('en-IN')} (Inclusive of GST)
            </span>
          </div>
        </div>

        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>

        {showAddedNotice && (
          <div className="added-notice">✓ Added to cart!</div>
        )}
      </div>
    </article>
  );
}

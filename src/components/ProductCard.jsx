import { Heart, ShoppingCart, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart, wishlistItems = [], onToggleWishlist }) {
  const [showAddedNotice, setShowAddedNotice] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product);
    setShowAddedNotice(true);
    setTimeout(() => setShowAddedNotice(false), 2000);
  };

  const isWishlisted = wishlistItems.some(item => item.id === product.id);

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
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className={`product-image ${product.category && product.category.includes('Speed Queen') ? 'speed-queen-image' : ''}`}
        />

        {product.badge && (
          <div className="badge-container">
            <span className={`badge badge-${product.badge.toLowerCase().replace(/\s+/g, '-')}`}>
              {product.badge}
            </span>
          </div>
        )}

        <button
          className={`wishlist-btn-card ${isWishlisted ? 'wishlisted' : ''}`}
          onClick={() => onToggleWishlist(product)}
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
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

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
          <span className="current-price">₹{product.price}</span>
          <span className="original-price">₹{product.originalPrice}</span>
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

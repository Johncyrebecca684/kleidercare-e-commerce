import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAddedNotice, setShowAddedNotice] = useState(false);

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  const handleAddToCart = () => {
    onAddToCart(product);
    setShowAddedNotice(true);
    setTimeout(() => setShowAddedNotice(false), 2000);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" />
        
        {product.badge && (
          <div className="badge-container">
            <span className={`badge badge-${product.badge.toLowerCase().replace(/\s+/g, '-')}`}>
              {product.badge}
            </span>
          </div>
        )}

        <div className="discount-badge">{discount}% OFF</div>

        <button 
          className={`wishlist-btn-card ${isWishlisted ? 'wishlisted' : ''}`}
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <div className="overlay-actions">
          <button 
            className="quick-add-btn"
            onClick={handleAddToCart}
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

        <div className="price-section">
          <span className="current-price">₹{product.price}</span>
          <span className="original-price">₹{product.originalPrice}</span>
        </div>

        <button 
          className="add-to-cart-btn"
          onClick={handleAddToCart}
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>

        {showAddedNotice && (
          <div className="added-notice">✓ Added to cart!</div>
        )}
      </div>
    </div>
  );
}

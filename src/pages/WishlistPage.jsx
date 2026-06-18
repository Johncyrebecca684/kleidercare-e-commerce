import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft, ArrowRight, Heart, ChevronDown, ChevronUp, Star } from 'lucide-react';
import './WishlistPage.css';

import './WishlistPage.css';

function WishlistItem({ item, onAddToCart, onRemoveFromWishlist }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="wishlist-page-item-container">
      <div className="wishlist-page-item">
        <img src={item.image} alt={item.name} className="wishlist-page-item-image" />
        
        <div className="wishlist-page-item-details">
          <h3 className="wishlist-page-item-name">{item.name}</h3>
          <p className="wishlist-page-item-category">{item.category}</p>
          <div className="wishlist-page-item-rating">
            <Star size={14} fill="#FFD700" color="#FFD700" />
            <span>{item.rating} ({item.reviews} reviews)</span>
          </div>
          <p className="wishlist-page-item-price">₹{item.price}</p>
        </div>

        <div className="wishlist-page-item-actions">
          <button 
            className="wishlist-page-add-cart-btn"
            onClick={() => onAddToCart(item)}
          >
            <ShoppingCart size={18} />
            Move to Cart
          </button>
          <button 
            className="wishlist-page-remove-btn"
            onClick={() => onRemoveFromWishlist(item.id)}
            title="Remove from Wishlist"
          >
            <Trash2 size={20} />
          </button>
          <button 
            className="wishlist-page-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Toggle Details"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="wishlist-page-item-expanded">
          <div className="wishlist-page-item-description">
            <h4>Description</h4>
            <p>{item.description}</p>
          </div>
          {item.specifications && (
            <div className="wishlist-page-item-specs">
              <h4>Specifications</h4>
              <ul>
                {Object.entries(item.specifications).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WishlistPage({ wishlistItems, onRemoveFromWishlist, onAddToCart }) {
  const handleAddToCart = (item) => {
    onAddToCart(item);
    onRemoveFromWishlist(item.id);
  };

  return (
    <div className="wishlist-page-wrapper animate-fade-in">
      <div className="wishlist-page-container">
        <div className="wishlist-page-header">
          <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1a4a8d', textDecoration: 'none', marginBottom: '15px', fontWeight: '600' }}>
            <ArrowLeft size={18} /> Continue Shopping
          </Link>
          <h1>Your Wishlist</h1>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="empty-wishlist-page">
            <Heart className="empty-wishlist-icon" size={72} color="#ccc" />
            <h2>Your wishlist is empty</h2>
            <p>Save items you love and buy them later.</p>
            <Link to="/" className="continue-shopping-btn-main">
              Explore Products <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="wishlist-page-content">
            <div className="wishlist-items-section">
              {wishlistItems.map(item => (
                <WishlistItem 
                  key={item.id} 
                  item={item} 
                  onAddToCart={handleAddToCart} 
                  onRemoveFromWishlist={onRemoveFromWishlist} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

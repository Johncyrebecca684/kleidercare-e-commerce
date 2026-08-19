import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft, ArrowRight, Heart, ChevronDown, ChevronUp, Lock, Plus } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import './WishlistPage.css';

function WishlistItem({ item, onAddToCart, onRemoveFromWishlist }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="wishlist-page-item-container">
      <div className="wishlist-page-item">
        <img src={formatImageUrl(item.image)} alt={item.name} className="wishlist-page-item-image" />
        
        <div className="wishlist-page-item-details">
          <h3 className="wishlist-page-item-name">{item.name}</h3>
          <p className="wishlist-page-item-category">{item.category}</p>
          <p className="wishlist-page-item-price">₹{item.price.toLocaleString('en-IN')}</p>
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

export default function WishlistPage({ wishlistItems = [], onRemoveFromWishlist, onAddToCart, cartCount = 0 }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-collections');
  const [showItemDetails, setShowItemDetails] = useState(false);

  const handleAddToCart = (item) => {
    onAddToCart(item);
    onRemoveFromWishlist(item.id);
  };

  // 4 image slots for the collection preview card
  const previewItems = wishlistItems.slice(0, 4);
  const remainingCount = Math.max(0, wishlistItems.length - 3);

  return (
    <div className="wishlist-page-wrapper animate-fade-in">
      {/* MOBILE TOP BLUE HEADER (EXACTLY MATCHING USER SCREENSHOT) */}
      <div className="mobile-wishlist-top-bar">
        <div className="mobile-wishlist-header-left">
          <button
            type="button"
            className="mobile-wishlist-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={22} color="#ffffff" />
          </button>
          <h2 className="mobile-wishlist-title">Wishlist & Collections</h2>
        </div>

        <Link to="/cart" className="mobile-wishlist-cart-btn" aria-label="View Cart">
          <ShoppingCart size={22} color="#ffffff" />
          {cartCount > 0 && <span className="mobile-wishlist-cart-badge">{cartCount}</span>}
        </Link>
      </div>

      {/* MOBILE TABS (MY COLLECTIONS / COLLECTIONS I FOLLOW) */}
      <div className="mobile-wishlist-tabs-bar">
        <button
          type="button"
          className={`mobile-wishlist-tab ${activeTab === 'my-collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-collections')}
        >
          My collections
        </button>
        <button
          type="button"
          className={`mobile-wishlist-tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Collections I follow
        </button>
      </div>

      <div className="wishlist-page-container">
        {/* DESKTOP HEADER (HIDDEN ON MOBILE) */}
        <div className="wishlist-page-header desktop-only">
          <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1a4a8d', textDecoration: 'none', marginBottom: '15px', fontWeight: '600' }}>
            <ArrowLeft size={18} /> Continue Shopping
          </Link>
          <h1>Your Wishlist</h1>
        </div>

        {/* MOBILE COLLECTIONS CARD VIEW */}
        <div className="mobile-collections-view">
          {activeTab === 'my-collections' ? (
            <div className="mobile-collection-card" onClick={() => setShowItemDetails(!showItemDetails)}>
              {/* 4 THUMBNAIL PREVIEWS ROW */}
              <div className="collection-preview-grid">
                {previewItems.length > 0 ? (
                  <>
                    <div className="preview-img-slot">
                      <img src={formatImageUrl(previewItems[0]?.image)} alt={previewItems[0]?.name} />
                    </div>
                    <div className="preview-img-slot">
                      {previewItems[1] ? (
                        <img src={formatImageUrl(previewItems[1]?.image)} alt={previewItems[1]?.name} />
                      ) : (
                        <div className="empty-preview-slot" />
                      )}
                    </div>
                    <div className="preview-img-slot">
                      {previewItems[2] ? (
                        <img src={formatImageUrl(previewItems[2]?.image)} alt={previewItems[2]?.name} />
                      ) : (
                        <div className="empty-preview-slot" />
                      )}
                    </div>
                    <div className="preview-img-slot overlay-slot">
                      {previewItems[3] ? (
                        <img src={formatImageUrl(previewItems[3]?.image)} alt={previewItems[3]?.name} />
                      ) : (
                        <div className="empty-preview-slot" />
                      )}
                      {wishlistItems.length > 3 && (
                        <div className="preview-count-overlay">
                          +{remainingCount} more
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="no-items-preview-placeholder">
                    <Heart size={28} color="#94a3b8" />
                    <span>0 items</span>
                  </div>
                )}
              </div>

              {/* CARD INFO FOOTER */}
              <div className="collection-card-meta">
                <h3 className="collection-card-title">My Wishlist</h3>
                <div className="collection-subtext">
                  <Lock size={14} className="privacy-lock-icon" />
                  <span>Private</span>
                  <span className="dot-sep">•</span>
                  <span>{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mobile-empty-following-collections">
              <p>You are not following any public collections yet.</p>
            </div>
          )}

          {/* FLOATING/BOTTOM CREATE NEW COLLECTION BUTTON */}
          <div className="mobile-create-collection-wrap">
            <button
              type="button"
              className="mobile-create-collection-btn"
              onClick={() => alert('New collection created.')}
            >
              <Plus size={18} /> Create a new collection
            </button>
          </div>
        </div>

        {/* DETAILED ITEMS LIST (DESKTOP OR TOGGLED ON MOBILE) */}
        {wishlistItems.length === 0 ? (
          <div className="empty-wishlist-page desktop-only">
            <Heart className="empty-wishlist-icon" size={72} color="#ccc" />
            <h2>Your wishlist is empty</h2>
            <p>Save items you love and buy them later.</p>
            <Link to="/" className="continue-shopping-btn-main">
              Explore Products <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className={`wishlist-page-content ${showItemDetails ? 'mobile-visible' : 'desktop-only'}`}>
            <div className="wishlist-items-section">
              <div className="wishlist-detail-header-mobile">
                <h3>My Wishlist Items ({wishlistItems.length})</h3>
              </div>
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

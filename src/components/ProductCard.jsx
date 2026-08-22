import { Heart, ShoppingCart, ChevronDown, ChevronUp, Sparkles, Share2 } from 'lucide-react';
import { useState } from 'react';
import { formatImageUrl } from '../utils/imageUtils';
import AddToCartButton from './AddToCartButton';
import WishlistButton from './WishlistButton';
import './ProductCard.css';

const WARRANTY_OPTIONS = [
  { id: 'none', type: 'None', title: 'Standard (1-Yr Included)', price: 0 },
  { id: '1year', type: '1-Year', title: '+1-Yr Extended Warranty (+₹1,499)', price: 1499 },
  { id: '3year', type: '3-Year', title: '+3-Yr Commercial Care (+₹3,499)', price: 3499 }
];

export default function ProductCard({ product, onAddToCart, wishlistItems = [], onToggleWishlist, viewMode = 'list', onSelectProduct, recommendationReason }) {
  const [showAddedNotice, setShowAddedNotice] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState(WARRANTY_OPTIONS[0]);

  const handleProductClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const handleShareWhatsApp = (e) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const shareMsg = `Check out *${product.name}* on Kleider Care:\n\nPrice: ₹${product.price.toLocaleString('en-IN')}\n\nView product link: ${productUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`;
    window.open(whatsappUrl, '_blank');
  };

  const currentPrice = product.price + selectedWarranty.price;
  const currentGstPrice = product.priceWithGst
    ? product.priceWithGst + Math.round(selectedWarranty.price * 1.18)
    : Math.round(currentPrice * 1.18);

  const isOutOfStock = (product.stock !== undefined && Number(product.stock) <= 0) || product.stockStatus === 'Out of Stock';

  const handleAddToCart = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart({
      ...product,
      selectedWarranty,
      priceWithWarranty: currentPrice,
      effectiveGstPrice: currentGstPrice
    });
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

  const formattedImg = formatImageUrl(product.image);

  if (viewMode === 'list') {
    return (
      <article className="product-card list-mode-card">
        {/* LEFT COLUMN: Image & Compare */}
        <div className="list-col-left">
          <div className="list-image-wrapper" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
            <img
              src={formattedImg}
              alt={product.name}
              className={`product-image ${product.category && product.category.includes('Speed Queen') ? 'speed-queen-image' : ''} ${product.category === 'Seko' ? 'seko-image' : ''}`}
            />
            <WishlistButton
              isWishlisted={isWishlisted}
              onToggle={() => onToggleWishlist(product)}
              size="sm"
              className="wishlist-btn-card-wrapper"
              style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5 }}
            />
          </div>
        </div>

        {/* MIDDLE COLUMN: Title, Bullet Specs */}
        <div className="list-col-mid">
          <h3 className="list-product-name" onClick={handleProductClick}>{product.name}</h3>
          {recommendationReason && (
            <div className="recommendation-reason-pill">
              <Sparkles size={12} /> {recommendationReason}
            </div>
          )}

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
          </div>

          <div className="list-original-price-row">
            <span className="list-original-price">
              ₹{(product.originalPrice || Math.round(product.price * 1.35)).toLocaleString('en-IN')}
            </span>
            <span className="list-discount-tag">{discountPercent}% off</span>
          </div>

          <div className="list-bank-offer-tag">Bank Offer & GST Invoice Available</div>

          {isOutOfStock ? (
            <div className="out-of-stock-pill list-mode-pill">⚠️ Out of Stock</div>
          ) : (
            <div className="in-stock-pill list-mode-pill">✓ In Stock</div>
          )}

          <AddToCartButton
            className="list-cart-btn-animated"
            onClick={handleAddToCart}
            isOutOfStock={isOutOfStock}
            defaultText="Add to Cart"
            addedText="Added!"
            size="sm"
          />

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
      <div className={`product-image-container ${isOutOfStock ? 'out-of-stock-container' : ''}`} onClick={handleProductClick} style={{ cursor: 'pointer' }}>
        <img
          src={formattedImg}
          alt={product.name}
          className={`product-image ${product.category && product.category.includes('Speed Queen') ? 'speed-queen-image' : ''} ${product.category === 'Seko' ? 'seko-image' : ''}`}
        />

        {isOutOfStock && (
          <div className="out-of-stock-banner">OUT OF STOCK</div>
        )}

        <WishlistButton
          isWishlisted={isWishlisted}
          onToggle={() => onToggleWishlist(product)}
          size="md"
          className="wishlist-btn-card-wrapper"
          style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 5 }}
        />

        <button
          className="share-btn-card"
          onClick={handleShareWhatsApp}
          title="Share via WhatsApp"
          aria-label={`Share ${product.name} via WhatsApp`}
          style={{
            position: 'absolute',
            top: '12px',
            right: '48px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.2s ease',
            color: '#25D366',
            zIndex: 3
          }}
        >
          <Share2 size={18} />
        </button>

        {!isOutOfStock && (
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
        )}
      </div>

      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name" onClick={handleProductClick} style={{ cursor: 'pointer' }}>{product.name}</h3>
        {recommendationReason && (
          <div className="recommendation-reason-pill">
            <Sparkles size={12} /> {recommendationReason}
          </div>
        )}
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

        <AddToCartButton
          className="card-cart-btn-animated"
          onClick={handleAddToCart}
          isOutOfStock={isOutOfStock}
          defaultText="Add to Cart"
          addedText="Added to Cart!"
          size="md"
        />

        {showAddedNotice && (
          <div className="added-notice">✓ Added to cart!</div>
        )}
      </div>
    </article>
  );
}

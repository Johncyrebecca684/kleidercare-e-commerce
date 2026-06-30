import {
  ChevronDown,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
  Package,
  Headset,
  LayoutDashboard,
  Heart
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const categories = [
  { label: 'All', href: '#products' },
  { label: 'LG Commercial Laundry Machines', href: '#products' },
  { label: 'Speed Queen Commercial Laundry Machines', href: '#products' },
  { label: 'PONY Finishing Equipments', href: '#products' },
  { label: 'Genuine Spare Parts', href: '#products' },
  { label: 'Chemicals', href: '#products' },
];

export default function Header({ cartCount, wishlistCount, searchTerm, onSearchChange, onSigninClick, loggedInUser, onProfileClick, onTrackOrderClick, selectedCategory, onCategoryChange }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartBadge = useMemo(() => {
    if (!cartCount) return null;
    return cartCount > 99 ? '99+' : String(cartCount);
  }, [cartCount]);

  const wishlistBadge = useMemo(() => {
    if (!wishlistCount) return null;
    return wishlistCount > 99 ? '99+' : String(wishlistCount);
  }, [wishlistCount]);

  return (
    <header className="siteHeader animate-fade-in">
      <div className="topBannerStrip">
        <div className="topBannerInner">
          <div className="topBannerLeft">Welcome to Kleider Care!</div>
          <div className="topBannerRight">
            <span>Deliver to 423651</span>
            <span className="divider">|</span>
            <button type="button" className="topBannerLink" onClick={() => navigate('/track-order')} aria-label="Track your order">Track your order</button>
          </div>
        </div>
      </div>
      <div className="siteHeaderTop">
        <a className="brand" href="#home" aria-label="Go to home">
          <img src="/kc-logo.png" alt="Kleider Care" className="brandLogo" />
        </a>



        <div className="headerSearchWrap" role="search">
          <div className="headerSearchCategoryWrapper">
            <select
              className="headerSearchCategorySelect"
              value={selectedCategory || "All"}
              onChange={(e) => {
                onCategoryChange(e.target.value);
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}
              aria-label="Select category"
            >
              {categories.map(c => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="headerSearchCategoryIcon" />
          </div>
          <input
            className="headerSearchInput"
            type="search"
            placeholder="Search LG machines, Speed Queen, spare parts, and more..."
            value={searchTerm || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/?q=${encodeURIComponent(searchTerm || '')}`);
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            aria-label="Search products"
          />
          <button
            className="headerSearchBtn"
            type="button"
            aria-label="Search"
            onClick={() => {
              navigate(`/?q=${encodeURIComponent(searchTerm || '')}`);
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Search size={20} />
          </button>
        </div>

        <div className="headerRight">
          {loggedInUser ? (
            <button className="userProfileBtn" type="button" onClick={onProfileClick} aria-label={`Profile for ${loggedInUser.firstName}`}>
              <span className="userInitials">
                {loggedInUser.firstName.charAt(0)}{loggedInUser.lastName.charAt(0)}
              </span>
              <span className="userName">{loggedInUser.firstName}</span>
            </button>
          ) : (
            <>
              <button className="authBtn signinBtn" type="button" onClick={onSigninClick} aria-label="Sign in">
                Sign In
              </button>
            </>
          )}
          {loggedInUser?.role === 'admin' ? (
            <button className="trackOrderBtn adminBtn" type="button" onClick={() => navigate('/admin')} title="Admin Dashboard" aria-label="Admin Dashboard">
              <LayoutDashboard size={22} />
              <span className="trackLabel">Dashboard</span>
            </button>
          ) : (
            <>
              <button className="trackOrderBtn" type="button" onClick={() => navigate('/support')} title="Support" aria-label="Support">
                <Headset size={22} />
                <span className="trackLabel">Support</span>
              </button>

              <button className="cartMini" type="button" onClick={() => navigate('/wishlist')} title="Wishlist" aria-label="Wishlist">
                <span className="cartIconWrap">
                  <Heart size={22} />
                  {wishlistBadge ? <span className="cartCount">{wishlistBadge}</span> : null}
                </span>
                <span className="cartLabel">Wishlist</span>
              </button>

              <button className="cartMini" type="button" onClick={() => navigate('/cart')} aria-label={`Shopping Cart, ${cartCount || 0} items`}>
                <span className="cartIconWrap">
                  <ShoppingCart size={22} />
                  {cartBadge ? <span className="cartCount">{cartBadge}</span> : null}
                </span>
                <span className="cartLabel">Cart</span>
              </button>
            </>
          )}
        </div>

        <button
          className="mobileMenuBtn"
          type="button"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`siteHeaderBottom ${isMenuOpen ? 'open' : ''}`}>
        <nav className="categoryNav" aria-label="Category navigation">
          {categories.map((c) => (
            <a
              key={c.label}
              className={`categoryLink ${selectedCategory === c.label ? 'active' : ''}`}
              href={c.href}
              onClick={() => {
                onCategoryChange(c.label);
              }}
            >
              {c.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

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
  LayoutDashboard
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
];

export default function Header({ cartCount, onSearchChange, onSignupClick, loggedInUser, onProfileClick, onTrackOrderClick }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartBadge = useMemo(() => {
    if (!cartCount) return null;
    return cartCount > 99 ? '99+' : String(cartCount);
  }, [cartCount]);

  return (
    <header className="siteHeader animate-fade-in">
      <div className="siteHeaderTop">
        <a className="brand" href="#home" aria-label="Go to home">
          <span className="brandMark" aria-hidden="true">

          </span>
          <span className="brandText">
            Kleider<span className="brandTextAccent">Care</span>
          </span>
        </a>

        <button className="deliverTo" type="button">
          <MapPin size={18} />
          <span className="deliverToText">
            <span className="deliverToLabel">Deliver to</span>
            <span className="deliverToValue">Chennai 600130</span>
          </span>
        </button>

        <div className="headerSearchWrap" role="search">
          <button className="headerSearchCategory" type="button">
            <span>All</span>
            <ChevronDown size={16} />
          </button>
          <input
            className="headerSearchInput"
            type="search"
            placeholder="Search LG machines, Speed Queen, spare parts, and more..."
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search products"
          />
          <button className="headerSearchBtn" type="button" aria-label="Search">
            <Search size={20} />
          </button>
        </div>

        <div className="headerRight">
          {loggedInUser ? (
            <button className="userProfileBtn" type="button" onClick={onProfileClick}>
              <span className="userInitials">
                {loggedInUser.firstName.charAt(0)}{loggedInUser.lastName.charAt(0)}
              </span>
              <span className="userName">{loggedInUser.firstName}</span>
            </button>
          ) : (
            <>
              <button className="authBtn signupBtn" type="button" onClick={onSignupClick}>
                Sign Up
              </button>
            </>
          )}
          {loggedInUser?.role === 'admin' ? (
            <button className="trackOrderBtn adminBtn" type="button" onClick={() => navigate('/admin')} title="Admin Dashboard">
              <LayoutDashboard size={22} />
              <span className="trackLabel">Dashboard</span>
            </button>
          ) : (
            <>
              <button className="trackOrderBtn" type="button" onClick={() => navigate('/support')} title="Support">
                <Headset size={22} />
                <span className="trackLabel">Support</span>
              </button>
              <button className="trackOrderBtn" type="button" onClick={() => navigate('/track-order')} title="Track Order">
                <Package size={22} />
                <span className="trackLabel">Track</span>
              </button>
              <button className="cartMini" type="button" onClick={() => navigate('/cart')}>
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
            <a key={c.label} className="categoryLink" href={c.href}>
              {c.label}
            </a>
          ))}
        </nav>
        <div className="topStrip">
          Free delivery above ₹500 • 7-day returns • Cash on delivery available
        </div>
      </div>
    </header>
  );
}

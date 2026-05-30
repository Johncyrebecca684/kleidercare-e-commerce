import {
  ChevronDown,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import './Header.css';

const categories = [
  { label: 'All', href: '#products' },
  { label: 'Detergent Powder', href: '#products' },
  { label: 'Liquid Detergent', href: '#products' },
  { label: 'Stain Removers', href: '#products' },
  { label: 'Fabric Softeners', href: '#products' },
  { label: 'Value Packs', href: '#products' },
];

export default function Header({ cartCount, onCartClick, onSearchChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartBadge = useMemo(() => {
    if (!cartCount) return null;
    return cartCount > 99 ? '99+' : String(cartCount);
  }, [cartCount]);

  return (
    <header className="siteHeader">
      <div className="siteHeaderTop">
        <a className="brand" href="#home" aria-label="Go to home">
          <span className="brandMark" aria-hidden="true">
            🧼
          </span>
          <span className="brandText">
            Laundry<span className="brandTextAccent">Mart</span>
          </span>
        </a>

        <button className="deliverTo" type="button">
          <MapPin size={18} />
          <span className="deliverToText">
            <span className="deliverToLabel">Deliver to</span>
            <span className="deliverToValue">Mumbai 400001</span>
          </span>
        </button>

        <div className="searchWrap" role="search">
          <button className="searchCategory" type="button">
            <span>All</span>
            <ChevronDown size={16} />
          </button>
          <input
            className="searchInput"
            type="search"
            placeholder="Search detergents, stain removers, softeners..."
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search products"
          />
          <button className="searchBtn" type="button" aria-label="Search">
            <Search size={18} />
          </button>
        </div>

        <div className="headerRight">
          <button className="headerLink" type="button">
            <span className="headerLinkTop">Hello, sign in</span>
            <span className="headerLinkBottom">
              <User size={16} />
              Account
            </span>
          </button>
          <button className="headerLink" type="button">
            <span className="headerLinkTop">Easy</span>
            <span className="headerLinkBottom">Returns</span>
          </button>
          <button className="cartMini" type="button" onClick={onCartClick}>
            <span className="cartIconWrap">
              <ShoppingCart size={22} />
              {cartBadge ? <span className="cartCount">{cartBadge}</span> : null}
            </span>
            <span className="cartLabel">Cart</span>
          </button>
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

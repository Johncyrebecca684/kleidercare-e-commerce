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
  Heart,
  LayoutGrid,
  WashingMachine,
  Zap,
  Shirt,
  Wrench,
  FlaskConical,
  SlidersHorizontal,
  Sparkles,
  Layers,
  LogOut,
  Loader2,
  PhoneCall,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSearchResultsWithSimilar } from '../utils/searchEngine';
import { formatImageUrl } from '../utils/imageUtils';
import './Header.css';

const categories = [
  { label: 'All', href: '#products', icon: LayoutGrid },
  { label: 'Stacker', href: '#products', icon: Layers },
  { label: 'Packages', href: '#products', icon: Package },
  { label: 'LG Commercial Laundry Machines', href: '#products', icon: WashingMachine },
  { label: 'Speed Queen Commercial Laundry Machines', href: '#products', icon: Zap },
  { label: 'PONY Finishing Equipments', href: '#products', icon: Shirt },
  { label: 'Genuine Spare Parts', href: '#products', icon: Wrench },
  { label: 'Chemicals', href: '#products', icon: FlaskConical },
  { label: 'Seko', href: '#products', icon: SlidersHorizontal },
];

export default function Header({ 
  cartCount, 
  wishlistCount, 
  searchTerm, 
  onSearchChange, 
  onSigninClick, 
  loggedInUser, 
  onProfileClick, 
  onTrackOrderClick, 
  selectedCategory, 
  onCategoryChange,
  products = []
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('Detecting...');
  const [isLocating, setIsLocating] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const liveSearchResults = useMemo(() => {
    return getSearchResultsWithSimilar(products, searchTerm);
  }, [products, searchTerm]);

  const fetchLocation = async () => {
    setIsLocating(true);
    // Priority 1: User's saved address
    if (loggedInUser?.addresses?.length > 0) {
      const primary = loggedInUser.addresses[0];
      if (primary.city || primary.pincode) {
        setDeliveryLocation(`${primary.city || ''} ${primary.pincode || ''}`.trim());
        setIsLocating(false);
        return;
      }
    }

    const fallbackIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.city) {
            setDeliveryLocation(`${data.city} ${data.postal || ''}`.trim());
            setIsLocating(false);
            return;
          }
        }
      } catch (e) {
        console.warn('IP location fetch failed:', e);
      }
      setDeliveryLocation('Mumbai 400001');
      setIsLocating(false);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (res.ok) {
              const data = await res.json();
              const city = data.city || data.locality || data.principalSubdivision || 'Mumbai';
              const pincode = data.postcode || '';
              setDeliveryLocation(`${city} ${pincode}`.trim());
              setIsLocating(false);
              return;
            }
          } catch (e) {
            console.warn('Reverse geocode error:', e);
          }
          await fallbackIp();
        },
        async () => {
          await fallbackIp();
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      await fallbackIp();
    }
  };

  useEffect(() => {
    fetchLocation();
  }, [loggedInUser]);

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
          <div className="topBannerLeft">Welcome to Kleider Care - Laundry Ecommerce!</div>
          <div className="topBannerRight">
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

          <div 
            className="locationPinBadge desktopLocationBadge" 
            title="Click to refresh delivery location"
            onClick={fetchLocation}
          >
            {isLocating ? (
              <Loader2 size={14} className="locationPinIcon animate-spin" />
            ) : (
              <MapPin size={14} className="locationPinIcon" />
            )}
            <span className="locationPinText">Deliver to <strong>{deliveryLocation}</strong></span>
          </div>

          <div className="headerSearchInputContainer">
            <input
              className="headerSearchInput"
              type="search"
              placeholder="Search LG machines, Speed Queen, spare parts, and more..."
              value={searchTerm || ''}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  navigate(`/?q=${encodeURIComponent(searchTerm || '')}`);
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              aria-label="Search products"
            />
            {showSuggestions && searchTerm && searchTerm.trim().length > 0 && (
              <div className="searchSuggestionsDropdown">
                {liveSearchResults.exactMatches.length > 0 ? (
                  <>
                    <div className="suggestionSectionHeader">Matching Products</div>
                    {liveSearchResults.exactMatches.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="suggestionItem"
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        <img src={formatImageUrl(product.image)} alt={product.name} className="suggestionItemImg" />
                        <div className="suggestionItemInfo">
                          <div className="suggestionItemTitle">{product.name}</div>
                          <div className="suggestionItemMeta">
                            <span className="suggestionItemCategory">{product.category}</span>
                            <span className="suggestionItemPrice">₹{product.price?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {liveSearchResults.similarProducts.length > 0 && (
                      <>
                        <div className="suggestionSectionHeader suggestionSectionSimilar">Similar Products You May Like</div>
                        {liveSearchResults.similarProducts.slice(0, 3).map((product) => (
                          <div
                            key={product.id}
                            className="suggestionItem suggestionItemSimilar"
                            onClick={() => {
                              setShowSuggestions(false);
                              navigate(`/product/${product.id}`);
                            }}
                          >
                            <img src={formatImageUrl(product.image)} alt={product.name} className="suggestionItemImg" />
                            <div className="suggestionItemInfo">
                              <div className="suggestionItemTitle">{product.name}</div>
                              <div className="suggestionItemMeta">
                                <span className="suggestionItemBadge">Similar</span>
                                <span className="suggestionItemPrice">₹{product.price?.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="suggestionNoMatch">
                      No exact matches for &quot;{searchTerm}&quot;
                    </div>
                    {liveSearchResults.similarProducts.length > 0 && (
                      <>
                        <div className="suggestionSectionHeader suggestionSectionSimilar">
                          Similar Products You Might Like
                        </div>
                        {liveSearchResults.similarProducts.slice(0, 5).map((product) => (
                          <div
                            key={product.id}
                            className="suggestionItem suggestionItemSimilar"
                            onClick={() => {
                              setShowSuggestions(false);
                              navigate(`/product/${product.id}`);
                            }}
                          >
                            <img src={formatImageUrl(product.image)} alt={product.name} className="suggestionItemImg" />
                            <div className="suggestionItemInfo">
                              <div className="suggestionItemTitle">{product.name}</div>
                              <div className="suggestionItemMeta">
                                <span className="suggestionItemCategory">{product.category}</span>
                                <span className="suggestionItemPrice">₹{product.price?.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
                <div 
                  className="suggestionViewAllBtn"
                  onClick={() => {
                    setShowSuggestions(false);
                    navigate(`/?q=${encodeURIComponent(searchTerm || '')}`);
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View all results for &quot;{searchTerm}&quot; &rarr;
                </div>
              </div>
            )}
          </div>
          <button
            className="headerSearchBtn"
            type="button"
            aria-label="Search"
            onClick={() => {
              setShowSuggestions(false);
              navigate(`/?q=${encodeURIComponent(searchTerm || '')}`);
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Search size={20} />
          </button>
        </div>

        <div className="headerRight">
          {loggedInUser ? (
            <div className="userAccountDropdownWrap">
              <button className="userProfileBtn" type="button" onClick={() => navigate('/profile')} aria-label={`Profile for ${loggedInUser.firstName}`}>
                <span className="userInitials">
                  {loggedInUser.firstName?.charAt(0)}{(loggedInUser.lastName || '').charAt(0)}
                </span>
                <span className="userName">{loggedInUser.firstName}</span>
              </button>
            </div>
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

      <div 
        className="mobileDeliverToStrip" 
        onClick={fetchLocation}
        title="Click to refresh delivery location"
      >
        <MapPin size={14} className="mobileLocationPinIcon" />
        <span className="mobileLocationPinText">
          Deliver to <strong>{deliveryLocation}</strong>
        </span>
        {isLocating && <Loader2 size={12} className="animate-spin ml-1" />}
      </div>

      <div className={`siteHeaderBottom ${isMenuOpen ? 'open' : ''}`}>
        <nav className="categoryNav" aria-label="Category navigation">
          <div className="mobileNavSection categorySection">
            <span className="mobileNavSectionTitle">Categories</span>
            <div className="mobileCategoryLinks">
              {categories.map((c) => {
                const IconComponent = c.icon;
                return (
                  <a
                    key={c.label}
                    className={`categoryLink ${selectedCategory === c.label ? 'active' : ''}`}
                    href={c.href}
                    onClick={() => {
                      onCategoryChange(c.label);
                      setIsMenuOpen(false);
                    }}
                  >
                    {IconComponent && <IconComponent size={15} className="navCategoryIcon" />}
                    <span>{c.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mobileNavDivider"></div>

          <div className="mobileNavSection quickLinksSection">
            <span className="mobileNavSectionTitle">Quick Links</span>
            {loggedInUser?.role === 'admin' ? (
              <button
                className="mobileNavLink adminBtn"
                type="button"
                onClick={() => {
                  navigate('/admin');
                  setIsMenuOpen(false);
                }}
              >
                <LayoutDashboard size={18} />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  className="mobileNavLink"
                  type="button"
                  onClick={() => {
                    navigate('/track-order');
                    setIsMenuOpen(false);
                  }}
                >
                  <Package size={18} />
                  <span>Track Your Order</span>
                </button>
              </>
            )}
          </div>

          <div className="mobileNavDivider"></div>

          <div className="mobileNavSection accountSection">
            <span className="mobileNavSectionTitle">Account</span>
            {loggedInUser ? (
              <button
                className="mobileNavUserBtn"
                type="button"
                onClick={() => {
                  onProfileClick();
                  setIsMenuOpen(false);
                }}
              >
                <span className="userInitials">
                  {loggedInUser.firstName.charAt(0)}{loggedInUser.lastName.charAt(0)}
                </span>
                <span className="userNameText">{loggedInUser.firstName} {loggedInUser.lastName}</span>
              </button>
            ) : (
              <button
                className="mobileNavAuthBtn"
                type="button"
                onClick={() => {
                  onSigninClick();
                  setIsMenuOpen(false);
                }}
              >
                <User size={18} />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

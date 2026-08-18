import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Heart, ShoppingBag, MessageSquare, Shield } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav({ cartCount = 0, wishlistCount = 0, loggedInUser, onLoginOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleNav = (path, requiresAuth = false) => {
    if (requiresAuth && !loggedInUser) {
      if (onLoginOpen) {
        onLoginOpen();
      } else {
        navigate('/profile');
      }
      return;
    }
    navigate(path);
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <div className="bottom-nav-inner">
        {/* 1. Home */}
        <button
          type="button"
          className={`bottom-nav-item ${currentPath === '/' ? 'active' : ''}`}
          onClick={() => handleNav('/')}
          aria-label="Home"
        >
          <div className="nav-icon-wrapper">
            <Home size={22} strokeWidth={currentPath === '/' ? 2.3 : 1.8} />
          </div>
          <span className="bottom-nav-label">Home</span>
        </button>

        {/* 2. You / Account */}
        <button
          type="button"
          className={`bottom-nav-item ${currentPath === '/profile' ? 'active' : ''}`}
          onClick={() => handleNav('/profile', true)}
          aria-label="You / Profile"
        >
          <div className="nav-icon-wrapper">
            <User size={22} strokeWidth={currentPath === '/profile' ? 2.3 : 1.8} />
          </div>
          <span className="bottom-nav-label">You</span>
        </button>

        {/* 3. Wishlist (or Admin for admins) */}
        {loggedInUser?.role === 'admin' ? (
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === '/admin' ? 'active' : ''}`}
            onClick={() => handleNav('/admin')}
            aria-label="Admin Dashboard"
          >
            <div className="nav-icon-wrapper">
              <Shield size={22} strokeWidth={currentPath === '/admin' ? 2.3 : 1.8} />
            </div>
            <span className="bottom-nav-label">Admin</span>
          </button>
        ) : (
          <button
            type="button"
            className={`bottom-nav-item ${currentPath === '/wishlist' ? 'active' : ''}`}
            onClick={() => handleNav('/wishlist')}
            aria-label={`Wishlist, ${wishlistCount} items`}
          >
            <div className="nav-icon-wrapper">
              <Heart size={22} strokeWidth={currentPath === '/wishlist' ? 2.3 : 1.8} />
              {wishlistCount > 0 && (
                <span className="bottom-nav-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>
              )}
            </div>
            <span className="bottom-nav-label">Wishlist</span>
          </button>
        )}

        {/* 4. Cart */}
        <button
          type="button"
          className={`bottom-nav-item ${currentPath === '/cart' ? 'active' : ''}`}
          onClick={() => handleNav('/cart')}
          aria-label={`Cart, ${cartCount} items`}
        >
          <div className="nav-icon-wrapper">
            <ShoppingBag size={22} strokeWidth={currentPath === '/cart' ? 2.3 : 1.8} />
            {cartCount > 0 && (
              <span className="bottom-nav-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </div>
          <span className="bottom-nav-label">Cart</span>
        </button>

        {/* 5. Support / AI Assistant (Rufus style) */}
        <button
          type="button"
          className={`bottom-nav-item assistant-tab ${currentPath === '/chatbot' ? 'active' : ''}`}
          onClick={() => handleNav('/chatbot')}
          aria-label="Support Assistant"
        >
          <div className="nav-icon-wrapper assistant-icon-wrap">
            <div className="assistant-dot-glow"></div>
            <MessageSquare size={22} strokeWidth={currentPath === '/chatbot' ? 2.3 : 1.8} />
          </div>
          <span className="bottom-nav-label assistant-text">Support</span>
        </button>
      </div>
    </nav>
  );
}

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import Home from './pages/Home';
import BottomNav from './components/BottomNav';
import { getCurrentUser, logout as authLogout, updateCartWishlist } from './services/authService';
import { getAllProducts } from './services/productService';
import Loader from './components/Loader';
import './App.css';
import { API_URL } from './config';

// Lazy load secondary routes for instant first page render
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const TicketingPage = lazy(() => import('./pages/TicketingPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'));
const UserProfile = lazy(() => import('./components/UserProfile'));

const mergeCarts = (localCart, serverCart) => {
  const server = serverCart || [];
  if (server.length === 0) return localCart;
  if (localCart.length === 0) return server;

  const merged = [...server];
  localCart.forEach(localItem => {
    const existing = merged.find(i => i.id === localItem.id);
    if (existing) {
      existing.quantity = Math.max(existing.quantity, localItem.quantity);
    } else {
      merged.push(localItem);
    }
  });
  return merged;
};

const mergeWishlists = (localWish, serverWish) => {
  const server = serverWish || [];
  if (server.length === 0) return localWish;
  if (localWish.length === 0) return server;

  const merged = [...server];
  localWish.forEach(localItem => {
    if (!merged.find(i => i.id === localItem.id)) {
      merged.push(localItem);
    }
  });
  return merged;
};

function NavigateToCartAndLogin({ onLoginOpen }) {
  const navigate = useNavigate();
  useEffect(() => {
    onLoginOpen();
    navigate('/cart', { replace: true });
  }, [onLoginOpen, navigate]);
  return null;
}

function App() {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localCart = localStorage.getItem('kc_cart_items');
      return localCart ? JSON.parse(localCart) : [];
    } catch {
      return [];
    }
  });
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const localWishlist = localStorage.getItem('kc_wishlist_items');
      return localWishlist ? JSON.parse(localWishlist) : [];
    } catch {
      return [];
    }
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'All';
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || params.get('search') || '';
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Sync state changes with URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let updated = false;

    if (searchTerm) {
      if (params.get('q') !== searchTerm) {
        params.set('q', searchTerm);
        updated = true;
      }
    } else {
      if (params.has('q')) {
        params.delete('q');
        updated = true;
      }
    }

    if (selectedCategory && selectedCategory !== 'All') {
      if (params.get('category') !== selectedCategory) {
        params.set('category', selectedCategory);
        updated = true;
      }
    } else {
      if (params.has('category')) {
        params.delete('category');
        updated = true;
      }
    }

    if (updated) {
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchTerm, selectedCategory]);

  // App Data States - Loaded dynamically from MongoDB Database / API
  const [appProducts, setAppProducts] = useState(() => {
    try {
      const raw = localStorage.getItem('kc_app_products');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error parsing kc_app_products from localStorage:', e);
    }
    return [];
  });
  const [productsLoading, setProductsLoading] = useState(() => {
    try {
      const raw = localStorage.getItem('kc_app_products');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch {
      // ignore
    }
    return true;
  });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch products from database in background with local storage sync
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      let localSaved = null;
      try {
        const raw = localStorage.getItem('kc_app_products');
        if (raw) localSaved = JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing kc_app_products from localStorage:', e);
      }

      try {
        const data = await getAllProducts();
        if (!isMounted) return;
        if (Array.isArray(data)) {
          if (localSaved && Array.isArray(localSaved) && localSaved.length > 0) {
            const stockMap = {};
            localSaved.forEach(p => {
              const key = String(p.id || p._id || p.sku);
              if (p.stock !== undefined) {
                stockMap[key] = p.stock;
              }
            });
            const merged = data.map(p => {
              const key = String(p.id || p._id || p.sku);
              if (stockMap[key] !== undefined) {
                const s = stockMap[key];
                const t = p.lowStockThreshold || 10;
                let stockStatus = 'In Stock';
                if (s <= 0) stockStatus = 'Out of Stock';
                else if (s <= t) stockStatus = 'Low Stock';
                return { ...p, stock: s, stockStatus };
              }
              return p;
            });
            setAppProducts(merged);
          } else {
            setAppProducts(data);
          }
        }
      } catch (error) {
        console.warn('Error fetching products from database API:', error.message || error);
      } finally {
        if (isMounted) setProductsLoading(false);
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  const [appUsers, setAppUsers] = useState([]);
  const [userOrders, setUserOrders] = useState([
    {
      id: 'ORD-12345',
      date: new Date().toISOString(),
      status: 'delivered',
      total: 1250,
      items: [{ name: 'LG 8kg Front Load Washing Machine', price: 650, quantity: 1 }],
      userEmail: 'john@example.com',
      customerName: 'John Doe',
      paymentStatus: 'Paid',
      warranty: 'Active (2 Years)',
      setup: 'Completed (Standard)'
    },
    {
      id: 'ORD-67890',
      date: new Date().toISOString(),
      status: 'in-transit',
      total: 890,
      items: [{ name: 'Speed Queen TR7 Top Load', price: 890, quantity: 1 }],
      userEmail: 'alice@example.com',
      customerName: 'Alice Smith',
      paymentStatus: 'Paid',
      warranty: 'Active (1 Year)',
      setup: 'Pending Installation'
    }
  ]);

  const [installationAddon, setInstallationAddon] = useState({
    selected: false,
    title: 'Professional Commercial Equipment Installation & Setup',
    fee: 999
  });

  // Sync state changes with localStorage
  useEffect(() => {
    if (appProducts && appProducts.length > 0) {
      localStorage.setItem('kc_app_products', JSON.stringify(appProducts));
    }
  }, [appProducts]);

  useEffect(() => {
    localStorage.setItem('kc_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('kc_wishlist_items', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Sync cart/wishlist to MongoDB backend for logged-in users
  useEffect(() => {
    const syncCartAndWishlist = async () => {
      if (!loggedInUser) return;
      try {
        await updateCartWishlist({ cart: cartItems, wishlist: wishlistItems });
      } catch (error) {
        console.error('Error syncing cart/wishlist to server:', error);
      }
    };

    const timeoutId = setTimeout(syncCartAndWishlist, 500);
    return () => clearTimeout(timeoutId);
  }, [cartItems, wishlistItems, loggedInUser]);

  // Restore session from JWT token on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setLoggedInUser(user);
          setCartItems(prev => mergeCarts(prev, user.cart));
          setWishlistItems(prev => mergeWishlists(prev, user.wishlist));
        }
      } catch {
        // Token invalid or expired, stay logged out
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Fetch orders and users from database whenever the loggedInUser state changes
  useEffect(() => {
    const fetchOrdersAndUsers = async () => {
      if (!loggedInUser) {
        setUserOrders([]);
        setAppUsers([]);
        return;
      }

      const token = localStorage.getItem('kc_auth_token');

      // Fetch orders
      try {
        const endpoint = loggedInUser.role === 'admin' ? `${API_URL}/api/orders/admin-all` : `${API_URL}/api/orders/my-orders`;
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Format orders fetched from MongoDB to match frontend layout structure
          const formattedOrders = data.map(order => ({
            id: order.orderId || order._id,
            orderId: order.orderId || order._id,
            mongoId: order._id,
            paymentId: order.razorpayPaymentId,
            date: new Date(order.createdAt).toLocaleDateString(),
            rawDate: order.createdAt,
            items: order.items,
            total: order.totalAmount,
            status: order.status,
            userEmail: order.userEmail,
            customerName: order.customerName,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            phone: order.phone,
            shippingAddress: order.shippingAddress,
            companyName: order.companyName || '',
            gstNumber: order.gstNumber || '',
            warranty: 'Active (1 Year)',
            setup: 'Pending Installation'
          }));
          setUserOrders(formattedOrders);
        }
      } catch (error) {
        console.error('Error fetching database orders:', error);
      }

      // Fetch users (admin only)
      if (loggedInUser.role === 'admin') {
        try {
          const response = await fetch(`${API_URL}/api/auth/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setAppUsers(data);
          }
        } catch (error) {
          console.error('Error fetching database users:', error);
        }
      }
    };

    fetchOrdersAndUsers();
  }, [loggedInUser]);

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const warrantyType = product.selectedWarranty?.type || 'None';
      const itemKey = `${product.id}_${warrantyType}`;
      const effectivePrice = product.priceWithWarranty || product.price;

      const existingItem = prevItems.find(item =>
        (item.cartItemId || item.id) === itemKey ||
        (item.id === product.id && (item.selectedWarranty?.type || 'None') === warrantyType)
      );

      if (existingItem) {
        return prevItems.map(item =>
          ((item.cartItemId || item.id) === itemKey || (item.id === product.id && (item.selectedWarranty?.type || 'None') === warrantyType))
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, {
        ...product,
        cartItemId: itemKey,
        price: effectivePrice,
        basePrice: product.price,
        quantity: 1
      }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      handleRemoveItem(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          (item.cartItemId || item.id) === productId || item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const handleRemoveItem = (productId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => (item.cartItemId || item.id) !== productId && item.id !== productId)
    );
  };

  const handleAddAddon = (productId, addonType) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        const idMatches = (item.cartItemId || item.id) === productId || item.id === productId;
        if (idMatches) {
          const pName = (item.name || '').toLowerCase();
          const specs = JSON.stringify(item.specifications || {}).toLowerCase();
          const capacity = (item.specifications?.['Capacity'] || item.specifications?.['capacity'] || '').toLowerCase();

          const is15kg =
            pName.includes('15') ||
            pName.includes('titan') ||
            capacity.includes('15') ||
            specs.includes('15kg') ||
            specs.includes('15 kg') ||
            specs.includes('titan') ||
            specs.includes('cwt');

          const price = is15kg ? 18000 : 15000;

          if (addonType === 'amc' || addonType === 'non-comprehensive' || addonType === 'comprehensive') {
            const oldAmcCost = (item.selectedWarranty && item.selectedWarranty !== 'none' && item.amcWarrantyInfo?.price) ? item.amcWarrantyInfo.price : 0;
            const priceDiff = price - oldAmcCost;
            return {
              ...item,
              selectedWarranty: 'amc',
              amcWarrantyInfo: {
                type: 'Kleider Care AMC',
                price: price,
                gst: Math.round(price * 0.18),
                totalWithGst: Math.round(price * 1.18),
                visits: '3 Preventive Visits / year',
                response: '24–48 Hours Emergency Response'
              },
              price: item.price + priceDiff
            };
          } else if (addonType === 'setup') {
            if (!item.includeProgramSetup) {
              return {
                ...item,
                includeProgramSetup: true,
                price: item.price + 18000
              };
            }
          }
        }
        return item;
      })
    );
  };

  const handleRemoveAddon = (productId, addonType) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        const idMatches = (item.cartItemId || item.id) === productId || item.id === productId;
        if (idMatches) {
          if (addonType === 'warranty') {
            const amcCost = item.amcWarrantyInfo?.price || 0;
            return {
              ...item,
              selectedWarranty: 'none',
              amcWarrantyInfo: null,
              price: Math.max(item.basePrice || (item.price - amcCost), item.price - amcCost)
            };
          } else if (addonType === 'setup') {
            return {
              ...item,
              includeProgramSetup: false,
              price: Math.max(item.basePrice || (item.price - 18000), item.price - 18000)
            };
          }
        }
        return item;
      })
    );
  };

  const handleUpdateOrderSetup = (orderId, newSetupStatus, newFulfillmentStatus, newPaymentStatus) => {
    setUserOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId || order._id === orderId) {
          return {
            ...order,
            ...(newSetupStatus !== undefined && { setup: newSetupStatus }),
            ...(newFulfillmentStatus !== undefined && { status: newFulfillmentStatus }),
            ...(newPaymentStatus !== undefined && { paymentStatus: newPaymentStatus })
          };
        }
        return order;
      })
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleToggleWishlist = (product) => {
    setWishlistItems(prevItems => {
      const exists = prevItems.some(item => item.id === product.id);
      if (exists) {
        return prevItems.filter(item => item.id !== product.id);
      }
      return [...prevItems, product];
    });
  };

  const handleRemoveFromWishlist = (productId) => {
    setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    setIsLoginOpen(false);
    setCartItems(prev => mergeCarts(prev, user.cart));
    setWishlistItems(prev => mergeWishlists(prev, user.wishlist));
  };

  const handleSignupSuccess = (user) => {
    setLoggedInUser(user);
    setIsSignupOpen(false);
    setCartItems(prev => mergeCarts(prev, user.cart));
    setWishlistItems(prev => mergeWishlists(prev, user.wishlist));
  };

  const handleLogout = () => {
    authLogout();
    setLoggedInUser(null);
    setCartItems([]);
    setWishlistItems([]);
    localStorage.removeItem('kc_cart_items');
    localStorage.removeItem('kc_wishlist_items');
  };

  const handlePlaceOrder = (order) => {
    if (loggedInUser && order) {
      // Enhance order with admin details if missing
      const enhancedOrder = {
        ...order,
        customerName: `${loggedInUser.firstName} ${loggedInUser.lastName || ''}`.trim(),
        userEmail: loggedInUser.email,
        paymentStatus: 'Paid',
        warranty: 'Active (1 Year)',
        setup: 'Pending Installation'
      };
      setUserOrders(prev => [enhancedOrder, ...prev]);
    }
    handleClearCart();
  };

  return (
    <Router>
      <div className="app">
        <Suspense fallback={<Loader title="Kleider Care" subtitle="Loading page..." fullPage />}>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  cartItems={cartItems}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  cartCount={cartCount}
                  onAddToCart={handleAddToCart}
                  onRemoveItem={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                  isLoginOpen={isLoginOpen}
                  onLoginOpen={() => setIsLoginOpen(true)}
                  onLoginClose={() => setIsLoginOpen(false)}
                  isSignupOpen={isSignupOpen}
                  onSignupOpen={() => setIsSignupOpen(true)}
                  onSignupClose={() => setIsSignupOpen(false)}
                  isForgotPasswordOpen={isForgotPasswordOpen}
                  onForgotPasswordOpen={() => setIsForgotPasswordOpen(true)}
                  onForgotPasswordClose={() => setIsForgotPasswordOpen(false)}
                  loggedInUser={loggedInUser}
                  onLoginSuccess={handleLoginSuccess}
                  onSignupSuccess={handleSignupSuccess}
                  onLogout={handleLogout}
                  products={appProducts}
                  wishlistItems={wishlistItems}
                  onToggleWishlist={handleToggleWishlist}
                />
              }
            />
            <Route path="/track-order" element={<TrackOrderPage userOrders={userOrders} />} />
            <Route
              path="/product/:id"
              element={
                <ProductDetailPage
                  products={appProducts}
                  onAddToCart={handleAddToCart}
                  cartCount={cartCount}
                  wishlistItems={wishlistItems}
                  onToggleWishlist={handleToggleWishlist}
                  loggedInUser={loggedInUser}
                  onLoginOpen={() => setIsLoginOpen(true)}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              }
            />
            <Route
              path="/terms"
              element={
                <TermsPage
                  cartCount={cartCount}
                  wishlistCount={wishlistItems.length}
                  loggedInUser={loggedInUser}
                  onLoginOpen={() => setIsLoginOpen(true)}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              }
            />
            <Route
              path="/support"
              element={
                loggedInUser?.role === 'admin' ? (
                  <TicketingPage loggedInUser={loggedInUser} userOrders={userOrders} isAdmin={true} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/chatbot"
              element={
                <ChatbotPage
                  loggedInUser={loggedInUser}
                  userOrders={userOrders}
                  cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  wishlistCount={wishlistItems.length}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onSigninClick={() => setIsLoginOpen(true)}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminDashboard
                  products={appProducts}
                  setProducts={setAppProducts}
                  users={appUsers}
                  orders={userOrders}
                  onUpdateOrderSetup={handleUpdateOrderSetup}
                  loggedInUser={loggedInUser}
                />
              }
            />
            <Route
              path="/cart"
              element={
                <CartPage
                  items={cartItems}
                  allProducts={appProducts}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onAddAddon={handleAddAddon}
                  onRemoveAddon={handleRemoveAddon}
                  loggedInUser={loggedInUser}
                  onLoginOpen={() => setIsLoginOpen(true)}
                  installationAddon={installationAddon}
                  setInstallationAddon={setInstallationAddon}
                />
              }
            />
            <Route
              path="/checkout"
              element={
                authLoading ? (
                  <Loader title="Kleider Care" subtitle="Preparing Checkout..." fullPage />
                ) : loggedInUser ? (
                  <CheckoutPage
                    items={cartItems}
                    total={cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 500
                      ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + Math.round(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.18) + (installationAddon.selected ? installationAddon.fee : 0)
                      : cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 50 + Math.round(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.18) + (installationAddon.selected ? installationAddon.fee : 0)}
                    onPlaceOrder={handlePlaceOrder}
                    loggedInUser={loggedInUser}
                    installationAddon={installationAddon}
                  />
                ) : (
                  <NavigateToCartAndLogin onLoginOpen={() => setIsLoginOpen(true)} />
                )
              }
            />
            <Route
              path="/wishlist"
              element={
                <WishlistPage
                  wishlistItems={wishlistItems}
                  onRemoveFromWishlist={handleRemoveFromWishlist}
                  onAddToCart={handleAddToCart}
                  cartCount={cartCount}
                />
              }
            />
            <Route
              path="/profile"
              element={
                authLoading ? (
                  <Loader title="Kleider Care" subtitle="Authenticating..." fullPage />
                ) : loggedInUser ? (
                  <UserProfile
                    userData={loggedInUser}
                    onLogout={handleLogout}
                    orders={userOrders}
                    cartCount={cartCount}
                    wishlistCount={wishlistItems.length}
                    onUpdateUser={(updatedUser) => setLoggedInUser(updatedUser)}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onLoginOpen={() => setIsLoginOpen(true)}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </Suspense>

        <Login
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSwitchToSignup={() => setIsSignupOpen(true)}
          onSwitchToForgotPassword={() => setIsForgotPasswordOpen(true)}
          onLoginSuccess={handleLoginSuccess}
        />

        <Signup
          isOpen={isSignupOpen}
          onClose={() => setIsSignupOpen(false)}
          onSwitchToLogin={() => setIsLoginOpen(true)}
          onSignupSuccess={handleSignupSuccess}
        />

        <ForgotPassword
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSwitchToLogin={() => setIsLoginOpen(true)}
        />

        <BottomNav
          cartCount={cartCount}
          wishlistCount={wishlistItems.length}
          loggedInUser={loggedInUser}
          onLoginOpen={() => setIsLoginOpen(true)}
        />
      </div>
    </Router>
  );
}

export default App;

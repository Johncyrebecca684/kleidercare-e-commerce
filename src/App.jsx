import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import UserProfile from './components/UserProfile';
import Home from './pages/Home';
import TrackOrderPage from './pages/TrackOrderPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import TicketingPage from './pages/TicketingPage';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/WishlistPage';
import { products } from './data/products';
import { getCurrentUser, logout as authLogout, updateCartWishlist } from './services/authService';
import { getAllProducts } from './services/productService';
import './App.css';
import { API_URL } from './config';

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

  // App Data States
  const [appProducts, setAppProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setAppProducts(data);
      } catch (error) {
        console.error('Error fetching products from database:', error);
        // Fallback to static products list if API fails
        setAppProducts(products);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
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

  // Sync state changes with localStorage
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
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      handleRemoveItem(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const handleRemoveItem = (productId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => item.id !== productId)
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

  if (productsLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#f8fafc' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a4a8d', marginBottom: '10px' }}>Kleider Care</div>
        <div style={{ fontSize: '16px', color: '#64748b' }}>Loading Inventory...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
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
          <Route path="/support" element={<TicketingPage />} />
          <Route
            path="/admin"
            element={
              <AdminDashboard
                products={appProducts}
                setProducts={setAppProducts}
                users={appUsers}
                orders={userOrders}
                loggedInUser={loggedInUser}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                loggedInUser={loggedInUser}
                onLoginOpen={() => setIsLoginOpen(true)}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              authLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', color: '#1a4a8d' }}>Loading...</div>
              ) : loggedInUser ? (
                <CheckoutPage
                  items={cartItems}
                  total={cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 500
                    ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + Math.round(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.18)
                    : cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 50 + Math.round(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.18)}
                  onPlaceOrder={handlePlaceOrder}
                  loggedInUser={loggedInUser}
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
              />
            }
          />
          <Route
            path="/profile"
            element={
              authLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', color: '#1a4a8d' }}>Loading...</div>
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
      </div>
    </Router>
  );
}

export default App;

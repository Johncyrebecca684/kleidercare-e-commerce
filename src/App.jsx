import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { getCurrentUser, logout as authLogout } from './services/authService';
import './App.css';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
  const [appProducts, setAppProducts] = useState(products);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  // Restore session from JWT token on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setLoggedInUser(user);
        }
      } catch {
        // Token invalid or expired, stay logged out
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Fetch orders from database whenever the loggedInUser state changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (!loggedInUser) {
        setUserOrders([]);
        return;
      }

      try {
        const token = localStorage.getItem('kc_auth_token');
        const endpoint = loggedInUser.role === 'admin' ? '/api/orders/admin-all' : '/api/orders/my-orders';

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Format orders fetched from MongoDB to match frontend layout structure
          const formattedOrders = data.map(order => ({
            id: order._id,
            orderId: order._id,
            paymentId: order.razorpayPaymentId,
            date: new Date(order.createdAt).toLocaleDateString(),
            items: order.items,
            total: order.totalAmount,
            status: order.status,
            userEmail: order.userEmail,
            customerName: order.customerName,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            warranty: 'Active (1 Year)',
            setup: 'Pending Installation'
          }));
          setUserOrders(formattedOrders);
        }
      } catch (error) {
        console.error('Error fetching database orders:', error);
      }
    };

    fetchOrders();
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
  };

  const handleSignupSuccess = (user) => {
    setLoggedInUser(user);
    setIsSignupOpen(false);
  };

  const handleLogout = () => {
    authLogout();
    setLoggedInUser(null);
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
                isProfileOpen={isProfileOpen}
                onProfileOpen={() => setIsProfileOpen(true)}
                onProfileClose={() => setIsProfileOpen(false)}
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
                users={[]}
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
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                items={cartItems}
                total={cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 500
                  ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + Math.round(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.05)
                  : cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 50 + Math.round(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.05)}
                onPlaceOrder={handlePlaceOrder}
              />
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

        <UserProfile
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userData={loggedInUser}
          onLogout={handleLogout}
          orders={userOrders}
        />
      </div>
    </Router>
  );
}

export default App;

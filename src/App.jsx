import { useState } from 'react';
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
import { products } from './data/products';
import './App.css';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // App Data States
  const [appProducts, setAppProducts] = useState(products);
  const [registeredUsers, setRegisteredUsers] = useState([
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@kami.com',
      password: 'password123',
      role: 'admin',
      registeredAt: new Date().toISOString()
    },
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'customer',
      registeredAt: new Date().toISOString()
    }
  ]);
  const [loggedInUser, setLoggedInUser] = useState(null);
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

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    setIsLoginOpen(false);
  };

  const handleSignupSuccess = (user) => {
    setRegisteredUsers([...registeredUsers, user]);
    setLoggedInUser(user);
    setIsSignupOpen(false);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  const handlePlaceOrder = (order) => {
    if (loggedInUser && order) {
      // Enhance order with admin details if missing
      const enhancedOrder = {
        ...order,
        customerName: `${loggedInUser.firstName} ${loggedInUser.lastName}`,
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
                registeredUsers={registeredUsers}
                loggedInUser={loggedInUser}
                onLoginSuccess={handleLoginSuccess}
                onSignupSuccess={handleSignupSuccess}
                onLogout={handleLogout}
                products={appProducts}
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
                users={registeredUsers} 
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
        </Routes>


        <Login 
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSwitchToSignup={() => setIsSignupOpen(true)}
          onSwitchToForgotPassword={() => setIsForgotPasswordOpen(true)}
          registeredUsers={registeredUsers}
          onLoginSuccess={handleLoginSuccess}
        />

        <Signup 
          isOpen={isSignupOpen}
          onClose={() => setIsSignupOpen(false)}
          onSwitchToLogin={() => setIsLoginOpen(true)}
          onRegisterUser={(user) => setRegisteredUsers([...registeredUsers, user])}
          onSignupSuccess={handleSignupSuccess}
        />

        <ForgotPassword 
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSwitchToLogin={() => setIsLoginOpen(true)}
          registeredUsers={registeredUsers}
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

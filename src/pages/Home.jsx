import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductList from '../components/ProductList';
import Footer from '../components/Footer';

export default function Home({ 
  cartItems,
  selectedCategory, 
  onCategoryChange,
  searchTerm,
  onSearchChange,
  cartCount,
  onAddToCart,
  onRemoveItem,
  onUpdateQuantity,
  isLoginOpen,
  onLoginOpen,
  onLoginClose,
  isSignupOpen,
  onSignupOpen,
  onSignupClose,
  isForgotPasswordOpen,
  onForgotPasswordOpen,
  onForgotPasswordClose,
  isProfileOpen,
  onProfileOpen,
  onProfileClose,
  registeredUsers,
  loggedInUser,
  onLoginSuccess,
  onSignupSuccess,
  onLogout,
  products
}) {
  return (
    <>
      <Header 
        cartCount={cartCount}
        onSignupClick={onSignupOpen}
        onProfileClick={onProfileOpen}
        loggedInUser={loggedInUser}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />
      <Hero />
      <ProductList 
        products={products}
        onAddToCart={onAddToCart}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        searchTerm={searchTerm}
      />
      <Footer />
    </>
  );
}

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
  loggedInUser,
  onLoginSuccess,
  onSignupSuccess,
  onLogout,
  products,
  wishlistItems,
  onToggleWishlist
}) {
  return (
    <>
      <Header
        cartCount={cartCount}
        onSigninClick={onLoginOpen}
        onProfileClick={onProfileOpen}
        loggedInUser={loggedInUser}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        wishlistCount={wishlistItems.length}
      />
      <main role="main">
        <Hero />
        <ProductList
          products={products}
          onAddToCart={onAddToCart}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          searchTerm={searchTerm}
          wishlistItems={wishlistItems}
          onToggleWishlist={onToggleWishlist}
        />
      </main>
      <Footer />
    </>
  );
}

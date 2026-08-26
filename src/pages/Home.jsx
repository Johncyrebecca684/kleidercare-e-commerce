import Header from '../components/Header';
import TopServicePills from '../components/TopServicePills';
import Hero from '../components/Hero';
import MobileBannerCarousel from '../components/MobileBannerCarousel';
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
  productsLoading = false,
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
        products={products}
      />
      <main role="main">
        <TopServicePills onCategoryChange={onCategoryChange} selectedCategory={selectedCategory} />
        <Hero />
        <MobileBannerCarousel onCategoryChange={onCategoryChange} />
        <ProductList
          products={products}
          loading={productsLoading}
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

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Scale, ShieldCheck, HelpCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './TermsPage.css';

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'general', label: '1. General' },
  { id: 'eligibility', label: '2. Eligibility' },
  { id: 'products-services', label: '3. Products & Services' },
  { id: 'pricing', label: '4. Pricing' },
  { id: 'orders', label: '5. Orders' },
  { id: 'payments', label: '6. Payments' },
  { id: 'shipping-delivery', label: '7. Shipping & Delivery' },
  { id: 'warranty', label: '8. Warranty' },
  { id: 'intellectual-property', label: '9. Intellectual Property' },
  { id: 'third-party-brands', label: '10. Third-Party Brands' },
  { id: 'user-conduct', label: '11. User Conduct' },
  { id: 'limitation-of-liability', label: '12. Limitation of Liability' },
  { id: 'indemnification', label: '13. Indemnification' },
  { id: 'privacy', label: '14. Privacy' },
  { id: 'governing-law', label: '15. Governing Law' }
];

export default function TermsPage({
  cartCount,
  wishlistCount,
  loggedInUser,
  onLoginOpen,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange
}) {
  const [activeSection, setActiveSection] = useState('introduction');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }

      const scrollPosition = window.scrollY + 160; // Offset for header

      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 140; // Offset to account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="terms-page-wrapper">
      <div 
        className="terms-scroll-progress" 
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
      <Header
        cartCount={cartCount}
        onSigninClick={onLoginOpen}
        loggedInUser={loggedInUser}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        wishlistCount={wishlistCount}
      />

      <main className="terms-container animate-fade-in">
        {/* Banner Section */}
        <section className="terms-hero">
          <div className="terms-hero-decorations">
            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-icon icon-scale"><Scale size={44} /></div>
            <div className="floating-icon icon-shield"><ShieldCheck size={52} /></div>
            <div className="floating-icon icon-book"><BookOpen size={36} /></div>
          </div>
          <div className="terms-hero-content">
            <span className="terms-badge">Legal Policy</span>
            <h1 className="terms-title">Terms & Conditions</h1>
            <p className="terms-subtitle">
              Last updated: July 26, 2026. Please read these Terms & Conditions carefully before using our platform.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <div className="terms-content-layout">
          {/* Left: Sidebar Table of Contents */}
          <aside className="terms-sidebar">
            <div className="terms-sidebar-card">
              <h3>Table of Contents</h3>
              <nav className="terms-toc-nav">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    className={`terms-toc-link ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="terms-help-card">
              <HelpCircle className="help-icon" size={24} />
              <h4>Need Help?</h4>
              <p>If you have any questions regarding these Terms, contact our legal support team.</p>
              <a href="mailto:support@kleidercare.com" className="help-btn">
                Email Support
              </a>
            </div>
          </aside>

          {/* Right: Terms Text Content */}
          <article className="terms-text-content">
            <div className="terms-card">
              {/* Introduction */}
              <div id="introduction" className="terms-section-block">
                <h2>Welcome to Kleider Care</h2>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> This page sets the legal rules for using Kleider Care. By browsing or purchasing here, you agree to these terms.
                  </div>
                </div>
                <div className="section-content intro-text">
                  <p>
                    Welcome to <strong>Kleider Care – Laundry Ecommerce</strong> ("laundryecommerce.com"). These Terms & Conditions govern your access to and use of our website and the purchase of products available through our platform.
                  </p>
                  <p>
                    By accessing, browsing, or placing an order on this Website, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these Terms, please discontinue using the Website.
                  </p>
                </div>
              </div>

              {/* 1. General */}
              <div id="general" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">01</span>
                  <h2>General</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> We sell laundry machines, parts, and chemicals online. We can change these rules at any time.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    LaundryEcommerce.com is an online marketplace for commercial laundry equipment, spare parts, laundry chemicals, and related products.
                  </p>
                  <p>
                    We reserve the right to modify these Terms & Conditions at any time. Updated Terms will be effective immediately upon publication on this Website.
                  </p>
                </div>
              </div>

              {/* 2. Eligibility */}
              <div id="eligibility" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">02</span>
                  <h2>Eligibility</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> You must be at least 18 years old and provide accurate, truthful details to make a purchase.
                  </div>
                </div>
                <div className="section-content">
                  <p>By using this Website, you represent that:</p>
                  <ul className="terms-list">
                    <li>You are at least 18 years of age.</li>
                    <li>You are legally capable of entering into binding agreements.</li>
                    <li>All information provided by you is accurate, current, and complete.</li>
                  </ul>
                </div>
              </div>

              {/* 3. Products & Services */}
              <div id="products-services" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">03</span>
                  <h2>Products & Services</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> We strive for accuracy, but product descriptions, images, and availability may vary or change.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    We make every effort to ensure that product descriptions, specifications, pricing, images, and availability are accurate. However, errors may occasionally occur.
                  </p>
                  <p>
                    Product images are for illustrative purposes only. Actual products may differ slightly due to manufacturer updates or display settings.
                  </p>
                  <p>
                    We reserve the right to discontinue or modify any product without prior notice.
                  </p>
                </div>
              </div>

              {/* 4. Pricing */}
              <div id="pricing" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">04</span>
                  <h2>Pricing</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Prices are listed in INR and are subject to change. Extra fees (like tax, shipping, or installation) are added at checkout.
                  </div>
                </div>
                <div className="section-content">
                  <p>All prices displayed on the Website are in Indian Rupees (INR) unless otherwise stated.</p>
                  <p>Prices are subject to change without prior notice.</p>
                  <p>
                    Applicable taxes, shipping charges, installation charges, or other fees will be calculated during checkout where applicable.
                  </p>
                </div>
              </div>

              {/* 5. Orders */}
              <div id="orders" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">05</span>
                  <h2>Orders</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Placing an order is an offer to buy. We may refuse or cancel orders for stock issues, errors, or fraud checks.
                  </div>
                </div>
                <div className="section-content">
                  <p>Placing an order on our Website constitutes an offer to purchase.</p>
                  <p>An order is considered accepted only after confirmation from LaundryEcommerce.com.</p>
                  <p>We reserve the right to refuse, cancel, or limit any order for reasons including but not limited to:</p>
                  <ul className="terms-list">
                    <li>Product unavailability</li>
                    <li>Pricing errors</li>
                    <li>Payment issues</li>
                    <li>Suspected fraudulent activity</li>
                    <li>Violation of these Terms</li>
                  </ul>
                </div>
              </div>

              {/* 6. Payments */}
              <div id="payments" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">06</span>
                  <h2>Payments</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Payments must go through our secure payment gateway. We do not store your private card or bank login info.
                  </div>
                </div>
                <div className="section-content">
                  <p>Payments must be completed through the payment methods available on our Website.</p>
                  <p>
                    All payment transactions are processed through secure payment gateways. We do not store your complete debit card, credit card, or banking credentials.
                  </p>
                </div>
              </div>

              {/* 7. Shipping & Delivery */}
              <div id="shipping-delivery" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">07</span>
                  <h2>Shipping & Delivery</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Delivery dates are estimates. We are not responsible for delays caused by shipping providers or external forces.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    Delivery timelines are estimates only and may vary depending on product availability, location, logistics, and unforeseen circumstances.
                  </p>
                  <p>
                    LaundryEcommerce.com shall not be liable for delays caused by events beyond our reasonable control.
                  </p>
                </div>
              </div>

              {/* 8. Warranty */}
              <div id="warranty" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">08</span>
                  <h2>Warranty</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Manufacturer warranties apply to covered items. Issues arising from misuse or incorrect self-installation are excluded.
                  </div>
                </div>
                <div className="section-content">
                  <p>Products are covered by the warranty provided by the respective manufacturer, wherever applicable.</p>
                  <p>Warranty claims are subject to the manufacturer's terms and conditions.</p>
                  <p>
                    Damage resulting from misuse, improper installation, unauthorized repairs, accidents, or negligence is not covered under warranty.
                  </p>
                </div>
              </div>

              {/* 9. Intellectual Property */}
              <div id="intellectual-property" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">09</span>
                  <h2>Intellectual Property</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> All site copy, designs, logo, and product images are owned by us. Do not copy or reuse them without permission.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    All content available on this Website, including text, graphics, logos, icons, images, videos, software, and design elements, is the property of LaundryEcommerce.com or its licensors and is protected under applicable intellectual property laws.
                  </p>
                  <p>No content may be copied, reproduced, distributed, or used without prior written permission.</p>
                </div>
              </div>

              {/* 10. Third-Party Brands */}
              <div id="third-party-brands" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">10</span>
                  <h2>Third-Party Brands</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Third-party brand logos (like LG, Pony, and Speed Queen) belong to their owners and are used only to describe the products.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    The Website may display products manufactured by third-party brands including, but not limited to, LG, Speed Queen, Pony, SEKO, and other manufacturers.
                  </p>
                  <p>
                    All trademarks, logos, and brand names belong to their respective owners and are used solely for product identification purposes.
                  </p>
                </div>
              </div>

              {/* 11. User Conduct */}
              <div id="user-conduct" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">11</span>
                  <h2>User Conduct</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Please use the site honestly and legally. Do not attempt to upload malware, hack, or disrupt our operations.
                  </div>
                </div>
                <div className="section-content">
                  <p>You agree not to:</p>
                  <ul className="terms-list">
                    <li>Use the Website for any unlawful purpose.</li>
                    <li>Attempt unauthorized access to our systems.</li>
                    <li>Upload malicious software or harmful code.</li>
                    <li>Interfere with the operation or security of the Website.</li>
                    <li>Misrepresent your identity or submit false information.</li>
                  </ul>
                  <p>We reserve the right to suspend or terminate access for violations of these Terms.</p>
                </div>
              </div>

              {/* 12. Limitation of Liability */}
              <div id="limitation-of-liability" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">12</span>
                  <h2>Limitation of Liability</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> Our maximum legal liability is limited strictly to the amount you paid for the product in question. We are not liable for indirect damages.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    To the maximum extent permitted by applicable law, LaundryEcommerce.com shall not be liable for any indirect, incidental, consequential, or special damages arising from the use of this Website or the purchase of products through the Website.
                  </p>
                  <p>
                    Our total liability shall not exceed the amount paid by the customer for the product giving rise to the claim.
                  </p>
                </div>
              </div>

              {/* 13. Indemnification */}
              <div id="indemnification" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">13</span>
                  <h2>Indemnification</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> You agree to cover costs/losses if your breach of these terms or misuse of the platform leads to legal issues for us.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    You agree to indemnify and hold harmless LaundryEcommerce.com, its directors, employees, affiliates, partners, and service providers from any claims, liabilities, damages, losses, or expenses arising from your misuse of the Website or violation of these Terms.
                  </p>
                </div>
              </div>

              {/* 14. Privacy */}
              <div id="privacy" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">14</span>
                  <h2>Privacy</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> How we handle your personal information is described in detail in our separate Privacy Policy.
                  </div>
                </div>
                <div className="section-content">
                  <p>
                    Your use of the Website is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal information.
                  </p>
                </div>
              </div>

              {/* 15. Governing Law */}
              <div id="governing-law" className="terms-section-block">
                <div className="section-header">
                  <span className="section-number">15</span>
                  <h2>Governing Law</h2>
                </div>
                <div className="terms-summary-box">
                  <span className="summary-icon">💡</span>
                  <div className="summary-text">
                    <strong>Quick Summary:</strong> These terms follow Indian laws. Any legal disputes must be filed in courts located in Chennai, Tamil Nadu.
                  </div>
                </div>
                <div className="section-content">
                  <p>These Terms & Conditions shall be governed by and construed in accordance with the laws of India.</p>
                  <p>
                    Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

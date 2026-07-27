import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './TermsPage.css';

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
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <div className="terms-hero-content">
            <span className="terms-badge">Legal</span>
            <h1 className="terms-title">Terms of Service</h1>
            <p className="terms-subtitle">Effective Date: July 26, 2026</p>
          </div>
        </section>

        {/* Content Section */}
        <div className="terms-content-layout">
          <article className="terms-text-content">
            <div className="terms-card">
              {/* Introduction */}
              <div className="terms-section-block">
                <p className="terms-lead">
                  Welcome to <strong>Kleider Care – Laundry Ecommerce</strong> ("laundryecommerce.com"). These Terms & Conditions govern your access to and use of our website and the purchase of products available through our platform.
                </p>
                <p>
                  By accessing, browsing, or placing an order on this Website, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these Terms, please discontinue using the Website.
                </p>
              </div>

              {/* 1. General */}
              <div className="terms-section-block">
                <h2>1. General</h2>
                <p>
                  LaundryEcommerce.com is an online marketplace for commercial laundry equipment, spare parts, laundry chemicals, and related products.
                </p>
                <p>
                  We reserve the right to modify these Terms & Conditions at any time. Updated Terms will be effective immediately upon publication on this Website.
                </p>
              </div>

              {/* 2. Eligibility */}
              <div className="terms-section-block">
                <h2>2. Eligibility</h2>
                <p>By using this Website, you represent that:</p>
                <ul className="terms-list">
                  <li>You are at least 18 years of age.</li>
                  <li>You are legally capable of entering into binding agreements.</li>
                  <li>All information provided by you is accurate, current, and complete.</li>
                </ul>
              </div>

              {/* 3. Products & Services */}
              <div className="terms-section-block">
                <h2>3. Products & Services</h2>
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

              {/* 4. Pricing */}
              <div className="terms-section-block">
                <h2>4. Pricing</h2>
                <p>All prices displayed on the Website are in Indian Rupees (INR) unless otherwise stated.</p>
                <p>Prices are subject to change without prior notice.</p>
              </div>

              {/* 5. Orders */}
              <div className="terms-section-block">
                <h2>5. Orders</h2>
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

              {/* 6. Payments */}
              <div className="terms-section-block">
                <h2>6. Payments</h2>
                <p>Payments must be completed through the payment methods available on our Website.</p>
                <p>
                  All payment transactions are processed through secure payment gateways.
                </p>
              </div>

              {/* 7. Shipping & Delivery */}
              <div className="terms-section-block">
                <h2>7. Shipping & Delivery</h2>
                <p>
                  Delivery timelines are estimates only and may vary depending on product availability, location, logistics, and unforeseen circumstances.
                </p>
                <p>
                  LaundryEcommerce.com shall not be liable for delays caused by events beyond our reasonable control.
                </p>
              </div>

              {/* 8. Warranty */}
              <div className="terms-section-block">
                <h2>8. Warranty</h2>
                <p>Products are covered by the warranty provided by the respective manufacturer, wherever applicable.</p>
                <p>Warranty claims are subject to the manufacturer's terms and conditions.</p>
                <p>
                  Damage resulting from misuse, improper installation, unauthorized repairs, accidents, or negligence is not covered under warranty.
                </p>
              </div>

              {/* 9. Intellectual Property */}
              <div className="terms-section-block">
                <h2>9. Intellectual Property</h2>
                <p>
                  All content available on this Website, including text, graphics, logos, icons, images, videos, software, and design elements, is the property of LaundryEcommerce.com or its licensors and is protected under applicable intellectual property laws.
                </p>
                <p>No content may be copied, reproduced, distributed, or used without prior written permission.</p>
              </div>

              {/* 10. Third-Party Brands */}
              <div className="terms-section-block">
                <h2>10. Third-Party Brands</h2>
                <p>
                  The Website may display products manufactured by third-party brands including, but not limited to, LG, Speed Queen, Pony, SEKO, and other manufacturers.
                </p>
                <p>
                  All trademarks, logos, and brand names belong to their respective owners and are used solely for product identification purposes.
                </p>
              </div>

              {/* 11. User Conduct */}
              <div className="terms-section-block">
                <h2>11. User Conduct</h2>
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

              {/* 12. Limitation of Liability */}
              <div className="terms-section-block">
                <h2>12. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by applicable law, LaundryEcommerce.com shall not be liable for any indirect, incidental, consequential, or special damages arising from the use of this Website or the purchase of products through the Website.
                </p>
                <p>
                  Our total liability shall not exceed the amount paid by the customer for the product giving rise to the claim.
                </p>
              </div>

              {/* 13. Indemnification */}
              <div className="terms-section-block">
                <h2>13. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless LaundryEcommerce.com, its directors, employees, affiliates, partners, and service providers from any claims, liabilities, damages, losses, or expenses arising from your misuse of the Website or violation of these Terms.
                </p>
              </div>

              {/* 14. Privacy */}
              <div className="terms-section-block">
                <h2>14. Privacy</h2>
                <p>
                  Your use of the Website is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal information.
                </p>
              </div>

              {/* 15. Governing Law */}
              <div className="terms-section-block">
                <h2>15. Governing Law</h2>
                <p>These Terms & Conditions shall be governed by and construed in accordance with the laws of India.</p>
                <p>
                  Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu.
                </p>
              </div>
            </div>

            {/* Bottom Contact Section */}
            <div className="terms-contact-info">
              <p>
                Questions or concerns about these Terms? Please contact our legal team at{' '}
                <a href="mailto:support@kleidercare.com">support@kleidercare.com</a>.
              </p>
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                Business Hours: Monday–Friday | 10:00 AM – 6:00 PM (IST)
              </p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

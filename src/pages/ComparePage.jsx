import { useNavigate } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import {
  GitCompareArrows, ShoppingCart, Star, ArrowLeft,
  Trash2, CheckCircle, XCircle, TrendingUp, Award, Zap
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import AddToCartButton from '../components/AddToCartButton';
import './ComparePage.css';

/* ─────────── Client-side comparison engine ─────────── */
function generateComparison(items) {
  if (items.length < 2) return null;

  // 1. Collect all spec keys across products
  const allSpecKeys = new Set();
  items.forEach(p => {
    if (p.specifications) {
      Object.keys(p.specifications).forEach(k => allSpecKeys.add(k));
    }
  });

  // 2. Find shared specs (same key AND same value across ALL products)
  const shared = [];
  const differences = [];

  allSpecKeys.forEach(key => {
    const values = items.map(p => p.specifications?.[key] || '—');
    const uniqueValues = [...new Set(values.filter(v => v !== '—'))];

    if (uniqueValues.length === 1 && values.every(v => v !== '—')) {
      shared.push({ key, value: uniqueValues[0] });
    } else {
      differences.push({
        key,
        values: items.map(p => ({
          name: p.name,
          value: p.specifications?.[key] || '—'
        }))
      });
    }
  });

  // 3. Shared non-spec traits
  const sharedTraits = [];
  const categories = [...new Set(items.map(p => p.category))];
  if (categories.length === 1) {
    sharedTraits.push(`All products belong to the **${categories[0]}** category`);
  }
  const ratings = items.map(p => p.rating || 0);
  const allHighRated = ratings.every(r => r >= 4.5);
  if (allHighRated) {
    sharedTraits.push(`All are highly rated (${ratings.map(r => r.toFixed(1)).join(', ')} ★)`);
  }

  // 4. Price analysis
  const prices = items.map(p => ({ name: p.name, price: p.price }));
  prices.sort((a, b) => a.price - b.price);
  const cheapest = prices[0];
  const priciest = prices[prices.length - 1];
  const priceDiff = priciest.price - cheapest.price;

  // 5. Recommendation
  const bestRated = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  const bestValue = cheapest;
  const mostReviewed = [...items].sort((a, b) => (b.reviews || 0) - (a.reviews || 0))[0];

  return {
    shared,
    sharedTraits,
    differences,
    priceAnalysis: { cheapest, priciest, priceDiff, prices },
    recommendation: { bestRated, bestValue, mostReviewed }
  };
}

export default function ComparePage({ onAddToCart }) {
  const navigate = useNavigate();
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length < 2) {
    return (
      <div className="compare-page">
        <div className="compare-empty">
          <GitCompareArrows size={56} strokeWidth={1.5} />
          <h2>Not Enough Products to Compare</h2>
          <p>Please select at least 2 products from the catalog to start comparing.</p>
          <button className="compare-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Browse Products
          </button>
        </div>
      </div>
    );
  }

  const comparison = generateComparison(compareItems);

  // Union of all spec keys for the table
  const allSpecKeys = [];
  const seenKeys = new Set();
  compareItems.forEach(p => {
    if (p.specifications) {
      Object.keys(p.specifications).forEach(k => {
        if (!seenKeys.has(k)) {
          seenKeys.add(k);
          allSpecKeys.push(k);
        }
      });
    }
  });

  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div className="compare-page">
      {/* HEADER */}
      <div className="compare-page-header">
        <button className="compare-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Shop
        </button>
        <div className="compare-page-title-row">
          <GitCompareArrows size={28} />
          <h1>Product Comparison</h1>
        </div>
        <p className="compare-subtitle">
          Comparing {compareItems.length} products side-by-side
        </p>
      </div>

      {/* ═══════ SIDE-BY-SIDE TABLE ═══════ */}
      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            {/* Product Images Row */}
            <tr className="compare-row-images">
              <th className="compare-label-cell">Product</th>
              {compareItems.map(p => (
                <th key={p.id} className="compare-product-cell">
                  <div className="compare-product-card">
                    <button
                      className="compare-remove-btn"
                      onClick={() => removeFromCompare(p.id)}
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="compare-product-img-wrap">
                      <img src={formatImageUrl(p.image)} alt={p.name} />
                    </div>
                    <h3 className="compare-product-name">{p.name}</h3>
                    {p.badge && <span className="compare-badge">{p.badge}</span>}
                  </div>
                </th>
              ))}
            </tr>

            {/* Price Row */}
            <tr className="compare-row-price">
              <th className="compare-label-cell">Price</th>
              {compareItems.map(p => {
                const isCheapest = comparison?.priceAnalysis.cheapest.name === p.name;
                return (
                  <td key={p.id} className={`compare-val-cell ${isCheapest ? 'compare-highlight' : ''}`}>
                    <span className="compare-price">₹{p.price.toLocaleString('en-IN')}</span>
                    {isCheapest && <span className="compare-best-tag">Best Price</span>}
                  </td>
                );
              })}
            </tr>

            {/* Rating Row */}
            <tr>
              <th className="compare-label-cell">Rating</th>
              {compareItems.map(p => {
                const isBestRated = comparison?.recommendation.bestRated.id === p.id;
                return (
                  <td key={p.id} className={`compare-val-cell ${isBestRated ? 'compare-highlight' : ''}`}>
                    <span className="compare-rating">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      {p.rating || 'N/A'} ({(p.reviews || 0).toLocaleString()} reviews)
                    </span>
                    {isBestRated && <span className="compare-best-tag">Top Rated</span>}
                  </td>
                );
              })}
            </tr>

            {/* Category Row */}
            <tr>
              <th className="compare-label-cell">Category</th>
              {compareItems.map(p => (
                <td key={p.id} className="compare-val-cell">{p.category}</td>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Specification Rows */}
            {allSpecKeys.map(key => (
              <tr key={key}>
                <th className="compare-label-cell">{key}</th>
                {compareItems.map(p => {
                  const val = p.specifications?.[key];
                  return (
                    <td key={p.id} className={`compare-val-cell ${!val ? 'compare-missing' : ''}`}>
                      {val || '—'}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Add to Cart Row */}
            <tr className="compare-row-actions">
              <th className="compare-label-cell"></th>
              {compareItems.map(p => {
                const isOutOfStock = (p.stock !== undefined && Number(p.stock) <= 0) || p.stockStatus === 'Out of Stock';
                return (
                  <td key={p.id} className="compare-val-cell">
                    <AddToCartButton
                      className="compare-add-cart-btn-animated"
                      onClick={() => !isOutOfStock && handleAddToCart(p)}
                      isOutOfStock={isOutOfStock}
                      defaultText="Add to Cart"
                      addedText="Added!"
                      size="sm"
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════ AI COMPARISON SUMMARY ═══════ */}
      {comparison && (
        <div className="compare-summary-card">
          <div className="compare-summary-header">
            <Zap size={22} />
            <h2>Smart Comparison Summary</h2>
          </div>

          {/* Shared Features */}
          {(comparison.sharedTraits.length > 0 || comparison.shared.length > 0) && (
            <div className="compare-section">
              <h3 className="compare-section-title">
                <CheckCircle size={18} className="icon-green" /> What They Share
              </h3>
              <ul className="compare-summary-list">
                {comparison.sharedTraits.map((t, i) => (
                  <li key={`trait-${i}`} dangerouslySetInnerHTML={{
                    __html: t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                ))}
                {comparison.shared.map((s, i) => (
                  <li key={`spec-${i}`}>
                    <strong>{s.key}:</strong> {s.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Differences */}
          {comparison.differences.length > 0 && (
            <div className="compare-section">
              <h3 className="compare-section-title">
                <XCircle size={18} className="icon-amber" /> Key Differences
              </h3>
              <ul className="compare-summary-list compare-diff-list">
                {comparison.differences.map((d, i) => (
                  <li key={i}>
                    <strong>{d.key}:</strong>{' '}
                    {d.values.map((v, j) => (
                      <span key={j}>
                        <em>{v.name}</em> → {v.value}
                        {j < d.values.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price & Value */}
          <div className="compare-section">
            <h3 className="compare-section-title">
              <TrendingUp size={18} className="icon-blue" /> Price & Value
            </h3>
            <div className="compare-price-summary">
              <p>
                <strong>{comparison.priceAnalysis.cheapest.name}</strong> is the most affordable at{' '}
                <strong>₹{comparison.priceAnalysis.cheapest.price.toLocaleString('en-IN')}</strong>
                {comparison.priceAnalysis.priceDiff > 0 && (
                  <>, saving you <strong>₹{comparison.priceAnalysis.priceDiff.toLocaleString('en-IN')}</strong> compared to the priciest option.</>
                )}
              </p>
              <div className="compare-price-bars">
                {comparison.priceAnalysis.prices.map((p, i) => {
                  const maxPrice = comparison.priceAnalysis.priciest.price;
                  const widthPct = maxPrice > 0 ? (p.price / maxPrice) * 100 : 100;
                  return (
                    <div key={i} className="compare-price-bar-row">
                      <span className="compare-price-bar-label">{p.name}</span>
                      <div className="compare-price-bar-track">
                        <div
                          className="compare-price-bar-fill"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="compare-price-bar-val">₹{p.price.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="compare-section compare-verdict">
            <h3 className="compare-section-title">
              <Award size={18} className="icon-purple" /> Our Verdict
            </h3>
            <div className="compare-verdict-body">
              <p>
                If you prioritize <strong>value for money</strong>, go with{' '}
                <strong>{comparison.recommendation.bestValue.name}</strong> at ₹{comparison.recommendation.bestValue.price.toLocaleString('en-IN')}.
              </p>
              {comparison.recommendation.bestRated.id !== comparison.recommendation.bestValue.name && (
                <p>
                  If you want the <strong>highest-rated</strong> option, choose{' '}
                  <strong>{comparison.recommendation.bestRated.name}</strong> ({comparison.recommendation.bestRated.rating}★
                  with {(comparison.recommendation.bestRated.reviews || 0).toLocaleString()} reviews).
                </p>
              )}
              {comparison.recommendation.mostReviewed.id !== comparison.recommendation.bestRated.id && (
                <p>
                  For the <strong>most trusted</strong> choice based on community feedback,{' '}
                  <strong>{comparison.recommendation.mostReviewed.name}</strong> leads with{' '}
                  {(comparison.recommendation.mostReviewed.reviews || 0).toLocaleString()} reviews.
                </p>
              )}
            </div>
          </div>

          <div className="compare-summary-cta">
            Would you like to add any of these to your cart, or go back and compare different products?
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="compare-bottom-actions">
        <button className="compare-clear-all" onClick={() => { clearCompare(); navigate('/'); }}>
          <Trash2 size={15} /> Clear & Browse More
        </button>
      </div>
    </div>
  );
}

/**
 * Centralized Recommendation Engine for KleiderCare E-Commerce
 * 
 * Produces scored, reasoned product recommendations for 3 UI surfaces:
 *   - for_you_homepage
 *   - cart_upsell
 *   - frequently_bought_together
 */

// ── Complementary category mapping ──
const COMPLEMENTARY_MAP = {
  'LG Commercial Laundry Machines': ['Genuine Spare Parts', 'Chemicals', 'Seko'],
  'Speed Queen Commercial Laundry Machines': ['Genuine Spare Parts', 'Chemicals', 'Seko'],
  'PONY Finishing Equipments': ['Chemicals', 'Genuine Spare Parts'],
  'Genuine Spare Parts': ['Chemicals', 'Seko'],
  'Chemicals': ['Genuine Spare Parts', 'Seko'],
  'Seko': ['Chemicals', 'Genuine Spare Parts']
};

function getComplementaryCategories(category) {
  return COMPLEMENTARY_MAP[category] || [];
}

// ── Reason generators ──
function reasonForYou(product, signals) {
  if (signals.wishlistMatch) return `Matches items in your wishlist`;
  if (signals.searchMatch) return `Based on your recent search for "${signals.searchMatch}"`;
  if (signals.browsingMatch) return `Similar to products you recently viewed`;
  if (product.badge === 'Best Seller') return `Top seller in ${product.category}`;
  if (product.rating >= 4.8) return `Highly rated at ${product.rating}★ by customers`;
  return `Popular in ${product.category}`;
}

function reasonCartUpsell(product, signals) {
  if (signals.complementaryTo) return `Pairs perfectly with your ${signals.complementaryTo}`;
  if (signals.sameCategoryAsCart) return `Enhance your ${signals.sameCategoryAsCart} setup`;
  if (product.price < 2000) return `Affordable add-on to protect your equipment`;
  return `Recommended accessory for your cart items`;
}

function reasonFBT(product, signals) {
  if (signals.complementaryTo) return `Essential companion for your ${signals.complementaryTo}`;
  if (signals.isAccessory) return `Maintenance accessory for peak performance`;
  if (product.category === 'Chemicals') return `Cleaning solution to extend machine life`;
  if (product.category === 'Seko') return `Dosing system for optimal detergent usage`;
  return `Frequently purchased together by customers`;
}

// ── Main engine ──
export function getRecommendations({
  type = 'for_you_homepage',
  products = [],
  cartItems = [],
  wishlistItems = [],
  searchHistory = [],
  browsingHistory = [],
  currentProduct = null,
  limit = 6
}) {
  // Build exclusion set (don't recommend items already in cart or the current product)
  const excludeIds = new Set(cartItems.map(i => i.id));
  if (currentProduct) excludeIds.add(currentProduct.id);

  // Cart category analysis
  const cartCategories = [...new Set(cartItems.map(i => i.category).filter(Boolean))];
  const cartNames = cartItems.map(i => i.name).filter(Boolean);
  const cartAvgPrice = cartItems.length > 0
    ? cartItems.reduce((s, i) => s + i.price, 0) / cartItems.length
    : 0;

  // Browsing analysis
  const browsedCategories = [...new Set(browsingHistory.map(b => b.category || b).filter(Boolean))];
  const browsedIds = new Set(browsingHistory.map(b => b.id || b).filter(Boolean));

  // Wishlist analysis
  const wishlistCategories = [...new Set(wishlistItems.map(i => i.category).filter(Boolean))];

  const candidates = products
    .filter(p => !excludeIds.has(p.id))
    .map(product => {
      let score = 0;
      const signals = {};

      if (type === 'for_you_homepage') {
        // Wishlist category match
        if (wishlistCategories.includes(product.category) ||
            wishlistItems.some(w => w.id === product.id)) {
          score += 15;
          signals.wishlistMatch = true;
        }

        // Search history match
        for (const query of searchHistory) {
          const q = query.toLowerCase();
          if (product.name.toLowerCase().includes(q) ||
              product.category.toLowerCase().includes(q)) {
            score += 10;
            signals.searchMatch = query;
            break;
          }
        }

        // Browsing history match
        if (browsedCategories.includes(product.category) || browsedIds.has(product.id)) {
          score += 8;
          signals.browsingMatch = true;
        }

        // High rating bonus
        if ((product.rating || 0) >= 4.7) score += 5;

        // Badge bonus
        if (product.badge) score += 3;

        // Base popularity (reviews)
        score += Math.min((product.reviews || 0) / 20, 5);

      } else if (type === 'cart_upsell') {
        // Complementary to cart categories
        for (const cartCat of cartCategories) {
          const complementary = getComplementaryCategories(cartCat);
          if (complementary.includes(product.category)) {
            score += 15;
            // Find a short cart item name for the reason
            const cartItem = cartItems.find(i => i.category === cartCat);
            signals.complementaryTo = cartItem
              ? (cartItem.name.length > 25 ? cartItem.name.substring(0, 22) + '...' : cartItem.name)
              : cartCat;
            break;
          }
        }

        // Same category as cart (lower priority — upsell, not duplicate)
        if (!signals.complementaryTo && cartCategories.includes(product.category)) {
          score += 5;
          signals.sameCategoryAsCart = product.category;
        }

        // Accessory-priced items preferred
        if (product.price < cartAvgPrice * 0.3 && product.price < 5000) {
          score += 10;
        } else if (product.price < 5000) {
          score += 6;
        }

        // Rating & badge
        if ((product.rating || 0) >= 4.7) score += 3;
        if (product.badge) score += 2;

      } else if (type === 'frequently_bought_together') {
        if (!currentProduct) return null;

        const currentCategory = currentProduct.category;
        const complementary = getComplementaryCategories(currentCategory);

        // Complementary category
        if (complementary.includes(product.category)) {
          score += 15;
          signals.complementaryTo = currentProduct.name.length > 25
            ? currentProduct.name.substring(0, 22) + '...'
            : currentProduct.name;
        }

        // Same category but different product (variant)
        if (product.category === currentCategory) {
          score += 4;
        }

        // Accessory-priced
        if (product.price < currentProduct.price * 0.2) {
          score += 8;
          signals.isAccessory = true;
        } else if (product.price < currentProduct.price * 0.5) {
          score += 4;
          signals.isAccessory = true;
        }

        // Rating & badge
        if ((product.rating || 0) >= 4.7) score += 3;
        if (product.badge) score += 2;
      }

      // Generate reason string
      let reason = '';
      if (type === 'for_you_homepage') reason = reasonForYou(product, signals);
      else if (type === 'cart_upsell') reason = reasonCartUpsell(product, signals);
      else if (type === 'frequently_bought_together') reason = reasonFBT(product, signals);

      return { product, reason, score };
    })
    .filter(Boolean)
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // If we don't have enough results, pad with popular fallbacks
  if (candidates.length < limit) {
    const existingIds = new Set(candidates.map(c => c.product.id));
    const fallbacks = products
      .filter(p => !excludeIds.has(p.id) && !existingIds.has(p.id))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit - candidates.length)
      .map(product => ({
        product,
        reason: `Popular in ${product.category}`,
        score: 0
      }));
    candidates.push(...fallbacks);
  }

  return candidates;
}

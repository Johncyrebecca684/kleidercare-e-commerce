/**
 * Centralized Recommendation Engine for KleiderCare E-Commerce
 * 
 * Rules:
 *   - Chemical viewed/added -> Recommend Dosing Pump (Seko)
 *   - Dosing Pump viewed/added -> Recommend Chemical
 *   - Washer viewed/added -> Recommend Dryer
 *   - Dryer viewed/added -> Recommend Washer
 */

// ── Helper: Product Type Classifier ──
export function getProductType(product) {
  if (!product) return null;
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const specString = JSON.stringify(product.specifications || {}).toLowerCase();
  const funcType = (product.specifications?.['Function Type'] || '').toLowerCase();

  // 1. Dosing Pump (Seko)
  if (
    category === 'seko' ||
    category.includes('seko') ||
    name.includes('dosing pump') ||
    name.includes('seko') ||
    desc.includes('dosing pump')
  ) {
    return 'dosing_pump';
  }

  // Machine Package Check
  const machinePackageNames = [
    'wet pro electric 15kg package',
    'titan electric 15kg package',
    'titan gas 15kg package',
    'giant electric 10kg package',
    'giant gas 15kg package'
  ];
  const isMachinePackage = machinePackageNames.some(pkg => name.includes(pkg));
  if (isMachinePackage) {
    return 'washer';
  }

  // 2. Chemical
  if (
    !isMachinePackage &&
    (category === 'chemicals' ||
    (category.includes('chemical') && !category.includes('package')) ||
    (name.includes('chemical') && !name.includes('package')) ||
    name.startsWith('kc ') ||
    name.includes('deodorizer') ||
    name.includes('stain'))
  ) {
    return 'chemical';
  }

  // 3. Washer
  if (
    (name.includes('washer') || category.includes('washer') || funcType.includes('washer') || specString.includes('washer')) &&
    !category.includes('spare part')
  ) {
    return 'washer';
  }

  // 4. Dryer
  if (
    (name.includes('dryer') || category.includes('dryer') || funcType.includes('dryer') || specString.includes('dryer')) &&
    !category.includes('spare part')
  ) {
    return 'dryer';
  }

  return 'other';
}

// ── Helper: Map Source Product Type to Target Recommended Type ──
export function getRecommendedTargetType(sourceType) {
  switch (sourceType) {
    case 'chemical':
      return 'dosing_pump';
    case 'dosing_pump':
      return 'chemical';
    case 'washer':
      return 'dryer';
    case 'dryer':
      return 'washer';
    default:
      return null;
  }
}

// ── Helper: Dynamic Reason Generator ──
export function getRecommendationReason(sourceType, targetProduct) {
  const targetType = getProductType(targetProduct);

  if (sourceType === 'chemical' || targetType === 'dosing_pump') {
    return `Recommended Seko Dosing Pump for automatic chemical dispensing`;
  }
  if (sourceType === 'dosing_pump' || targetType === 'chemical') {
    return `Recommended Wet Cleaning Chemical for optimal dosing pump performance`;
  }
  if (sourceType === 'washer' || (sourceType !== 'dryer' && targetType === 'dryer')) {
    return `Recommended Dryer to complete your commercial washer setup`;
  }
  if (sourceType === 'dryer' || (sourceType !== 'washer' && targetType === 'washer')) {
    return `Recommended High-Performance Washer to pair with your dryer`;
  }
  return `Frequently recommended equipment companion`;
}

// ── Complementary category mapping ──
const COMPLEMENTARY_MAP = {
  'LG Commercial Laundry Machines': ['Genuine Spare Parts', 'Chemicals', 'Seko'],
  'Speed Queen Commercial Laundry Machines': ['Genuine Spare Parts', 'Chemicals', 'Seko'],
  'PONY Finishing Equipments': ['Chemicals', 'Genuine Spare Parts'],
  'Genuine Spare Parts': ['Chemicals', 'Seko'],
  'Chemicals': ['Seko', 'Genuine Spare Parts', 'Packages'],
  'Packages': ['Chemicals', 'Seko', 'Genuine Spare Parts'],
  'Seko': ['Chemicals', 'Genuine Spare Parts']
};

function getComplementaryCategories(category) {
  return COMPLEMENTARY_MAP[category] || [];
}

// ── Reason generators for fallbacks ──
function reasonForYou(product, signals) {
  if (signals.explicitReason) return signals.explicitReason;
  if (signals.wishlistMatch) return `Matches items in your wishlist`;
  if (signals.searchMatch) return `Based on your recent search for "${signals.searchMatch}"`;
  if (signals.browsingMatch) return `Similar to products you recently viewed`;
  if (product.badge === 'Best Seller') return `Top seller in ${product.category}`;
  if (product.rating >= 4.8) return `Highly rated at ${product.rating}★ by customers`;
  return `Popular in ${product.category}`;
}

function reasonCartUpsell(product, signals) {
  if (signals.explicitReason) return signals.explicitReason;
  if (signals.complementaryTo) return `Pairs perfectly with your ${signals.complementaryTo}`;
  if (signals.sameCategoryAsCart) return `Enhance your ${signals.sameCategoryAsCart} setup`;
  if (product.price < 2000) return `Affordable add-on to protect your equipment`;
  return `Recommended accessory for your cart items`;
}

function reasonFBT(product, signals) {
  if (signals.explicitReason) return signals.explicitReason;
  if (signals.complementaryTo) return `Essential companion for your ${signals.complementaryTo}`;
  if (signals.isAccessory) return `Maintenance accessory for peak performance`;
  if (product.category === 'Chemicals') return `Cleaning solution to extend machine life`;
  if (product.category === 'Seko') return `Dosing system for optimal detergent usage`;
  return `Frequently purchased together by customers`;
}

// ── Main Engine ──
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

  // Analyze active source product or cart items to determine mandatory target recommendation type
  let primarySourceType = null;
  if (currentProduct) {
    primarySourceType = getProductType(currentProduct);
  } else if (cartItems.length > 0) {
    // Pick most recently added or primary cart item
    primarySourceType = getProductType(cartItems[cartItems.length - 1]);
  } else if (browsingHistory.length > 0) {
    const lastBrowsed = browsingHistory[browsingHistory.length - 1];
    primarySourceType = getProductType(lastBrowsed);
  }

  const primaryTargetType = getRecommendedTargetType(primarySourceType);

  // Cart category analysis
  const cartCategories = [...new Set(cartItems.map(i => i.category).filter(Boolean))];
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
      const candidateType = getProductType(product);

      // Check strict rule match: Chemical <-> Dosing Pump, Washer <-> Dryer
      if (primaryTargetType && candidateType === primaryTargetType) {
        score += 250; // Highest priority bonus
        signals.explicitRuleMatch = true;
        signals.explicitReason = getRecommendationReason(primarySourceType, product);
      }

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
        if (product.badge) score += 3;
        score += Math.min((product.reviews || 0) / 20, 5);

      } else if (type === 'cart_upsell') {
        // Check matching target types from all items in cart
        for (const cItem of cartItems) {
          const cType = getProductType(cItem);
          const tType = getRecommendedTargetType(cType);
          if (tType && candidateType === tType) {
            score += 100;
            signals.explicitRuleMatch = true;
            signals.explicitReason = getRecommendationReason(cType, product);
            break;
          }
        }

        // Complementary to cart categories
        if (!signals.explicitRuleMatch) {
          for (const cartCat of cartCategories) {
            const complementary = getComplementaryCategories(cartCat);
            if (complementary.includes(product.category)) {
              score += 15;
              const cartItem = cartItems.find(i => i.category === cartCat);
              signals.complementaryTo = cartItem
                ? (cartItem.name.length > 25 ? cartItem.name.substring(0, 22) + '...' : cartItem.name)
                : cartCat;
              break;
            }
          }
        }

        // Same category as cart (lower priority — upsell, not duplicate)
        if (!signals.explicitRuleMatch && !signals.complementaryTo && cartCategories.includes(product.category)) {
          score += 5;
          signals.sameCategoryAsCart = product.category;
        }

        if (product.price < cartAvgPrice * 0.3 && product.price < 5000) {
          score += 10;
        } else if (product.price < 5000) {
          score += 6;
        }

        if ((product.rating || 0) >= 4.7) score += 3;
        if (product.badge) score += 2;

      } else if (type === 'frequently_bought_together') {
        if (!currentProduct) return null;

        const currentCategory = currentProduct.category;
        const complementary = getComplementaryCategories(currentCategory);

        if (!signals.explicitRuleMatch && complementary.includes(product.category)) {
          score += 15;
          signals.complementaryTo = currentProduct.name.length > 25
            ? currentProduct.name.substring(0, 22) + '...'
            : currentProduct.name;
        }

        if (product.category === currentCategory) {
          score += 4;
        }

        if (product.price < currentProduct.price * 0.2) {
          score += 8;
          signals.isAccessory = true;
        } else if (product.price < currentProduct.price * 0.5) {
          score += 4;
          signals.isAccessory = true;
        }

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


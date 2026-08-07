export function extractSearchTokens(query) {
  if (!query || typeof query !== 'string') return [];
  // Clean special chars, normalize, split into words
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1); // skip single letters
}

// Synonym map for common laundry and e-commerce terms
const SEARCH_SYNONYMS = {
  'washer': ['washing', 'machine', 'cleaner', 'laundry'],
  'washing': ['washer', 'machine', 'laundry'],
  'dryer': ['drying', 'tumble', 'dry'],
  'dry': ['dryer', 'drying'],
  'part': ['spare', 'component', 'accessory', 'replacement'],
  'parts': ['spares', 'components', 'accessories', 'replacements'],
  'spare': ['part', 'component', 'replacement'],
  'spares': ['parts', 'components', 'replacements'],
  'detergent': ['chemical', 'chemicals', 'soap', 'liquid', 'powder', 'wcd'],
  'chemical': ['detergent', 'chemicals', 'soap', 'liquid', 'powder'],
  'chemicals': ['detergent', 'chemical', 'soap', 'liquid', 'powder'],
  'package': ['pack', 'bundle', 'kit', 'set', 'combo'],
  'kit': ['package', 'bundle', 'set', 'spotting'],
  'wet': ['wetcleaning', 'clean', 'cleaning'],
  'spotting': ['stain', 'kit', 'remover'],
  'dosing': ['seko', 'pump', 'injector', 'dispenser'],
  'iron': ['ironing', 'finishing', 'press', 'steamer', 'pony'],
  'finishing': ['ironing', 'press', 'steamer', 'pony'],
  'pump': ['dosing', 'seko', 'injector', 'dispenser', 'motor'],
  'valve': ['solenoid', 'spare', 'part', 'drain'],
  'lg': ['titan', 'giant'],
  'speed queen': ['speedqueen', 'quantum'],
};

/**
 * Score a product for search query relevance (0-100+)
 */
export function scoreProductSearchRelevance(product, query) {
  if (!query || !query.trim()) return 100;

  const qRaw = query.trim().toLowerCase();
  const tokens = extractSearchTokens(qRaw);
  if (tokens.length === 0) return 100;

  const pName = (product.name || '').toLowerCase();
  const pDesc = (product.description || '').toLowerCase();
  const pCat = (product.category || '').toLowerCase();
  const pBrand = (product.specifications?.Brand || '').toLowerCase();
  const pModel = (product.specifications?.['Model Name/Number'] || '').toLowerCase();

  const fullProductText = `${pName} ${pCat} ${pBrand} ${pModel} ${pDesc}`;

  // Direct exact query match in name (highest priority)
  if (pName === qRaw) return 1000;
  if (pName.startsWith(qRaw)) return 500;
  if (pName.includes(qRaw)) return 300;
  if (pCat.includes(qRaw) || pBrand.includes(qRaw)) return 250;
  if (fullProductText.includes(qRaw)) return 200;

  // Token matching & synonyms
  let matchedTokensCount = 0;
  let score = 0;

  tokens.forEach(token => {
    let tokenMatched = false;

    // Direct token substring match
    if (pName.includes(token)) {
      score += 40;
      tokenMatched = true;
    } else if (pCat.includes(token) || pBrand.includes(token) || pModel.includes(token)) {
      score += 30;
      tokenMatched = true;
    } else if (pDesc.includes(token)) {
      score += 15;
      tokenMatched = true;
    }

    // Synonym check if direct match failed
    if (!tokenMatched) {
      const syns = SEARCH_SYNONYMS[token] || [];
      for (const syn of syns) {
        if (pName.includes(syn)) {
          score += 25;
          tokenMatched = true;
          break;
        } else if (pCat.includes(syn) || pBrand.includes(syn)) {
          score += 20;
          tokenMatched = true;
          break;
        } else if (pDesc.includes(syn)) {
          score += 10;
          tokenMatched = true;
          break;
        }
      }
    }

    if (tokenMatched) matchedTokensCount++;
  });

  // If none of the search words (or synonyms) matched, return 0
  if (matchedTokensCount === 0) return 0;

  // Bonus for matching multiple query words
  const matchRatio = matchedTokensCount / tokens.length;
  score *= matchRatio;

  return score;
}

/**
 * Get products filtered and sorted by search relevance, including similar products if primary matches are few
 */
export function getSearchResultsWithSimilar(products, query) {
  if (!query || !query.trim()) {
    return { exactMatches: products, similarProducts: [], isFuzzyOrSimilar: false };
  }

  const qRaw = query.trim().toLowerCase();
  const tokens = extractSearchTokens(qRaw);

  const scoredProducts = products.map(product => ({
    product,
    score: scoreProductSearchRelevance(product, query)
  }));

  // Primary matches: score > 0
  const primary = scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);

  if (primary.length > 0) {
    // Also find similar recommendations (e.g. complementary or same category) to show below primary matches if desired
    const matchedCategories = new Set(primary.map(p => p.category));
    const similarProducts = products
      .filter(p => !primary.some(pm => pm.id === p.id) && matchedCategories.has(p.category))
      .slice(0, 4);

    return {
      exactMatches: primary,
      similarProducts,
      isFuzzyOrSimilar: false
    };
  }

  // Fallback: If 0 direct/synonym matches, compute category/brand similarity to show "Similar Products"
  const similarProducts = products
    .map(product => {
      let score = 0;
      const pCat = (product.category || '').toLowerCase();
      const pName = (product.name || '').toLowerCase();

      tokens.forEach(t => {
        // Partial word matching / sub-strings
        if (pCat.includes(t.slice(0, 3))) score += 10;
        if (pName.includes(t.slice(0, 3))) score += 15;
      });

      // Popularity fallback boost
      score += (product.rating || 4.5) * 2;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.product)
    .slice(0, 8);

  return {
    exactMatches: [],
    similarProducts,
    isFuzzyOrSimilar: true
  };
}

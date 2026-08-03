import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kc_browsing_history';
const MAX_ITEMS = 30;

/**
 * Custom hook to track product browsing history.
 * Records product views (id, category, name, timestamp) to localStorage.
 */
export function useBrowsingTracker() {
  const [browsingHistory, setBrowsingHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(browsingHistory));
  }, [browsingHistory]);

  const recordView = useCallback((product) => {
    if (!product || !product.id) return;

    setBrowsingHistory(prev => {
      // Remove existing entry for this product (avoid duplicates)
      const filtered = prev.filter(item => item.id !== product.id);

      // Add new entry at the front
      const entry = {
        id: product.id,
        category: product.category,
        name: product.name,
        timestamp: Date.now()
      };

      return [entry, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setBrowsingHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { browsingHistory, recordView, clearHistory };
}

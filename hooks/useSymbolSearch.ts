import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import axiosInstance from '../app/services/AxiosInstance';

export interface StockSuggestion {
  symbol: string;
  name: string;
  assetClass: string;
  exchange: string;
}

export function useSymbolSearch() {
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep a stable debounced function
  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (!query || query.length < 1) {
        setSuggestions([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get<StockSuggestion[]>('/alpaca/search', {
          params: { q: query }
        });
        setSuggestions(response.data);
      } catch (err: any) {
        setSuggestions([]);
        setError(err?.message || 'Error fetching suggestions');
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  const search = useCallback((query: string) => {
    debouncedSearch(query);
  }, [debouncedSearch]);

  return { suggestions, loading, error, search };
} 
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCarImage, type CarImageResult } from '@/utils/carImageSearch';

interface UseCarImageParams {
  make?: string;
  model?: string;
  year?: string | number;
  color?: string;
  enabled?: boolean; // Allow disabling the search
}

interface UseCarImageReturn {
  image: CarImageResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCarImage({
  make,
  model,
  year,
  color,
  enabled = true,
}: UseCarImageParams): UseCarImageReturn {
  const [image, setImage] = useState<CarImageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  const searchImage = useCallback(async () => {
    // Don't search if disabled or missing required params
    if (!enabled || !make || !model) {
      setImage(null);
      setLoading(false);
      return;
    }

    // Create a search key to avoid duplicate searches
    const searchKey = `${make}-${model}-${year || ''}-${color || ''}`;
    if (searchKey === lastSearchRef.current) {
      return;
    }
    lastSearchRef.current = searchKey;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCarImage(make, model, year, color);
      setImage(result);
      
      // Clear any previous error if successful
      if (result) {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch car image';
      
      // Don't show error for rate limiting, just silently fail
      if (errorMessage.includes('Rate limit')) {
        console.warn('Car image search rate limited, using placeholder');
        setError(null); // Don't show error to user
      } else {
        setError(errorMessage);
        console.error('Car image fetch error:', err);
      }
      
      setImage(null);
    } finally {
      setLoading(false);
    }
  }, [make, model, year, color, enabled]);

  // Debounced search to prevent too many rapid API calls
  const debouncedSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchImage();
    }, 500); // 500ms debounce
  }, [searchImage]);

  // Auto-fetch when params change
  useEffect(() => {
    debouncedSearch();
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debouncedSearch]);

  const refetch = useCallback(() => {
    lastSearchRef.current = ''; // Reset to force new search
    searchImage();
  }, [searchImage]);

  return {
    image,
    loading,
    error,
    refetch,
  };
}

// Hook for multiple images
export function useCarImages({
  make,
  model,
  year,
  color,
  enabled = true,
}: UseCarImageParams) {
  const [images, setImages] = useState<CarImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchImages = useCallback(async () => {
    if (!enabled || !make || !model) {
      setImages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { fetchCarImages } = await import('@/utils/carImageSearch');
      const results = await fetchCarImages(make, model, year, color);
      setImages(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch car images';
      setError(errorMessage);
      console.error('Car images fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [make, model, year, color, enabled]);

  useEffect(() => {
    searchImages();
  }, [searchImages]);

  const refetch = useCallback(() => {
    searchImages();
  }, [searchImages]);

  return {
    images,
    loading,
    error,
    refetch,
  };
}

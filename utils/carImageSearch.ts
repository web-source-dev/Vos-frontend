/**
 * Car Image Search Utility
 * Uses Google Custom Search API to fetch car images based on vehicle details
 */

interface CarImageSearchParams {
  make: string;
  model: string;
  year?: string | number;
  color?: string;
}

interface GoogleSearchResponse {
  items?: Array<{
    link: string;
    image?: {
      contextLink: string;
      height: number;
      width: number;
      byteSize: number;
      thumbnailLink: string;
      thumbnailHeight: number;
      thumbnailWidth: number;
    };
    title: string;
    snippet: string;
  }>;
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

interface CarImageResult {
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  width: number;
  height: number;
}

class CarImageSearchService {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';
  private cache = new Map<string, CarImageResult[]>();
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests
  private rateLimitResetTime = 0;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID || '';

    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Custom Search API credentials not found. Car image search will not work.');
    }
  }

  /**
   * Generate cache key for vehicle search
   */
  private getCacheKey(params: CarImageSearchParams): string {
    const { make, model, year, color } = params;
    return `${make}-${model}-${year || 'any'}-${color || 'any'}`.toLowerCase();
  }

  /**
   * Check if we're currently rate limited
   */
  private isRateLimited(): boolean {
    return Date.now() < this.rateLimitResetTime;
  }

  /**
   * Wait for rate limit cooldown
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Build search query for car images
   */
  private buildSearchQuery(params: CarImageSearchParams): string {
    const { make, model, year, color } = params;
    let query = `${make} ${model}`;
    
    if (year) {
      query += ` ${year}`;
    }
    
    if (color && color.toLowerCase() !== 'unknown') {
      query += ` ${color}`;
    }
    
    query += ' car exterior';
    return query;
  }

  /**
   * Filter and validate image results
   */
  private filterImageResults(items: GoogleSearchResponse['items'] = []): CarImageResult[] {
    return items
      .filter(item => {
        // Filter out invalid or low-quality images
        if (!item.image || !item.link) return false;
        
        const { width, height } = item.image;
        // Ensure minimum image quality
        if (width < 300 || height < 200) return false;
        
        // Filter out unwanted domains or image types
        const unwantedDomains = ['pinterest.com', 'ebay.com', 'craigslist.org'];
        const isUnwantedDomain = unwantedDomains.some(domain => 
          item.link.toLowerCase().includes(domain)
        );
        
        return !isUnwantedDomain;
      })
      .map(item => ({
        imageUrl: item.link,
        thumbnailUrl: item.image!.thumbnailLink,
        title: item.title,
        width: item.image!.width,
        height: item.image!.height,
      }))
      .slice(0, 5); // Limit to top 5 results
  }

  /**
   * Search for car images
   */
  async searchCarImages(params: CarImageSearchParams): Promise<CarImageResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Custom Search API not configured');
      return [];
    }

    // Check cache first
    const cacheKey = this.getCacheKey(params);
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached car image results for:', cacheKey);
      return this.cache.get(cacheKey)!;
    }

    // Check if we're rate limited
    if (this.isRateLimited()) {
      console.warn('Rate limited, skipping car image search');
      return [];
    }

    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      const query = this.buildSearchQuery(params);
      const searchParams = new URLSearchParams({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query,
        searchType: 'image',
        num: '5', // Reduced from 10 to save quota
        safe: 'active',
        imgSize: 'large',
        imgType: 'photo',
        fileType: 'jpg,png,jpeg',
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike,cc_noncommercial,cc_nonderived',
      });

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Rate limit exceeded, setting cooldown period');
          this.rateLimitResetTime = Date.now() + (60 * 1000); // 1 minute cooldown
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleSearchResponse = await response.json();
      const results = this.filterImageResults(data.items);
      
      // Cache the results
      this.cache.set(cacheKey, results);
      console.log('Cached car image results for:', cacheKey);
      
      return results;
    } catch (error) {
      console.error('Error searching for car images:', error);
      
      // For development, return empty array to prevent UI breaking
      if (error instanceof Error && error.message.includes('Rate limit')) {
        console.warn('Rate limit hit - using fallback behavior');
      }
      
      return [];
    }
  }

  /**
   * Get a single best car image
   */
  async getCarImage(params: CarImageSearchParams): Promise<CarImageResult | null> {
    const results = await this.searchCarImages(params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get fallback placeholder image for cars
   */
  getPlaceholderImage(): CarImageResult {
    return {
      imageUrl: '/images/car-placeholder.svg',
      thumbnailUrl: '/images/car-placeholder-thumb.svg',
      title: 'Car Placeholder',
      width: 400,
      height: 300,
    };
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.searchEngineId);
  }
}

// Export singleton instance
export const carImageSearch = new CarImageSearchService();

// Export types for use in components
export type { CarImageSearchParams, CarImageResult };

// Utility function for easy use in components
export async function fetchCarImage(
  make: string, 
  model: string, 
  year?: string | number, 
  color?: string
): Promise<CarImageResult | null> {
  return carImageSearch.getCarImage({ make, model, year, color });
}

// Utility function to get multiple car images
export async function fetchCarImages(
  make: string, 
  model: string, 
  year?: string | number, 
  color?: string
): Promise<CarImageResult[]> {
  return carImageSearch.searchCarImages({ make, model, year, color });
}

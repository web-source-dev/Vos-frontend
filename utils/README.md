# Car Image Search Utility

This utility uses Google Custom Search API to fetch car images based on vehicle details (make, model, year, color).

## Setup Instructions

### 1. Get Google Custom Search API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Custom Search API"
4. Go to "Credentials" and create an API key
5. Restrict the API key to "Custom Search API" for security

### 2. Create Custom Search Engine

1. Go to [Google Custom Search Engine](https://cse.google.com/cse/)
2. Click "Add" to create a new search engine
3. In "Sites to search", add `*.com` (or specific car sites like `cars.com`, `autotrader.com`, etc.)
4. Give it a name like "Car Image Search"
5. Click "Create"
6. Go to "Control Panel" → "Setup" → "Basic" tab
7. Copy the "Search engine ID"

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY=AIzaSyBji5RQN8WfIOt_R_MWc-jztiZMnJ_fIwQ
NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID=97af0d77901f84471
```
<script async src="https://cse.google.com/cse.js?cx=97af0d77901f84471">
</script>
<div class="gcse-search"></div>
## Usage

### Basic Usage

```typescript
import { fetchCarImage } from '@/utils/carImageSearch';

// Fetch a single car image
const image = await fetchCarImage('Toyota', 'Camry', '2023', 'red');
if (image) {
  console.log(image.imageUrl); // Full size image URL
  console.log(image.thumbnailUrl); // Thumbnail URL
}
```

### Using the React Hook

```typescript
import { useCarImage } from '@/hooks/useCarImage';

function CarDisplay({ make, model, year, color }) {
  const { image, loading, error, refetch } = useCarImage({
    make,
    model,
    year,
    color,
  });

  if (loading) return <div>Loading car image...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!image) return <div>No image found</div>;

  return (
    <img 
      src={image.imageUrl} 
      alt={`${make} ${model}`}
      onError={() => refetch()} // Retry on error
    />
  );
}
```

### Multiple Images

```typescript
import { fetchCarImages } from '@/utils/carImageSearch';

// Fetch multiple car images
const images = await fetchCarImages('Honda', 'Civic', '2022', 'blue');
images.forEach(img => console.log(img.imageUrl));
```

## Features

- **Smart Query Building**: Automatically constructs optimal search queries
- **Image Quality Filtering**: Filters out low-quality and inappropriate images
- **Domain Filtering**: Excludes unwanted domains (Pinterest, eBay, etc.)
- **Fallback Support**: Provides placeholder images when search fails
- **TypeScript Support**: Full type safety with TypeScript interfaces
- **React Hook Integration**: Easy-to-use hooks for React components
- **Error Handling**: Comprehensive error handling and logging
- **Caching**: Built-in request optimization

## API Response Structure

```typescript
interface CarImageResult {
  imageUrl: string;        // Full-size image URL
  thumbnailUrl: string;    // Thumbnail URL
  title: string;          // Image title/description
  width: number;          // Image width in pixels
  height: number;         // Image height in pixels
}
```

## Rate Limits

- Google Custom Search API: 100 queries per day (free tier)
- For higher usage, consider upgrading to a paid plan
- The utility includes built-in error handling for rate limit exceeded

## Security Notes

- API keys are exposed in the frontend (NEXT_PUBLIC_*), which is necessary for client-side requests
- Consider implementing a backend proxy for sensitive applications
- Restrict API key usage to specific domains in Google Cloud Console
- Monitor API usage to prevent unexpected charges

## Troubleshooting

1. **No images returned**: Check if API key and search engine ID are correct
2. **403 Forbidden**: API key might be restricted or invalid
3. **429 Too Many Requests**: Rate limit exceeded, wait before making more requests
4. **CORS errors**: Google Custom Search API supports CORS, but check browser console for specific errors

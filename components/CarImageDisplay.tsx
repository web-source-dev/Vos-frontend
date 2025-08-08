import React from 'react';
import { useCarImage } from '@/hooks/useCarImage';
import Image from 'next/image';

interface CarImageDisplayProps {
  make?: string;
  model?: string;
  year?: string | number;
  color?: string;
  className?: string;
  showPlaceholder?: boolean;
  alt?: string;
}

export function CarImageDisplay({
  make,
  model,
  year,
  color,
  className = '',
  showPlaceholder = true,
  alt,
}: CarImageDisplayProps) {
  const { image, loading, error } = useCarImage({
    make,
    model,
    year,
    color,
    enabled: !!(make && model), // Only search if we have make and model
  });

  // Generate alt text
  const altText = alt || `${make || ''} ${model || ''} ${year || ''}`.trim() || 'Vehicle';

  // Show loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  // Show error state or placeholder
  if (error || !image) {
    if (!showPlaceholder) return null;

    return (
      <div className={`flex items-center justify-center bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <Image src="https://www.shutterstock.com/image-vector/car-logo-icon-emblem-design-600nw-473088025.jpg" alt="Car Image" width={100} height={100} />
          <p className="text-xs text-gray-600 mb-1">
            {make && model ? `${make} ${model}` : 'Your Vehicle'}
          </p>
          <p className="text-xs text-gray-500">
            Image not available
          </p>
        </div>
      </div>
    );
  }

  // Show the car image
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <img
        src={image.imageUrl}
        alt={altText}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to thumbnail if main image fails
          const target = e.target as HTMLImageElement;
          if (target.src !== image.thumbnailUrl) {
            target.src = image.thumbnailUrl;
          }
        }}
      />
      {/* Optional overlay with vehicle info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-white text-xs font-medium">
          {make && model && `${make} ${model}`}
          {year && ` ${year}`}
        </p>
      </div>
    </div>
  );
}

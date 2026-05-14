'use client';

/**
 * Image Gallery with clickable thumbnails.
 * Pattern: Shopify Dawn — sticky gallery, thumbnail strip, zoom on hover.
 */
import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sanitizeImageUrl } from '@utils/imageSanitizer';

interface ProductImageGalleryProps {
  images: { url: string; alt: string }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  productName: string;
}

export function ProductImageGallery({ images, selectedIndex, onSelect, productName }: ProductImageGalleryProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="aspect-4/5 rounded-4xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xl shadow-black/5 relative cursor-zoom-in group"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={sanitizeImageUrl(images[selectedIndex]?.url)}
          alt={images[selectedIndex]?.alt || productName}
          fill
          className="object-cover transition-transform duration-500"
          style={isZooming ? {
            transform: 'scale(2)',
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
          } : undefined}
        />

        {/* Image counter badge */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation arrows for mobile/tablet */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                selectedIndex === index
                  ? 'border-gray-900 shadow-lg ring-2 ring-gray-900/10 scale-105'
                  : 'border-gray-100 hover:border-gray-300 opacity-60 hover:opacity-100'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={sanitizeImageUrl(img.url)}
                alt={img.alt}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

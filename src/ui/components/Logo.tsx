import React from 'react';

/**
 * [LAYER: UI]
 * High-fidelity vector logos for DreamBeesArt.
 * Features: Stylized bee geometry, hexagonal hive motifs, and brand-aligned amber accents.
 */

export const BeeLogo = ({ className = "h-10 w-10" }: { className?: string }) => (
  <div className={`relative ${className} group`}>
    <svg 
      viewBox="0 0 100 100" 
      className="w-full h-full drop-shadow-xl" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Golden Hexagon Base */}
      <path 
        d="M50 5L89 27.5V72.5L50 95L11 72.5V27.5L50 5Z" 
        fill="currentColor" 
        className="text-primary-500 transition-colors duration-500 group-hover:text-primary-600"
      />
      
      {/* Decorative Hive Pattern (Subtle) */}
      <path 
        d="M50 15L78 31V69L50 85L22 69V31L50 15Z" 
        stroke="white" 
        strokeOpacity="0.2" 
        strokeWidth="1"
      />
      
      {/* Stylized Minimalist Bee */}
      <g className="translate-y-1 transition-transform duration-500 group-hover:-translate-y-1">
        {/* Wings - Glassmorphic effect via opacity */}
        <path 
          d="M48 45C30 30 25 55 45 65" 
          fill="white" 
          fillOpacity="0.8" 
          className="animate-pulse"
        />
        <path 
          d="M52 45C70 30 75 55 55 65" 
          fill="white" 
          fillOpacity="0.8" 
          className="animate-pulse"
        />
        
        {/* Bee Body (Striped) */}
        <rect x="42" y="45" width="16" height="30" rx="8" fill="#111827" />
        <rect x="42" y="52" width="16" height="4" fill="#F59E0B" />
        <rect x="42" y="60" width="16" height="4" fill="#F59E0B" />
        <rect x="42" y="68" width="16" height="4" fill="#F59E0B" />
        
        {/* Head */}
        <circle cx="50" cy="42" r="7" fill="#111827" />
        
        {/* Antennas */}
        <path d="M46 38C44 32 40 34 38 34" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M54 38C56 32 60 34 62 34" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  </div>
);

export const FloatingBee = ({ className = "h-6 w-6" }: { className?: string }) => (
  <div className={`${className} animate-bounce duration-3000 ease-in-out`}>
    <BeeLogo className="w-full h-full" />
  </div>
);

export const HiveCell = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

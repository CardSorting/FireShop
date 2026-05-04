'use client';

import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWipe, setShowWipe] = useState(true);

  useEffect(() => {
    // Reset state on navigation
    setIsLoaded(false);
    setShowWipe(true);
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    const wipeTimer = setTimeout(() => {
      setShowWipe(false);
    }, 800);

    return () => {
      clearTimeout(timer);
      clearTimeout(wipeTimer);
    };
  }, []);

  return (
    <>
      {showWipe && <div className="honey-wipe" />}
      <div className={`transition-all duration-800 cubic-bezier(0.2, 0.8, 0.2, 1) ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'}`}>
        {children}
      </div>
    </>
  );
}

/**
 * [LAYER: UI]
 * 
 * Service Access Hook
 * 
 * Provides lazy-loaded access to core services via the service container.
 */

import { useMemo } from 'react';
import { createApiClientServices } from '@ui/apiClientServices';

/**
 * Hook to access core services with memoization
 * Prevents recreation of services on every render
 */
export function useServices() {
  return useMemo(() => {
    return createApiClientServices();
  }, []);
}
/**
 * [LAYER: INFRASTRUCTURE]
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './ui/AppRouter';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { initializeSelectedDB } from './infrastructure/dbProvider';
import './index.css';

// Initialize the selected database (SQLite tables, etc.)
initializeSelectedDB().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </StrictMode>
  );
}).catch(err => {
  console.error("Failed to initialize database:", err);
  // Still render to show error boundary or fallback
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </StrictMode>
  );
});


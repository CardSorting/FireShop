import '@testing-library/jest-dom';
import React from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

(globalThis as any).React = React;

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

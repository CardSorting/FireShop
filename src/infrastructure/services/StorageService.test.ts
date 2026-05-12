import { beforeEach, describe, expect, it, vi } from 'vitest';

const getBytes = vi.fn();

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage, path: string) => ({ path })),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
  getBytes,
  listAll: vi.fn(),
}));

vi.mock('../firebase/firebase', () => ({
  getStorage: vi.fn(() => ({})),
}));

describe('StorageService SSRF guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects arbitrary external download URLs', async () => {
    const { StorageService } = await import('./StorageService');

    await expect(StorageService.readFile('https://evil.example/internal')).rejects.toThrow('Untrusted asset source');
    expect(getBytes).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getArticles = vi.fn();
const searchArticles = vi.fn();
const requireAdminSession = vi.fn();

vi.mock('@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository', () => ({
  knowledgebaseRepository: {
    getArticles,
    searchArticles,
  },
}));

vi.mock('@infrastructure/server/apiGuards', () => ({
  jsonError: (err: unknown) => Response.json({ error: err instanceof Error ? err.message : 'error' }, { status: 500 }),
  parseBoundedLimit: (value: string | null, fallback = 20, max = 50) => Math.min(Number(value ?? fallback), max),
  requireAdminSession,
}));

describe('support articles public status boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getArticles.mockResolvedValue({ articles: [] });
  });

  it('forces anonymous article lists to published status', async () => {
    const { GET } = await import('./route');
    await GET(new Request('https://example.test/api/support/articles?status=draft'));

    expect(requireAdminSession).toHaveBeenCalled();
  });

  it('does not pass draft/all status without admin check', async () => {
    const { GET } = await import('./route');
    await GET(new Request('https://example.test/api/support/articles'));

    expect(requireAdminSession).not.toHaveBeenCalled();
    expect(getArticles).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const { mockUseClientFetch, mockUseDeckProgress } = vi.hoisted(() => ({
  mockUseClientFetch: vi.fn(),
  mockUseDeckProgress: vi.fn(),
}));

vi.mock('~/composables/use-client-fetch', () => ({ default: mockUseClientFetch }));
vi.mock('~/composables/use-deck-progress', () => ({ default: mockUseDeckProgress }));

const { default: useDecks } = await import('~/composables/use-decks');

const mockMeta = [
  { identifier: 'deck-a', name: 'Deck A', description: 'First deck', cardCount: 4 },
  { identifier: 'deck-b', name: 'Deck B', description: 'Second deck', cardCount: 2 },
];

describe('useDecks', () => {
  beforeEach(() => {
    mockUseClientFetch.mockReset();
    mockUseDeckProgress.mockReset();
  });

  it('computes progress percentage based on mastered cards', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(mockMeta), pending: ref(false) });
    mockUseDeckProgress.mockReturnValue({
      progress: ref({
        'deck-a': { identifier: 'deck-a', lastStudied: null, masteredCards: { '0': true, '1': true } },
      }),
      updateProgress: vi.fn(),
      deleteProgress: vi.fn(),
    });

    const { data } = useDecks();

    expect(data.value[0]!.progress).toBe(50); // 2/4
    expect(data.value[1]!.progress).toBe(0);  // no progress
  });

  it('returns empty array when decksMeta is null', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(null), pending: ref(false) });
    mockUseDeckProgress.mockReturnValue({
      progress: ref({}),
      updateProgress: vi.fn(),
      deleteProgress: vi.fn(),
    });

    const { data } = useDecks();

    expect(data.value).toEqual([]);
  });

  it('getDeck returns the correct deck by identifier', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(mockMeta), pending: ref(false) });
    mockUseDeckProgress.mockReturnValue({
      progress: ref({}),
      updateProgress: vi.fn(),
      deleteProgress: vi.fn(),
    });

    const { getDeck } = useDecks();

    expect(getDeck('deck-b')?.identifier).toBe('deck-b');
    expect(getDeck('not-exist')).toBeUndefined();
  });
});

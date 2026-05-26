import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const { mockUseClientFetch, mockUseMyDecks } = vi.hoisted(() => ({
  mockUseClientFetch: vi.fn(),
  mockUseMyDecks: vi.fn(),
}));

vi.mock('~/composables/use-client-fetch', () => ({ default: mockUseClientFetch }));
vi.mock('~/composables/use-my-decks', () => ({ default: mockUseMyDecks }));

const { default: useDecks } = await import('~/composables/use-market-decks');

const mockMeta = [
  { id: 'deck-a', name: 'Deck A', description: 'First deck', cardCount: 4 },
  { id: 'deck-b', name: 'Deck B', description: 'Second deck', cardCount: 2 },
];

describe('useDecks', () => {
  beforeEach(() => {
    mockUseClientFetch.mockReset();
    mockUseMyDecks.mockReset();
  });

  it('returns empty array when decksMeta is null', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(null), pending: ref(false) });
    mockUseMyDecks.mockReturnValue({
      progress: ref({}),
    });

    const { data } = useDecks();

    expect(data.value).toEqual([]);
  });

  it('getDeck returns the correct deck by id', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(mockMeta), pending: ref(false) });
    mockUseMyDecks.mockReturnValue({
      progress: ref({}),
    });

    const { getDeck } = useDecks();

    expect(getDeck('deck-b')?.id).toBe('deck-b');
    expect(getDeck('not-exist')).toBeUndefined();
  });
});

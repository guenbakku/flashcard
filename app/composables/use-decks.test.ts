import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const { mockUseClientFetch, mockUseLocalStorage } = vi.hoisted(() => ({
  mockUseClientFetch: vi.fn(),
  mockUseLocalStorage: vi.fn(),
}));

vi.mock('~/composables/use-client-fetch', () => ({ default: mockUseClientFetch }));
vi.mock('@vueuse/core', async (importOriginal) => ({
  ...await importOriginal(),
  useLocalStorage: mockUseLocalStorage,
}));

const { default: useDecks } = await import('~/composables/use-decks');

const mockMeta = [
  { identifier: 'deck-a', title: 'Deck A', cardCount: 4 },
  { identifier: 'deck-b', title: 'Deck B', cardCount: 2 },
];

describe('useDecks', () => {
  beforeEach(() => {
    mockUseClientFetch.mockReset();
    mockUseLocalStorage.mockReset();
  });

  it('computes progress percentage based on mastered cards', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(mockMeta), pending: ref(false) });
    mockUseLocalStorage.mockReturnValue(ref({
      'deck-a': { lastStudied: null, masteredCards: { '0': true, '1': true } },
    }));

    const { data } = useDecks();

    expect(data.value[0]!.progress).toBe(50); // 2/4
    expect(data.value[1]!.progress).toBe(0);  // no progress
  });

  it('returns empty array when decksMeta is null', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(null), pending: ref(false) });
    mockUseLocalStorage.mockReturnValue(ref({}));

    const { data } = useDecks();

    expect(data.value).toEqual([]);
  });

  it('getDeck returns the correct deck by identifier', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(mockMeta), pending: ref(false) });
    mockUseLocalStorage.mockReturnValue(ref({}));

    const { getDeck } = useDecks();

    expect(getDeck('deck-b')?.identifier).toBe('deck-b');
    expect(getDeck('not-exist')).toBeUndefined();
  });

  it('updateDeck merges new progress into storage', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(null), pending: ref(false) });
    const progress = ref<Record<string, object>>({});
    mockUseLocalStorage.mockReturnValue(progress);

    const { updateDeck } = useDecks();
    updateDeck('deck-a', { masteredCards: { '0': true } });

    expect(progress.value['deck-a']).toMatchObject({ masteredCards: { '0': true } });
  });

  it('deleteDeck removes the deck progress from storage', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(null), pending: ref(false) });
    const progress = ref({ 'deck-a': { lastStudied: null, masteredCards: {} } });
    mockUseLocalStorage.mockReturnValue(progress);

    const { deleteDeck } = useDecks();
    deleteDeck('deck-a');

    expect(progress.value).not.toHaveProperty('deck-a');
  });
});

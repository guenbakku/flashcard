import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const { mockUseClientFetch } = vi.hoisted(() => ({
  mockUseClientFetch: vi.fn(),
}));

vi.mock('~/composables/use-client-fetch', () => ({
  default: mockUseClientFetch,
}));

const { default: useMarketDeck } = await import('~/composables/use-market-deck');

describe('useMarketDeck', () => {
  beforeEach(() => {
    mockUseClientFetch.mockReset();
  });

  it('fetches from the correct URL based on identifier', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(null), pending: ref(false) });

    useMarketDeck('my-deck');

    expect(mockUseClientFetch).toHaveBeenCalledWith(
      '/data/decks/my-deck.json',
      expect.objectContaining({ transform: expect.any(Function) }),
    );
  });

  it('returns data and pending from useClientFetch', () => {
    const data = ref({ cards: [] });
    const pending = ref(true);
    mockUseClientFetch.mockReturnValue({ data, pending });

    const result = useMarketDeck('my-deck');

    expect(result.data).toBe(data);
    expect(result.pending).toBe(pending);
  });
});

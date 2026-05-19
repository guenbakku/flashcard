import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const { mockUseClientFetch } = vi.hoisted(() => ({
  mockUseClientFetch: vi.fn(),
}));

vi.mock('~/composables/use-client-fetch', () => ({
  default: mockUseClientFetch,
}));

const { default: useDeck } = await import('~/composables/use-deck');

describe('useDeck', () => {
  beforeEach(() => {
    mockUseClientFetch.mockReset();
  });

  it('fetches from the correct URL based on identifier', () => {
    mockUseClientFetch.mockReturnValue({ data: ref(null), pending: ref(false) });

    useDeck('my-deck');

    expect(mockUseClientFetch).toHaveBeenCalledWith(
      '/data/decks/my-deck.json',
      expect.objectContaining({ transform: expect.any(Function) }),
    );
  });

  it('returns data and pending from useClientFetch', () => {
    const data = ref({ cards: [] });
    const pending = ref(true);
    mockUseClientFetch.mockReturnValue({ data, pending });

    const result = useDeck('my-deck');

    expect(result.data).toBe(data);
    expect(result.pending).toBe(pending);
  });
});

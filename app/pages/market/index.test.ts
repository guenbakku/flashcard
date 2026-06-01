import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import IndexPage from './index.vue';

const { mockUseMarketDecks } = vi.hoisted(() => ({ mockUseMarketDecks: vi.fn() }));

vi.mock('~/composables/use-market-decks', () => ({ default: mockUseMarketDecks }));

const mockDecks = [
  { id: 'deck-a', name: 'JavaScript Basics', description: 'Learn JS', cardCount: 10 },
  { id: 'deck-b', name: 'Vue Framework', description: 'Learn Vue', cardCount: 5 },
];

const mountPage = () => mountSuspended(IndexPage);

describe('pages/market/index.vue', () => {
  beforeEach(() => {
    mockUseMarketDecks.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('renders market decks', async () => {
    mockUseMarketDecks.mockReturnValue({ data: ref(mockDecks), pending: ref(false) });

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('JavaScript Basics');
    expect(wrapper.text()).toContain('Vue Framework');
  });

  describe('filteredDecks', () => {
    it('returns all decks when keyword is empty', async () => {
      mockUseMarketDecks.mockReturnValue({ data: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain('JavaScript Basics');
      expect(wrapper.text()).toContain('Vue Framework');
    });

    it('filters decks by name', async () => {
      mockUseMarketDecks.mockReturnValue({ data: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();
      await wrapper.find('input').setValue('javascript');
      await vi.advanceTimersByTimeAsync(300);

      expect(wrapper.text()).toContain('JavaScript Basics');
      expect(wrapper.text()).not.toContain('Vue Framework');
    });

    it('filters decks by description', async () => {
      mockUseMarketDecks.mockReturnValue({ data: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();
      await wrapper.find('input').setValue('learn vue');
      await vi.advanceTimersByTimeAsync(300);

      expect(wrapper.text()).toContain('Vue Framework');
      expect(wrapper.text()).not.toContain('JavaScript Basics');
    });

    it('shows empty state when no deck matches keyword', async () => {
      mockUseMarketDecks.mockReturnValue({ data: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();
      await wrapper.find('input').setValue('xyz-not-exist');
      await vi.advanceTimersByTimeAsync(300);

      expect(wrapper.text()).toContain('Không tìm thấy bộ thẻ nào');
      expect(wrapper.text()).not.toContain('JavaScript Basics');
      expect(wrapper.text()).not.toContain('Vue Framework');
    });
  });
});

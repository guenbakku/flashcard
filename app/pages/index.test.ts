import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import IndexPage from '~/pages/index.vue';

const { mockUseMyDecks } = vi.hoisted(() => ({ mockUseMyDecks: vi.fn() }));

vi.mock('~/composables/use-my-decks', () => ({ default: mockUseMyDecks }));

const mockDecks = [
  { id: 'deck-a', name: 'JavaScript Basics', description: 'Learn JS', cardCount: 10, progress: 0, lastStudied: null },
  { id: 'deck-b', name: 'Vue Framework', description: 'Learn Vue', cardCount: 5, progress: 50, lastStudied: '2024-01-15T10:00:00' },
];

const mountPage = () => mountSuspended(IndexPage);

describe('pages/index.vue', () => {
  beforeEach(() => {
    mockUseMyDecks.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('shows "Chưa học" when deck has not been studied', async () => {
    mockUseMyDecks.mockReturnValue({ decks: ref([mockDecks[0]]), pending: ref(false) });

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('Chưa học');
  });

  describe('filteredDecks', () => {
    it('returns all decks when keyword is empty', async () => {
      mockUseMyDecks.mockReturnValue({ decks: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain('JavaScript Basics');
      expect(wrapper.text()).toContain('Vue Framework');
    });

    it('filters decks by name', async () => {
      mockUseMyDecks.mockReturnValue({ decks: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();
      await wrapper.find('input').setValue('javascript');
      await vi.advanceTimersByTimeAsync(300);

      expect(wrapper.text()).toContain('JavaScript Basics');
      expect(wrapper.text()).not.toContain('Vue Framework');
    });

    it('filters decks by description', async () => {
      mockUseMyDecks.mockReturnValue({ decks: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();
      await wrapper.find('input').setValue('Learn Vue');
      await vi.advanceTimersByTimeAsync(300);

      expect(wrapper.text()).toContain('Vue Framework');
      expect(wrapper.text()).not.toContain('JavaScript Basics');
    });

    it('returns empty when no deck matches keyword', async () => {
      mockUseMyDecks.mockReturnValue({ decks: ref(mockDecks), pending: ref(false) });

      const wrapper = await mountPage();
      await wrapper.find('input').setValue('xyz-not-exist');
      await vi.advanceTimersByTimeAsync(300);

      expect(wrapper.text()).not.toContain('JavaScript Basics');
      expect(wrapper.text()).not.toContain('Vue Framework');
    });
  });
});

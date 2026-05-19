import type { Deck } from "~/types";

// Static metadata fetched from API (read-only)
type DeckMeta = Pick<Deck, "identifier" | "name" | "description" | "cardCount">;

// User progress stored in localStorage (mutable)
type DeckProgress = Pick<Deck, "lastStudied" | "masteredCards">;

const defaultProgress: DeckProgress = {
  lastStudied: null,
  masteredCards: {},
};

const useDecks = () => {
  const { data: decksMeta, pending } = useClientFetch<DeckMeta[]>('/data/decks.json');
  const progress = useLocalStorage<Record<string, DeckProgress>>('decks', {});

  const decks = computed(() => {
    return decksMeta.value?.map(meta => {
      const deckProgress = progress.value[meta.identifier] ?? defaultProgress;
      const masteredCount = Object.keys(deckProgress.masteredCards ?? {}).length;

      return {
        ...meta,
        ...deckProgress,
        progress: Math.round(masteredCount / meta.cardCount * 100),
      };
    }) ?? [];
  });

  const getDeck = (identifier: string) => {
    return decks.value.find(deck => deck.identifier === identifier);
  };

  const updateDeck = (identifier: string, data: Partial<DeckProgress>) => {
    progress.value = {
      ...progress.value,
      [identifier]: {
        ...defaultProgress,
        ...(progress.value[identifier] ?? {}),
        ...data,
      },
    };
  };

  const deleteDeck = (identifier: string) => {
    const { [identifier]: _, ...rest } = progress.value;
    progress.value = rest;
  };

  return {
    data: decks,
    pending,
    getDeck,
    updateDeck,
    deleteDeck,
  };
};

export default useDecks;

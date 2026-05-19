import { deckMetaSchema, type DeckMeta, type DeckProgress } from '~/types';

const defaultProgress: DeckProgress = {
  lastStudied: null,
  masteredCards: {},
};

const useDecks = () => {
  const { data: decksMeta, pending } = useClientFetch<DeckMeta[]>('/data/decks.json', {
    transform: (raw) => deckMetaSchema.array().parse(raw),
  });
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

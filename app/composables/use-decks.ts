import { deckMetaSchema, type DeckMeta, type DeckProgress } from '~/types';
import useDeckProgress from '~/composables/use-deck-progress';

const defaultProgress: Omit<DeckProgress, 'identifier'> = {
  lastStudied: null,
  masteredCards: {},
};

const useDecks = () => {
  const { data: decksMeta, pending } = useClientFetch<DeckMeta[]>('/data/decks.json', {
    transform: (raw) => deckMetaSchema.array().parse(raw),
  });
  const { progress } = useDeckProgress();

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

  return {
    data: decks,
    pending,
    getDeck,
  };
};

export default useDecks;

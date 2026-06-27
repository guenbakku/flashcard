import { type DeckMeta, deckMetaSchema } from '~/types';

function useMarketDecks() {
  const { data: decksMeta, pending, error } = useClientFetch<DeckMeta[]>('/data/decks.json', {
    transform: raw => deckMetaSchema.array().parse(raw),
  });

  const decks = computed(() => decksMeta.value ?? []);

  const getDeck = (id: string) => {
    return decks.value.find(deck => deck.id === id);
  };

  return {
    data: decks,
    error,
    pending,
    getDeck,
  };
};

export default useMarketDecks;

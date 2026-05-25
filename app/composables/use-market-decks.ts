import { type DeckMeta, deckMetaSchema } from '~/types';

const useMarketDecks = () => {
  const { data: decksMeta, pending } = useClientFetch<DeckMeta[]>('/data/decks.json', {
    transform: raw => deckMetaSchema.array().parse(raw),
  });

  const decks = computed(() => decksMeta.value ?? []);

  const getDeck = (identifier: string) => {
    return decks.value.find(deck => deck.identifier === identifier);
  };

  return {
    data: decks,
    pending,
    getDeck,
  };
};

export default useMarketDecks;

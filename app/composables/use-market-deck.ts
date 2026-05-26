import { type DeckDetail, deckDetailSchema } from '~/types';

const useMarketDeck = (id: string) => {
  const { data, pending } = useClientFetch<DeckDetail>(`/data/decks/${id}.json`, {
    transform: raw => deckDetailSchema.parse(raw),
  });

  return {
    data,
    pending,
  };
};

export default useMarketDeck;

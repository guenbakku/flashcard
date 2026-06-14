import { type DeckDetail, deckDetailSchema } from '~/types';

const useMarketDeck = (id: string) => {
  const { data, pending, error } = useClientFetch<DeckDetail>(`/data/decks/${id}.json`, {
    transform: raw => deckDetailSchema.parse(raw),
  });

  return {
    data,
    error,
    pending,
  };
};

export default useMarketDeck;

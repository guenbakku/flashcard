import { deckDetailSchema, type DeckDetail } from '~/types';

const useDeck = (identifier: string) => {
  const { data, pending } = useClientFetch<DeckDetail>(`/data/decks/${identifier}.json`, {
    transform: (raw) => deckDetailSchema.parse(raw),
  });

  return {
    data,
    pending,
  };
};

export default useDeck;

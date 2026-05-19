import type { Card } from '~/types';

type DeckDetail = {
  cards: Card[];
};

const useDeck = (identifier: string) => {
  const { data, pending } = useClientFetch<DeckDetail>(`/data/decks/${identifier}.json`);

  return {
    data,
    pending,
  };
};

export default useDeck;

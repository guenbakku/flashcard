import type { Card } from '~/types';

const useCard = (deckIdentifier: string) => {
  const { data: cards, pending } = useClientFetch<Card[]>(`/data/decks/${deckIdentifier}.json`);

  return {
    data: cards,
    pending,
  };
};

export default useCard;

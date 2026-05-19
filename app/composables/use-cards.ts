import type { Card } from '~/types';

const useCard = (deckIdentifier: string) => {
  const { data, pending } = useClientFetch<{cards: Card[]}>(`/data/decks/${deckIdentifier}.json`);
  const cards = computed(() => data.value?.cards);

  return {
    data: cards,
    pending,
  };
};

export default useCard;

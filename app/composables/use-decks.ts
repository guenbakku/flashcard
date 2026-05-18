import type { Deck } from "~/types";

type DeckFromApi = Pick<Deck, "id" | "name" | "description" | "cardCount">;
type DeckFromClient = Pick<Deck, "lastStudied" | "progress">;

const useDecks = () => {
  const { data: decksFromApi } = useClientFetch<DeckFromApi[]>('/decks.json');
  const storage = useLocalStorage<Record<number, DeckFromClient>>('decks', {});

  const decks = computed(() => {
    return decksFromApi.value?.map(deck => {
      return {
        ...deck,
        ...(storage.value[deck.id] ?? {lastStudied: null, progress: 0}),
      };
    }) ?? [];
  });

  return { data: decks };
};

export default useDecks;

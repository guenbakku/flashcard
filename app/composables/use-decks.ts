import type { Deck } from "~/types";

type DeckFromApi = Pick<Deck, "identifier" | "name" | "description" | "cardCount">;
type DeckFromClient = Pick<Deck, "lastStudied" | "correct">;

const defaultDeck: DeckFromClient = {
  lastStudied: null,
  correct: {},
};

const useDecks = () => {
  const { data: decksFromApi, pending } = useClientFetch<DeckFromApi[]>('/data/decks.json');
  const storage = useLocalStorage<Record<string, DeckFromClient>>('decks', {});

  const decks = computed(() => {
    return decksFromApi.value?.map(deck => {
      return {
        ...deck,
        ...(storage.value[deck.identifier] ?? defaultDeck),
        progress: Math.round(Object.keys(storage.value[deck.identifier]?.correct || {}).length / deck.cardCount * 100),
      };
    }) ?? [];
  });

  const getDeck = (identifier: string) => {
    return decks.value.find(deck => deck.identifier === identifier);
  };

  const updateDeck = (identifier: string, data: Partial<DeckFromClient>) => {
    storage.value = {
      ...storage.value,
      [identifier]: {
        ...defaultDeck,
        ...(storage.value[identifier] ?? {}),
        ...data,
      },
    };
  };

  const deleteDeck = (identifier: string) => {
    const { [identifier]: _, ...rest } = storage.value;
    console.log(rest);
    storage.value = rest;
  };

  return {
    data: decks,
    pending,
    getDeck,
    updateDeck,
    deleteDeck,
  };
};

export default useDecks;

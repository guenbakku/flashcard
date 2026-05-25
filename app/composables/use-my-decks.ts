import type { Subscription } from 'rxjs';
import { computed, onMounted, onUnmounted } from 'vue';

import useIndexedDb, { type DocTypes } from '~/composables/use-indexed-db';
import type { Card, DeckMeta, DeckProgress, MyDeckDetail, PartialExcept } from '~/types';
import { deckDetailSchema, deckProgressStorageSchema } from '~/types';

type MyDeckDocument = DocTypes['deck'];

const getDecksState = () => useState<MyDeckDocument[]>('myDeckDocs', () => []);
const getLoadedState = () => useState<boolean>('myDecksLoaded', () => false);
const getPendingState = () => useState<boolean>('myDecksPending', () => true);

const normalizeDeck = (document: MyDeckDocument) => {
  const cardCount = document.cardCount ?? 0;
  const masteredCards = document.masteredCards ?? {};

  return {
    identifier: document.id,
    name: document.name,
    description: document.description ?? '',
    cardCount,
    lastStudied: document.lastStudied ?? null,
    masteredCards,
    progress: cardCount ? Math.round((Object.keys(masteredCards).length / cardCount) * 100) : 0,
  } as const;
};

const useMyDecks = () => {
  const deckDocs = getDecksState();
  const loaded = getLoadedState();
  const pending = getPendingState();

  const decks = computed(() => deckDocs.value.map(doc => normalizeDeck(doc)));

  const progress = computed(() => {
    return deckDocs.value.reduce((acc, doc) => {
      acc[doc.id] = {
        identifier: doc.id,
        lastStudied: doc.lastStudied ?? null,
        masteredCards: doc.masteredCards ?? {},
      };
      return acc;
    }, {} as Record<string, DeckProgress>);
  });

  const toPlainDocument = (document: unknown): MyDeckDocument => {
    if (
      typeof document === 'object'
      && document
      && 'toJSON' in document
      && typeof (document as { toJSON?: unknown }).toJSON === 'function'
    ) {
      return (document as { toJSON: () => MyDeckDocument }).toJSON();
    }

    return document as MyDeckDocument;
  };

  const initialize = async () => {
    if (!import.meta.client || loaded.value) {
      return;
    }

    const db = await useIndexedDb();
    const query = db.deck.find();
    const documents = await query.exec();

    deckDocs.value = documents.map(toPlainDocument);
    loaded.value = true;
    pending.value = false;
  };

  if (import.meta.client) {
    void initialize();

    let dbSubscription: Subscription | null = null;

    onMounted(async () => {
      const db = await useIndexedDb();
      const query = db.deck.find();

      dbSubscription = query.$.subscribe((newDocuments: unknown[]) => {
        deckDocs.value = newDocuments.map(toPlainDocument);
      });
    });

    onUnmounted(() => {
      dbSubscription?.unsubscribe();
    });
  }

  const getDeck = (identifier: string) => decks.value.find(deck => deck.identifier === identifier);

  const getDeckDetail = async (identifier: string): Promise<MyDeckDetail | undefined> => {
    if (!import.meta.client) {
      return undefined;
    }

    const db = await useIndexedDb();
    const deckDoc = await db.deck.findOne(identifier).exec();
    if (!deckDoc) {
      return undefined;
    }

    const cards = await db.card.find().where('deckId').eq(identifier).exec();

    return {
      identifier,
      name: deckDoc.name,
      description: deckDoc.description ?? '',
      cardCount: deckDoc.cardCount ?? cards.length,
      cards: cards.map(card => card.toJSON() as Card),
      masteredCards: deckDoc.masteredCards,
      lastStudied: deckDoc.lastStudied,
    };
  };

  const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `deck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const getCardId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const writeDeckCards = async (deckId: string, cards: Card[]) => {
    const db = await useIndexedDb();
    const existingCards = await db.card.find().where('deckId').eq(deckId).exec();

    await Promise.all(existingCards.map(card => card.remove()));
    await Promise.all(cards.map(card => db.card.insert({
      id: `${deckId}:${getCardId()}`,
      deckId,
      front: card.front,
      back: card.back,
      backSub: card.backSub ?? '',
    })));
  };

  const createDeck = async (payload: { name: string; description: string; cards: Card[]; identifier?: string }) => {
    if (!import.meta.client) {
      return null;
    }

    const db = await useIndexedDb();
    const id = payload.identifier ?? generateId();

    await db.deck.insert({
      id,
      name: payload.name,
      description: payload.description,
      cardCount: payload.cards.length,
      masteredCards: {},
    });

    await writeDeckCards(id, payload.cards);

    return id;
  };

  const updateProgress = async (data: PartialExcept<DeckProgress, 'identifier'>) => {
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    const deckDoc = await db.deck.findOne(data.identifier).exec();
    if (!deckDoc) {
      return;
    }

    const existingProgress: DeckProgress = {
      identifier: deckDoc.id,
      lastStudied: deckDoc.lastStudied ?? null,
      masteredCards: deckDoc.masteredCards ?? {},
    };

    const nextProgress = {
      ...existingProgress,
      ...data,
    };

    await deckDoc.update({
      $set: {
        lastStudied: nextProgress.lastStudied,
        masteredCards: nextProgress.masteredCards,
      },
    });
  };

  const deleteProgress = async (identifier: string) => {
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    const deckDoc = await db.deck.findOne(identifier).exec();
    if (!deckDoc) {
      return;
    }

    await deckDoc.update({
      $set: {
        lastStudied: null,
        masteredCards: {},
      },
    });
  };

  const exportProgress = () => {
    const runtimeConfig = useRuntimeConfig();

    return {
      version: runtimeConfig.public.databaseSchemaVersion,
      data: Object.values(progress.value),
    };
  };

  const importProgress = async (data: DeckProgress[]) => {
    const validatedProgress = deckProgressStorageSchema.parse(data);
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    await Promise.all(validatedProgress.map(async (deckProgress) => {
      const deckDoc = await db.deck.findOne(deckProgress.identifier).exec();
      if (!deckDoc) {
        return;
      }

      await deckDoc.update({
        $set: {
          lastStudied: deckProgress.lastStudied,
          masteredCards: deckProgress.masteredCards,
        },
      });
    }));
  };

  const updateDeck = async (payload: { identifier: string; name: string; description: string; cards: Card[] }) => {
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    const deckDoc = await db.deck.findOne(payload.identifier).exec();
    if (!deckDoc) {
      return;
    }

    await deckDoc.update({
      $set: {
        name: payload.name,
        description: payload.description,
        cardCount: payload.cards.length,
      },
    });
    await writeDeckCards(payload.identifier, payload.cards);

    const currentProgress = progress.value[payload.identifier];
    if (currentProgress) {
      const validFronts = new Set(payload.cards.map(card => card.front));
      const cleanedMasteredCards = Object.fromEntries(
        Object.entries(currentProgress.masteredCards).filter(([front]) => validFronts.has(front)),
      );

      await updateProgress({
        identifier: payload.identifier,
        masteredCards: cleanedMasteredCards,
      });
    }
  };

  const deleteDeck = async (identifier: string) => {
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    await db.card.find().where('deckId').eq(identifier).remove();

    const deckDoc = await db.deck.findOne(identifier).exec();
    if (deckDoc) {
      await deckDoc.remove();
    }
  };

  const copyMarketDeck = async (meta: DeckMeta) => {
    if (!import.meta.client) {
      return null;
    }

    const raw = await $fetch(`/data/decks/${meta.identifier}.json`);
    const deckDetail = deckDetailSchema.parse(raw);

    await createDeck({
      name: meta.name,
      description: meta.description,
      cards: deckDetail.cards,
    });

    return meta.identifier;
  };

  return {
    decks,
    pending,
    progress,
    getDeck,
    getDeckDetail,
    createDeck,
    updateDeck,
    updateProgress,
    deleteDeck,
    deleteProgress,
    exportProgress,
    importProgress,
    copyMarketDeck,
  };
};

export default useMyDecks;

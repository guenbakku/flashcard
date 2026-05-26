import type { Subscription } from 'rxjs';
import { computed, onMounted, onUnmounted } from 'vue';

import useIndexedDb, { type DocTypes } from '~/composables/use-indexed-db';
import type { Card, DeckMeta, DeckProgress, PartialExcept } from '~/types';
import { deckDetailSchema, deckProgressStorageSchema } from '~/types';

type DeckDocument = DocTypes['deck'];

const getDecksState = () => useState<DeckDocument[]>('myDeckDocs', () => []);
const getLoadedState = () => useState<boolean>('myDecksLoaded', () => false);
const getPendingState = () => useState<boolean>('myDecksPending', () => true);

const normalizeDeck = (document: DeckDocument) => {
  const cardCount = document.cardCount ?? 0;
  const masteredCards = document.masteredCards ?? {};

  return {
    id: document.id,
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
        id: doc.id,
        lastStudied: doc.lastStudied ?? null,
        masteredCards: doc.masteredCards ?? {},
      };
      return acc;
    }, {} as Record<string, DeckProgress>);
  });

  const toPlainDocument = (document: unknown): DeckDocument => {
    if (
      typeof document === 'object'
      && document
      && 'toJSON' in document
      && typeof (document as { toJSON?: unknown }).toJSON === 'function'
    ) {
      return (document as { toJSON: () => DeckDocument }).toJSON();
    }

    return document as DeckDocument;
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

    return db;
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

  const getDeck = async (id: string) => {
    const db = await useIndexedDb();
    return await db.deck.findOne(id).exec();
  };

  const getAllCardsOfDeck = async (deckId: string) => {
    const db = await useIndexedDb();
    return await db.card.find().where('deckId').eq(deckId).sort({ order: 'asc' }).exec();
  };

  const writeDeckCards = async (deckId: string, cards: Card[]) => {
    const db = await useIndexedDb();
    const existingCards = await db.card.find().where('deckId').eq(deckId).exec();

    let cardOrder = 0;

    await Promise.all(existingCards.map(card => card.remove()));
    await Promise.all(cards.map((card) => {
      db.card.insert({
        id: generateUid(),
        deckId,
        front: card.front,
        back: card.back,
        backSub: card.backSub ?? '',
        order: cardOrder,
      });

      ++cardOrder;
    }));
  };

  const createDeck = async (payload: { name: string; description: string; cards: Card[]; id?: string }) => {
    if (!import.meta.client) {
      return null;
    }

    const db = await useIndexedDb();
    const id = payload.id ?? generateUid();

    await db.deck.insert({
      id,
      name: payload.name,
      description: payload.description,
      cardCount: payload.cards.length,
      masteredCards: {},
      createdAt: new Date().toISOString(),
    });

    await writeDeckCards(id, payload.cards);

    return id;
  };

  const updateProgress = async (data: PartialExcept<DeckProgress, 'id'>) => {
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    const deckDoc = await db.deck.findOne(data.id).exec();
    if (!deckDoc) {
      return;
    }

    const nextProgress = {
      lastStudied: data.lastStudied ?? deckDoc.lastStudied ?? null,
      masteredCards: {
        ...(deckDoc.masteredCards ?? {}),
      },
    };

    for (const key in data.masteredCards) {
      if (data.masteredCards[key]) {
        nextProgress.masteredCards[key] = data.masteredCards[key];
      } else {
        const { [key]: _, ...rest } = nextProgress.masteredCards;
        nextProgress.masteredCards = rest;
      }
    }

    await deckDoc.update({
      $set: {
        lastStudied: data.lastStudied ?? deckDoc.lastStudied ?? null,
        masteredCards: nextProgress.masteredCards,
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
      const deckDoc = await db.deck.findOne(deckProgress.id).exec();
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

  const updateDeck = async (payload: { id: string; name: string; description: string; cards: Card[] }) => {
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    const deckDoc = await db.deck.findOne(payload.id).exec();
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

    await writeDeckCards(payload.id, payload.cards);

    const currentProgress = progress.value[payload.id];
    if (currentProgress) {
      const validFronts = new Set(payload.cards.map(card => card.front));
      const cleanedMasteredCards = Object.fromEntries(
        Object.entries(currentProgress.masteredCards).filter(([front]) => validFronts.has(front)),
      );

      await updateProgress({
        id: payload.id,
        masteredCards: cleanedMasteredCards,
      });
    }
  };

  const deleteDeck = async (id: string) => {
    if (!import.meta.client) {
      return;
    }

    const db = await useIndexedDb();
    await db.card.find().where('deckId').eq(id).remove();

    const deckDoc = await db.deck.findOne(id).exec();
    if (deckDoc) {
      await deckDoc.remove();
    }
  };

  const copyMarketDeck = async (meta: DeckMeta) => {
    if (!import.meta.client) {
      return null;
    }

    const raw = await $fetch(`/data/decks/${meta.id}.json`);
    const deckDetail = deckDetailSchema.parse(raw);

    await createDeck({
      name: meta.name,
      description: meta.description,
      cards: deckDetail.cards,
    });

    return meta.id;
  };

  return {
    decks,
    pending,
    progress,
    getDeck,
    getAllCardsOfDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    updateProgress,
    exportProgress,
    importProgress,
    copyMarketDeck,
  };
};

export default useMyDecks;

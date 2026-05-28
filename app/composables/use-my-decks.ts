import { BehaviorSubject, from, type Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { computed, onMounted, onUnmounted } from 'vue';

import type { Card, DeckProgress, PartialExcept } from '~/types';
import { deckDetailSchema, deckProgressStorageSchema } from '~/types';
import type { DocTypes } from '~/utils/get-indexed-db';
import getIndexedDb from '~/utils/get-indexed-db';

type DeckDocument = DocTypes['deck'] & { readonly progress: number };
type MarketDeckMeta = Pick<DeckDocument, 'id' | 'name' | 'description'>;

const getDecksState = () => useState<DeckDocument[]>('myDeckDocs', () => []);
const getLoadedState = () => useState<boolean>('myDecksLoaded', () => false);

const useMyDecks = () => {
  const deckDocs = getDecksState();
  const loaded = getLoadedState();

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

  const keywordFilter$ = new BehaviorSubject<string>('');
  const filteredDecks$ = keywordFilter$.pipe(
    switchMap(keyword => (from(getIndexedDb()).pipe(
      switchMap((db) => {
        let selector: object = {};
        if (keyword) {
          const splittedKeywords = keyword.split(' ').filter(k => k.trim() !== '');
          selector = {
            $or: [
              { $and: splittedKeywords.map(k => ({ name: { $regex: `.*${k}.*`, $options: 'i' } })) },
              { $and: splittedKeywords.map(k => ({ description: { $regex: `.*${k}.*`, $options: 'i' } })) },
            ],
          };
        }

        return db.deck.find({ selector }).sort({ createdAt: 'desc' }).$;
      }),
    ))),
  );

  // Subscribe to filteredDecks$ and update deckDocs state
  let dbSubscription: Subscription | null = null;
  onMounted(async () => {
    dbSubscription = filteredDecks$.subscribe((newDocs) => {
      deckDocs.value = newDocs as unknown as DeckDocument[];
      loaded.value = true;
    });
  });
  // Cleanup subscription on unmount
  onUnmounted(() => {
    dbSubscription?.unsubscribe();
  });

  const filterDecks = (keyword: string) => {
    keywordFilter$.next(keyword);
  };

  const getDeck = async (id: string) => {
    const db = await getIndexedDb();
    return await db.deck.findOne(id).exec();
  };

  const getAllCardsOfDeck = async (deckId: string) => {
    const db = await getIndexedDb();
    return await db.card.find().where('deckId').eq(deckId).sort({ order: 'asc' }).exec();
  };

  const writeDeckCards = async (deckId: string, cards: Card[]) => {
    if (cards.length === 0) {
      return;
    }

    const db = await getIndexedDb();
    const deckDoc = await db.deck.findOne(deckId).exec();

    if (!deckDoc) {
      throw new Error(`Provided deckId not found: ${deckId}`);
    }

    await db.card.find().where('deckId').eq(deckId).remove();
    await db.card.bulkInsert(cards.map((card, index) => ({
      id: generateUid(),
      deckId,
      front: card.front,
      back: card.back,
      backSub: card.backSub,
      order: index,
    })));

    await deckDoc.update({
      $set: {
        cardCount: cards.length,
      },
    });
  };

  const updateProgress = onlyClient(async (data: PartialExcept<DeckProgress, 'id'>) => {
    const db = await getIndexedDb();
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
  });

  const exportProgress = () => {
    const runtimeConfig = useRuntimeConfig();

    return {
      version: runtimeConfig.public.databaseSchemaVersion,
      data: Object.values(progress.value),
    };
  };

  const importProgress = onlyClient(async (data: DeckProgress[]) => {
    const validatedProgress = deckProgressStorageSchema.parse(data);

    const db = await getIndexedDb();
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
  });

  const createDeck = onlyClient(async (payload: { name: string; description?: string }) => {
    const db = await getIndexedDb();
    const id = generateUid();

    await db.deck.insert({
      id,
      name: payload.name,
      description: payload.description,
      cardCount: 0,
      masteredCards: {},
      createdAt: new Date().toISOString(),
    });

    return id;
  });

  const updateDeck = onlyClient(async (payload: { id: string; name: string; description?: string }) => {
    const db = await getIndexedDb();
    const deckDoc = await db.deck.findOne(payload.id).exec();
    if (!deckDoc) {
      throw new Error(`Provided id not found: ${payload.id}`);
    }

    await deckDoc.update({
      $set: {
        name: payload.name,
        description: payload.description,
      },
    });
  });

  const deleteDeck = onlyClient(async (id: string) => {
    const db = await getIndexedDb();
    await db.card.find().where('deckId').eq(id).remove();
    await db.deck.findOne(id).remove();
  });

  const copyMarketDeck = onlyClient(async (meta: MarketDeckMeta) => {
    const raw = await $fetch(`/data/decks/${meta.id}.json`);
    const deckDetail = deckDetailSchema.parse(raw);

    const id = await createDeck({
      name: meta.name,
      description: meta.description,
    });

    if (id) {
      await writeDeckCards(id, deckDetail.cards);
    }

    return id;
  });

  return {
    deckDocs,
    pending: computed(() => !getLoadedState().value),
    filterDecks,
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

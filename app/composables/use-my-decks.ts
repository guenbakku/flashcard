import type { RxDocument } from 'rxdb';
import { BehaviorSubject, from, type Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { computed, onMounted, onUnmounted } from 'vue';

import { deckDetailSchema } from '~/types';
import type { DocTypes } from '~/utils/get-indexed-db';

type DeckDoc = DocTypes['deck'] & { readonly progress: number };
type CardDoc = DocTypes['card'];
type AnswerPayload = Pick<CardDoc, 'id' | 'isMastered'>;
type DeckMeta = Pick<DeckDoc, 'id' | 'name' | 'description'>;

const getDecksState = () => useState<RxDocument<DeckDoc>[]>('myDeckDocs', () => []);
const getLoadedState = () => useState<boolean>('myDecksLoaded', () => false);

const useMyDecks = () => {
  const deckDocs = getDecksState();
  const loaded = getLoadedState();

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
      deckDocs.value = newDocs as unknown as RxDocument<DeckDoc>[];
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

  const answer = clientOnly(async (data: AnswerPayload) => {
    const db = await getIndexedDb();

    const cardDoc = await db.card.findOne(data.id).exec();
    if (!cardDoc) {
      throw new Error(`Provided card id not found: ${data.id}`);
    }

    const deckDoc = await db.deck.findOne(cardDoc.deckId).exec();
    if (!deckDoc) {
      throw new Error(`Deck not found: ${cardDoc.deckId}`);
    }

    await cardDoc.update({
      $set: {
        isMastered: data.isMastered,
      },
    });

    const masteredCount = await db.card.count().where({ deckId: deckDoc.id, isMastered: true }).exec();
    await deckDoc.update({
      $set: {
        lastStudied: new Date().toISOString(),
        masteredCount: masteredCount,
      },
    });
  });

  const createDeck = clientOnly(async (payload: { name: string; description?: string }) => {
    const db = await getIndexedDb();
    const id = generateUid();

    const nextDeck = await db.deck.insert({
      id,
      name: payload.name,
      description: payload.description,
      cardCount: 0,
      masteredCount: 0,
      createdAt: new Date().toISOString(),
    });

    return nextDeck;
  });

  const updateDeck = clientOnly(async (payload: { id: string; name: string; description?: string }) => {
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

  const deleteDeck = clientOnly(async (id: string) => {
    const db = await getIndexedDb();
    await db.card.find().where('deckId').eq(id).remove();
    await db.deck.findOne(id).remove();
  });

  const copyMarketDeck = clientOnly(async (meta: DeckMeta) => {
    const raw = await $fetch(`/data/decks/${meta.id}.json`);
    const deckDetail = deckDetailSchema.parse(raw);

    const nextDeck = await createDeck({
      name: meta.name,
      description: meta.description,
    });

    if (nextDeck) {
      const { writeCards } = useCards(nextDeck.id);
      await writeCards(deckDetail.cards);
    }

    return nextDeck;
  });

  return {
    deckDocs,
    pending: computed(() => !getLoadedState().value),
    filterDecks,
    getDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    answer,
    copyMarketDeck,
  };
};

export default useMyDecks;

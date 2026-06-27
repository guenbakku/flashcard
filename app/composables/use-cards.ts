import type { RxDocument } from 'rxdb';
import { BehaviorSubject, from, type Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { _decode } from 'zod/v4/core';

import type { DocTypes } from '~/composables/use-indexed-db';

type CardDocument = DocTypes['card'];
type CardPayload = Pick<CardDocument, 'front' | 'back' | 'backSub'>;

function getCardsState() {
  return useState<RxDocument<CardDocument>[]>('cardDocs', () => []);
}

function getLoadedState() {
  return useState<boolean>('cardsLoaded', () => false);
}

function useCards(deckId: string) {
  const cardDocs = getCardsState();
  const loaded = getLoadedState();
  const { getDb } = useIndexedDb();

  const keywordFilter$ = new BehaviorSubject<string>('');
  const filteredDecks$ = keywordFilter$.pipe(
    switchMap(keyword => (from(getDb()).pipe(
      switchMap((db) => {
        const selector: Record<string, unknown> = {
          deckId,
        };
        if (keyword) {
          const splittedKeywords = keyword.split(' ').filter(k => k.trim() !== '');
          selector.$or = [
            { $and: splittedKeywords.map(k => ({ front: { $regex: `.*${k}.*`, $options: 'i' } })) },
            { $and: splittedKeywords.map(k => ({ back: { $regex: `.*${k}.*`, $options: 'i' } })) },
            { $and: splittedKeywords.map(k => ({ backSub: { $regex: `.*${k}.*`, $options: 'i' } })) },
          ];
        }

        return db.card.find({ selector }).sort({ order: 'asc' }).$;
      }),
    ))),
  );

  // Subscribe to filteredDecks$ and update deckDocs state
  let dbSubscription: Subscription | null = null;
  onMounted(async () => {
    dbSubscription = filteredDecks$.subscribe((newDocs) => {
      cardDocs.value = newDocs;
      loaded.value = true;
    });
  });
  // Cleanup subscription on unmount
  onUnmounted(() => {
    dbSubscription?.unsubscribe();
  });

  const filterCards = (keyword: string) => {
    keywordFilter$.next(keyword);
  };

  const getAllCards = clientOnly(async () => {
    const db = await getDb();
    return db.card.find().where('deckId').eq(deckId).sort({ order: 'asc' }).exec();
  });

  const createCard = clientOnly(async (payload: CardPayload) => {
    const db = await getDb();
    const deckDoc = await db.deck.findOne(deckId).exec();

    if (!deckDoc) {
      throw new Error(`Provided deckId not found: ${deckId}`);
    }

    const totalExistingCards = await db.card.count().where('deckId').eq(deckId).exec();
    const highestOrder = await db.card.findOne().where('deckId').eq(deckId).sort({ order: 'desc' }).exec();
    const nextCard = await db.card.insert({
      id: generateUid(),
      deckId: deckDoc.id,
      front: payload.front.trim(),
      back: payload.back.trim(),
      backSub: payload.backSub?.trim() ?? '',
      order: (highestOrder?.order ?? -1) + 1,
      isMastered: false,
    });

    await deckDoc.update({
      $set: {
        cardCount: totalExistingCards + 1,
      },
    });

    return nextCard;
  });

  const updateCard = clientOnly(async (cardId: string, payload: CardPayload) => {
    const db = await getDb();
    const cardDoc = await db.card.findOne().where({ id: cardId, deckId: deckId }).exec();

    if (!cardDoc) {
      throw new Error(`Card with ID '${cardId}' not found in deck '${deckId}'.`);
    }

    await cardDoc.update({
      $set: {
        front: payload.front.trim(),
        back: payload.back.trim(),
        backSub: payload.backSub?.trim() ?? '',
      },
    });
  });

  const deleteCard = clientOnly(async (cardId: string) => {
    const db = await getDb();
    const cardDoc = await db.card.findOne().where({ id: cardId, deckId: deckId }).exec();
    const deckDoc = await db.deck.findOne(deckId).exec();
    if (!deckDoc || !cardDoc) {
      throw new Error(`Card with ID '${cardId}' not found in deck '${deckId}'.`);
    }

    await cardDoc.remove();

    const totalRemainingCards = await db.card.count().where('deckId').eq(deckId).exec();
    const totalRemainingMasteredCards = await db.card.count().where({ deckId, isMastered: true }).exec();
    await deckDoc.update({
      $set: {
        cardCount: totalRemainingCards,
        masteredCount: totalRemainingMasteredCards,
      },
    });
  });

  const writeCards = clientOnly(async (cards: CardPayload[]) => {
    if (cards.length === 0) {
      return;
    }

    const db = await getDb();
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
      isMastered: false,
    })));

    await deckDoc.update({
      $set: {
        cardCount: cards.length,
      },
    });
  });

  const reorderCards = clientOnly(async (cards: CardDocument[]) => {
    const db = await getDb();

    const invalidCards = cards.filter(card => card.deckId !== deckId);
    if (invalidCards.length > 0) {
      throw new Error(`Some cards do not belong to this deck '${deckId}'`);
    }

    // TODO: re-consider if 'bulkUpsert' match with the meaning of reorder?
    await db.card.bulkUpsert(cards.map((card, index) => ({
      ...card,
      order: index,
    })));
  });

  return {
    cardDocs,
    pending: computed(() => !getLoadedState().value),
    getAllCards,
    filterCards,
    createCard,
    updateCard,
    deleteCard,
    writeCards,
    reorderCards,
  };
};

export default useCards;

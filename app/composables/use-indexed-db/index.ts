import type { ExtractDocTypes, InferRxDatabase } from '~/types';

import cardCollectionFactory from './card.collection';
import deckCollectionFactory from './deck.collection';
import deckProgressCollectionFactory from './deck-progress.collection';
import { getDb } from './utils';

type MyDatabase
  = InferRxDatabase<ReturnType<typeof deckProgressCollectionFactory>>
    & InferRxDatabase<ReturnType<typeof cardCollectionFactory>>
    & InferRxDatabase<ReturnType<typeof deckCollectionFactory>>
    ;

const useIndexedDb = () => getDb<MyDatabase>({
  ...deckCollectionFactory(),
  ...cardCollectionFactory(),
  ...deckProgressCollectionFactory(),
});

export default useIndexedDb;

export type DocTypes = ExtractDocTypes<MyDatabase>;

import { addRxPlugin } from 'rxdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

import type { ExtractDocTypes, InferRxDatabase } from '~/types';

import cardCollectionFactory from './card.collection';
import deckCollectionFactory from './deck.collection';
import deckProgressCollectionFactory from './deck-progress.collection';
import { getDb } from './utils';

addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

export type MyDatabase
  = InferRxDatabase<ReturnType<typeof deckProgressCollectionFactory>>
    & InferRxDatabase<ReturnType<typeof cardCollectionFactory>>
    & InferRxDatabase<ReturnType<typeof deckCollectionFactory>>
    ;

export type DocTypes = ExtractDocTypes<MyDatabase>;

const useIndexedDb = () => getDb<MyDatabase>({
  ...deckCollectionFactory(),
  ...cardCollectionFactory(),
  ...deckProgressCollectionFactory(),
});

export default useIndexedDb;

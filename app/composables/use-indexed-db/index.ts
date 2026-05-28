import { addRxPlugin } from 'rxdb';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

import type { ExtractDocTypes, InferRxDatabase } from '~/types';

import cardCollectionFactory from './card.collection';
import deckCollectionFactory, { hook as deckCollectionHook } from './deck.collection';
import deckProgressCollectionFactory from './deck-progress.collection';
import { getDb } from './utils';

addRxPlugin(RxDBCleanupPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
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

if (import.meta.client) {
  const db = await useIndexedDb();
  deckCollectionHook(db);
}

export default useIndexedDb;

import { addRxPlugin, type RxDatabase } from 'rxdb';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

import type { ExtractDocTypes, InferRxCollection } from '~/types';

import cardCollectionFactory from './collections/card';
import deckCollectionFactory, { hook as deckCollectionHook } from './collections/deck';
import deckProgressCollectionFactory from './collections/deck-progress';
import { initDb } from './helpers';

addRxPlugin(RxDBCleanupPlugin);
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

export type MyDatabase
  = RxDatabase<
    InferRxCollection<ReturnType<typeof deckProgressCollectionFactory>>
    & InferRxCollection<ReturnType<typeof cardCollectionFactory>>
    & InferRxCollection<ReturnType<typeof deckCollectionFactory>>
  >;

export type DocTypes = ExtractDocTypes<MyDatabase>;

const getIndexedDb = () => initDb<MyDatabase>({
  ...deckCollectionFactory(),
  ...cardCollectionFactory(),
  ...deckProgressCollectionFactory(),
});

if (import.meta.client) {
  const db = await getIndexedDb();
  deckCollectionHook(db);
}

export default getIndexedDb;

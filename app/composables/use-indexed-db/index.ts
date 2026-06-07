import { addRxPlugin, type RxDatabase } from 'rxdb';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

import type { ExtractDocTypes, InferRxCollection } from '~/types';

import cardCollectionFactory from './collections/card';
import deckCollectionFactory, { hook as deckCollectionHook } from './collections/deck';
import { initDb, registerGracefulDbClosing } from './helpers';

addRxPlugin(RxDBCleanupPlugin);
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

export type MyDatabase
  = RxDatabase<
    & InferRxCollection<ReturnType<typeof cardCollectionFactory>>
    & InferRxCollection<ReturnType<typeof deckCollectionFactory>>
  >;

export type DocTypes = ExtractDocTypes<MyDatabase>;

const getDb = () => initDb<MyDatabase>(
  {
    ...deckCollectionFactory(),
    ...cardCollectionFactory(),
  },
  [deckCollectionHook],
);

/**
 * Completely empty all collections.
 */
const emptyDb = async () => {
  const db = await getDb();
  await Promise.all(Object.values(db.collections).map(collection => collection.find().remove()));
};

const useIndexedDb = () => ({
  emptyDb,
  getDb,
  registerGracefulDbClosing,
});

export default useIndexedDb;

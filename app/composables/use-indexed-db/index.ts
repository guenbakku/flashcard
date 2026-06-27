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
import { exportJson, importJson, initDb, registerGracefulDbClosing } from './helpers';

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

function getDb() {
  return initDb<MyDatabase>(
    {
      ...deckCollectionFactory(),
      ...cardCollectionFactory(),
    },
    [deckCollectionHook],
  );
}

function useIndexedDb() {
  return {
    getDb,
    exportJson,
    importJson,
    registerGracefulDbClosing,
  };
}

export default useIndexedDb;

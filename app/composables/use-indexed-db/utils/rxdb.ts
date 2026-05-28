/* eslint-disable @typescript-eslint/no-explicit-any */

import type { RxCollectionCreator, RxDatabase } from 'rxdb';

type Collections = Record<string, RxCollectionCreator<any>>;

let _dbInstance: Promise<RxDatabase> | null = null;

export const getDb = async <DatabaseType>(collections: Collections): Promise<DatabaseType> => {
  if (!import.meta.client) {
    throw new Error('Database instance is only available in the browser.');
  }

  if (_dbInstance) {
    return _dbInstance as DatabaseType;
  }

  _dbInstance = (async () => {
    const { createRxDatabase } = await import('rxdb');
    const { getRxStorageDexie } = await import('rxdb/plugins/storage-dexie');

    const db = await createRxDatabase({
      name: 'flashcard_app',
      storage: getRxStorageDexie(),
      closeDuplicates: true,

      /**
       * Cleanup Policy
       * @see https://rxdb.info/cleanup.html#create-a-database-with-cleanup-options
       */
      cleanupPolicy: {
        minimumDeletedTime: 1000 * 60 * 60 * 1 * 1, // one hour,
        minimumCollectionAge: 1000 * 60, // 60 seconds
        runEach: 1000 * 60 * 5, // 5 minutes
        awaitReplicationsInSync: true,
        waitForLeadership: true,
      },
    });

    await db.addCollections(collections as Collections);

    return db;
  })();

  return _dbInstance as DatabaseType;
};

export const closeDb = async () => {
  if (_dbInstance) {
    _dbInstance.then(
      db => db.close().then(_dbInstance = null),
    );
  }
};

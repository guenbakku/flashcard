/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRxDatabase, type RxCollectionCreator, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

type Collections = Record<string, RxCollectionCreator<any>>;

let _dbInstance: Promise<RxDatabase> | null = null;

/**
 * Initializes the RxDB database instance with the provided collections.
 *
 * This function implements a singleton pattern to ensure only one database instance is created.
 */
export async function initDb<DatabaseType = RxDatabase>(
  collections: Collections,
  hooks: Array<(db: DatabaseType) => void> = [],
): Promise<DatabaseType> {
  if (!import.meta.client) {
    throw new Error('Database instance is only available in the browser.');
  }

  if (_dbInstance && !(await _dbInstance).closed) {
    return _dbInstance as DatabaseType;
  }

  _dbInstance = (async () => {
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
    hooks.forEach(hook => hook(db as DatabaseType));

    return db;
  })();

  return _dbInstance as DatabaseType;
};

/**
 * Closes the active database instance to release resources and connections.
 *
 * Once closed, the internal singleton reference is reset to `null`.
 */
export async function closeDb() {
  if (_dbInstance) {
    const db = await _dbInstance;
    if (!db.closed) {
      db.close().then(_dbInstance = null);
    }
  }
};

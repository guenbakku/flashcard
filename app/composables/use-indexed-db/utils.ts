/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollectionCreator, RxDatabase } from 'rxdb';

type Collections = Record<string, RxCollectionCreator<any>>;

let _dbPromise: Promise<RxDatabase> | null = null;

export const collectionFactory = <
  K extends string,
  C extends RxCollectionCreator<any>,
>(
  name: K,
  collectionCreator: C | (() => C),
) => () => {
  type ActualCreator = C extends (...args: any[]) => infer R ? R : C;
  type InferredDocType = ExtractDocumentTypeFromTypedRxJsonSchema<ActualCreator['schema']>;

  return {
    [name]: toValue(collectionCreator),
  } as unknown as { [P in K]: RxCollectionCreator<InferredDocType> };
};

export const getDb = async <DatabaseType>(collections: Collections): Promise<DatabaseType> => {
  if (!import.meta.client) {
    throw new Error('Deck progress database is only available in the browser');
  }

  if (_dbPromise) {
    return _dbPromise as DatabaseType;
  }

  _dbPromise = (async () => {
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

  return _dbPromise as DatabaseType;
};

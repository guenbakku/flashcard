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
      cleanupPolicy: {
        /**
         * The minimum time in milliseconds for how long
         * a document has to be deleted before it is
         * purged by the cleanup.
         * [default=one month]
         */
        minimumDeletedTime: 1000 * 60 * 60 * 24 * 31, // one month,
        /**
         * The minimum amount of time that the RxCollection must have existed.
         * This ensures that at the initial page load, more important
         * tasks are not slowed down because a cleanup process is running.
         * [default=60 seconds]
         */
        minimumCollectionAge: 1000 * 60, // 60 seconds
        /**
         * After the initial cleanup is done,
         * a new cleanup is started after [runEach] milliseconds
         * [default=5 minutes]
         */
        runEach: 1000 * 60 * 5, // 5 minutes
        /**
         * If set to true,
         * RxDB will await all running replications
         * to not have a replication cycle running.
         * This ensures we do not remove deleted documents
         * when they might not have already been replicated.
         * [default=true]
         */
        awaitReplicationsInSync: true,
        /**
         * If true, it will only start the cleanup
         * when the current instance is also the leader.
         * This ensures that when RxDB is used in multiInstance mode,
         * only one instance will start the cleanup.
         * [default=true]
         */
        waitForLeadership: false,
      },
    });

    await db.addCollections(collections as Collections);

    return db;
  })();

  return _dbPromise as DatabaseType;
};

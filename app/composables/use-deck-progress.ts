import { deckProgressStorageSchema, type DeckProgress, type PartialExcept } from '~/types';
import type { RxCollection, RxDatabase, RxDocument } from 'rxdb';
import type { Subscription } from 'rxjs';

type DeckProgressDocType = DeckProgress;

type MyDatabaseCollections = {
  deckprogress: RxCollection<DeckProgressDocType>;
};

type MyDatabase = RxDatabase<MyDatabaseCollections>;

const getProgressState = () => useState<Record<string, DeckProgress>>('deckProgress', () => ({}));
const getLoadedState = () => useState<boolean>('deckProgressLoaded', () => false);

const defaultProgress: DeckProgress = {
  identifier: '',
  lastStudied: null,
  masteredCards: {},
};

const getDeckProgressSchema = () => {
  const { public: { databaseSchemaVersion } } = useRuntimeConfig();

  return {
    title: 'deck-progress schema',
    version: Number(databaseSchemaVersion),
    description: 'Deck progress stored in indexedDB',
    type: 'object',
    primaryKey: 'identifier',
    properties: {
      identifier: {
        type: 'string',
        maxLength: 128,
      },
      lastStudied: {
        anyOf: [
          { type: 'string', format: 'date-time' },
          { type: 'null' },
        ],
      },
      masteredCards: {
        type: 'object',
        additionalProperties: { type: 'boolean' },
      },
    },
    required: ['identifier', 'lastStudied', 'masteredCards'],
  };
};

const transformDocsToProgress = (documents: DeckProgressDocType[]): Record<string, DeckProgress> => {
  return documents.reduce((acc: Record<string, DeckProgress>, document: DeckProgressDocType) => {
    acc[document.identifier] = {...document};
    return acc;
  }, {});
};

let _dbPromise: Promise<MyDatabase> | null = null;

const getDb = async (): Promise<MyDatabase> => {
  if (!import.meta.client) {
    throw new Error('Deck progress database is only available in the browser');
  }

  if (_dbPromise) {
    return _dbPromise;
  }

  _dbPromise = (async () => {
    const { createRxDatabase } = await import('rxdb');
    const { getRxStorageDexie } = await import('rxdb/plugins/storage-dexie');

    const db = await createRxDatabase<MyDatabaseCollections>({
      name: 'flashcard_app',
      storage: getRxStorageDexie(),
      closeDuplicates: true,
    });

    await db.addCollections({
      deckprogress: {
        schema: getDeckProgressSchema(),
      },
    });

    return db;
  })();

  return _dbPromise;
};

const initializeProgress = async () => {
  const loadedState = getLoadedState();
  const progressState = getProgressState();

  if (!import.meta.client || loadedState.value) {
    return;
  }

  const db = await getDb();
  const docs = await db.deckprogress.find().exec();

  progressState.value = transformDocsToProgress(docs);
  loadedState.value = true;
};

const useDeckProgress = () => {
  if (import.meta.client) {
    void initializeProgress();
  }

  const progress = getProgressState();
  const runtimeConfig = useRuntimeConfig();

  const updateProgress = async (data: PartialExcept<DeckProgress, 'identifier'>) => {
    const nextProgress = {
      ...defaultProgress,
      ...(progress.value[data.identifier] ?? {}),
      ...data,
    };

    progress.value = {
      ...progress.value,
      [data.identifier]: nextProgress,
    };

    if (import.meta.client) {
      const db = await getDb();
      await db.deckprogress.upsert({ ...nextProgress });
    }
  };

  const deleteProgress = async (identifier: string) => {
    const { [identifier]: _discard, ...rest } = progress.value;
    progress.value = rest;

    if (import.meta.client) {
      const db = await getDb();
      const doc = await db.deckprogress.findOne(identifier).exec();
      if (doc) {
        await doc.remove();
      }
    }
  };

  const exportProgress = () => ({
    version: runtimeConfig.public.databaseSchemaVersion,
    data: Object.values(toValue(progress)),
  });

  const importProgress = async (data: DeckProgress[]) => {
    const validatedProgress = deckProgressStorageSchema.parse(data);
    progress.value = transformDocsToProgress(validatedProgress);

    if (import.meta.client) {
      const db = await getDb();
      await Promise.all(
        validatedProgress.map((deckProgress) =>
          db.deckprogress.upsert({ ...deckProgress }),
        ),
      );
    }
  };

  /**
   * REAL-TIME RXDB SUBSCRIPTION FOR DECK PROGRESS
   *
   * Purpose:
   * 1. Runs strictly on the browser to prevent SSR errors.
   * 2. Subscribes to real-time database updates from the 'deckprogress' collection.
   * 3. Transforms the raw array of documents into a key-value object mapped by `identifier` for fast lookup.
   * 4. Automatically unsubscribes on unmount to prevent memory leaks.
   */
  if (import.meta.client) {
    let dbSubscription: Subscription | null = null;

    onMounted(async () => {
      const db = await getDb();
      // create an observable query
      const query = db.deckprogress.find();

      // subscribe to the query
      dbSubscription = query.$.subscribe((newDocs: RxDocument<DeckProgressDocType>[]) => {
        progress.value = transformDocsToProgress(newDocs.map(doc => doc.toJSON() as DeckProgressDocType));
      });
    });

    onUnmounted(() => {
      if (dbSubscription) {
        dbSubscription.unsubscribe();
      }
    });
  }

  return {
    progress,
    updateProgress,
    deleteProgress,
    exportProgress,
    importProgress,
  };
};

export default useDeckProgress;

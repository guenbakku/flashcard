import type { RxDocument } from 'rxdb';
import type { Subscription } from 'rxjs';

import { deckProgressStorageSchema, type ExtractDocTypes, type PartialExcept } from '~/types';

type DeckProgress = ExtractDocTypes<Awaited<ReturnType<typeof useIndexedDb>>>['deckprogress'];

const getProgressState = () => useState<Record<string, DeckProgress>>('deckProgress', () => ({}));
const getLoadedState = () => useState<boolean>('deckProgressLoaded', () => false);

const defaultProgress: DeckProgress = {
  identifier: '',
  lastStudied: null,
  masteredCards: {},
};

const transformDocsToProgress = (documents: DeckProgress[]): Record<string, DeckProgress> => {
  return documents.reduce((acc: Record<string, DeckProgress>, document: DeckProgress) => {
    acc[document.identifier] = { ...document };
    return acc;
  }, {});
};

const initializeProgress = async () => {
  const loadedState = getLoadedState();
  const progressState = getProgressState();

  if (!import.meta.client || loadedState.value) {
    return;
  }

  const db = await useIndexedDb();
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
      const db = await useIndexedDb();
      await db.deckprogress.upsert({ ...nextProgress });
    }
  };

  const deleteProgress = async (identifier: string) => {
    const { [identifier]: _discard, ...rest } = progress.value;
    progress.value = rest;

    if (import.meta.client) {
      const db = await useIndexedDb();
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
      const db = await useIndexedDb();
      await Promise.all(
        validatedProgress.map(deckProgress =>
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
      const db = await useIndexedDb();
      // create an observable query
      const query = db.deckprogress.find();

      // subscribe to the query
      dbSubscription = query.$.subscribe((newDocs: RxDocument<DeckProgress>[]) => {
        progress.value = transformDocsToProgress(newDocs.map(doc => doc.toJSON() as DeckProgress));
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

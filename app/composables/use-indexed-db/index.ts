import type { ExtractDocTypes, InferRxDatabase } from '~/types';

import deckProgressCollectionFactory from './deck-progress.collection';
import { getDb } from './utils';

type MyDatabase = InferRxDatabase<ReturnType<typeof deckProgressCollectionFactory>>;

const useIndexedDb = () => getDb<MyDatabase>({
  ...deckProgressCollectionFactory(),
});

export default useIndexedDb;

export type DocTypes = ExtractDocTypes<MyDatabase>;

import type { RxCollection, RxCollectionCreator } from 'rxdb';
import { z } from 'zod';

export const cardSchema = z.object({
  front: z.string(),
  back: z.string(),
  backSub: z.string().optional(),
});

export const deckMetaSchema = z.object({
  identifier: z.string(),
  name: z.string(),
  description: z.string(),
  cardCount: z.number(),
});

export const deckProgressSchema = z.object({
  identifier: z.string(),
  lastStudied: z.iso.datetime().nullable(),
  masteredCards: z.record(z.string(), z.boolean()),
});

export const deckProgressStorageSchema = z.array(deckProgressSchema);

export const deckDetailSchema = z.object({
  cards: z.array(cardSchema),
});

export type Card = z.infer<typeof cardSchema>;

export type DeckMeta = z.infer<typeof deckMetaSchema>;
export type DeckDetail = z.infer<typeof deckDetailSchema>;
export type DeckProgress = z.infer<typeof deckProgressSchema>;

export type Deck = DeckMeta & DeckProgress & {
  progress: number;
};

/**
 * ----------------------------------------------------------------------------
 * Definitions of utility types used across the app
 * ----------------------------------------------------------------------------
 */

export type PartialExcept<T, K extends keyof T> = Omit<Partial<T>, K> & Pick<T, K>;

/**
 * Utility Type to automatically convert a Collection Factory Result structure into its corresponding RxDatabase structure.
 *
 * @template T - The return type of the factory execution (e.g., { deckprogress: RxCollectionCreator<DocType> })
 */
export type InferRxDatabase<T> = {
  [P in keyof T]: T[P] extends RxCollectionCreator<infer D>
    ? RxCollection<D>
    : T[P] extends () => RxCollectionCreator<infer D> // Handles cases where the creator is wrapped in a function
      ? RxCollection<D>
      : never;
};

/**
 * Utility Type to extract the raw DocType from an RxDatabase/Collection structure.
 * * @template T - The database collection object structure (e.g., { deckprogress: RxCollection<DocType> })
 */
export type ExtractDocTypes<T> = {
  [P in keyof T]: T[P] extends RxCollection<infer D>
    ? D
    : never;
};

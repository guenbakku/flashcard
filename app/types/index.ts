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
  lastStudied: z.iso.datetime().nullable(),
  masteredCards: z.record(z.string(), z.boolean()),
});

export const deckProgressStorageSchema = z.record(
  z.string(),
  deckProgressSchema,
);

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

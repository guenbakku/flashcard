import * as z from 'zod';

export const deckMetaSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Đây là trường bắt buộc')
    .max(128, 'Nội dung không được vượt quá 128 ký tự'),
  description: z.string()
    .trim()
    .max(128, 'Nội dung không được vượt quá 128 ký tự')
    .optional(),
});

export type DeckMeta = z.output<typeof deckMetaSchema>;

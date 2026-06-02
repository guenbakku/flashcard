import { z } from 'zod';

export const cardSchema = z.object({
  front: z.string().trim().min(1, 'Đây là trường bắt buộc'),
  back: z.string().trim().min(1, 'Đây là trường bắt buộc'),
  backSub: z.string().trim().max(128, 'Nội dung không được vượt quá 128 ký tự').optional(),
});

export type Card = z.output<typeof cardSchema>;

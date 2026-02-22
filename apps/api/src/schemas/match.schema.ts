import { z } from 'zod';

/**
 * Match request schema.
 *
 * Uses z.coerce.number() for numeric fields so the schema accepts both:
 *   • Number values from JSON body  (e.g. { "year": 2024 })
 *   • String values from URL query  (e.g. ?year=2024)
 *
 * This is required because URL query string parameters are always strings,
 * while JSON body parameters are already parsed to their native types.
 */
export const MatchRequestSchema = z.object({
  title: z.string().min(1, 'title is required'),
  year:  z.coerce.number().int().optional(),
  type:  z.coerce.number().int().optional(),
});

export type MatchRequestInput = z.infer<typeof MatchRequestSchema>;

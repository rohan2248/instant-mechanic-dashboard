import { z } from 'zod';

/** Every `:id` in this API is a positive autoincrement integer arriving as a string. */
export const idParams = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * A repeatable query parameter. Express gives `?status=A` as a string and
 * `?status=A&status=B` as an array; this normalises both to an array so filter
 * schemas do not each have to handle the single-value case.
 */
export function csvArray<T extends z.ZodType>(item: T) {
  return z.preprocess((value) => {
    if (value === undefined) return undefined;
    const list = Array.isArray(value) ? value : [value];
    return list.flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : entry));
  }, z.array(item));
}

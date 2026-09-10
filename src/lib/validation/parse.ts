import { z } from "zod";

/** Trust-boundary pattern. Feature schemas belong in later phases. */
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

export const uuidSchema = z.string().uuid();

import { z } from "zod";

/**
 * Helper function to properly type Zod parse results
 */
export function parseAndType<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data) as z.infer<T>;
}


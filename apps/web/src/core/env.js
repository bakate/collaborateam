import { z } from "zod";

/**
 * Zod schema to validate Vite environment variables.
 */
const schema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:3000/api"),
});

// Vite exposes all the variables through import.meta.env
const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2),
  );
  // Do not exit in browser, just fallback to defaults if possible
}

export const env = parsed.data || {
  VITE_API_URL: "http://localhost:3000/api"
};

import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from the monorepo root
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const schema = z.object({
  NODE_ENV: z
    .enum(["production", "development", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("3000"),

  DATABASE_URL: z.string().optional(),
  PGHOST: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGPORT: z.string().default("5432"),
  PGSSLMODE: z.string().default("disable"),
  PGCHANNELBINDING: z.string().optional(),

  // App specific
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  LOG_LEVEL: z.enum(["info", "debug", "warn", "error"]).default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2),
  );
  process.exit(1);
}

/**
 * Validated environment variables with runtime type safety.
 */
export const env = parsed.data;

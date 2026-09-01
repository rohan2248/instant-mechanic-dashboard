import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Resolved against this file, not process.cwd(): the API must load its own .env
// whether it is started from the package directory, the workspace root, or a
// process manager on the server.
loadDotenv({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

// Parsed once at import time. A misconfigured deploy fails at boot with a clear
// message instead of throwing on the first request that happens to need a value.
const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().min(1).default('*'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = z.flattenError(parsed.error).fieldErrors;
  console.error('Invalid environment configuration:');
  for (const [key, messages] of Object.entries(issues)) {
    console.error(`  ${key}: ${messages?.join(', ')}`);
  }
  console.error('\nCopy apps/api/.env.example to apps/api/.env and fill it in.');
  process.exit(1);
}

export const env = Object.freeze(parsed.data);

export const isProduction = env.NODE_ENV === 'production';

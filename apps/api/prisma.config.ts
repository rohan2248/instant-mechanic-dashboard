import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Used by migrate / introspect only. The runtime client connects through
    // the driver adapter in src/db.ts.
    url: env('DATABASE_URL'),
  },
  migrations: {
    // Runs after `prisma migrate reset`, so a full rebuild is one command.
    seed: 'tsx prisma/seed.ts',
  },
});

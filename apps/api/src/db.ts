import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './config/env';
import { PrismaClient } from './generated/prisma/client';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// One client per process. Prisma holds a connection pool, so constructing more
// than one exhausts the database's connection limit under any real load.
export const prisma = new PrismaClient({ adapter });

import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db';

const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

// Drain in-flight requests and release the connection pool before exiting, so a
// PM2 or systemd restart does not leave sockets open against Neon.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

import app from './app.js';
import env from './configs/env.js';
import { prisma } from './lib/prisma.js';
import logger from './lib/logger.js';
import './emails/worker.js';

const PORT = env.PORT;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to the database successfully.');
    app.listen(PORT, () => {
      logger.info({ port: PORT }, `Server is running on port ${PORT}`);
    });
  } catch (e) {
    logger.error({ err: e }, 'Error starting server');
    prisma.$disconnect();
    process.exit(1);
  }
};

startServer();


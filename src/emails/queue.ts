import { Queue, type QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import logger from '../lib/logger.js';
import type { EmailJob } from './emailTypes.js';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is missing.');
}

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 1000 },
  },
};

const emailQueue = new Queue<EmailJob>('email', queueOptions);

emailQueue.on('error', (error) => {
  logger.error({ err: error }, 'BullMQ Queue Error');
});

export default emailQueue;


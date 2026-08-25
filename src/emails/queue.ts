import { Queue, type QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import logger from '../lib/logger.js';
import type { EmailJob } from './emailTypes.js';

// The Redis URL is required before BullMQ can connect to the backing data store.
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  // A missing Redis URL should fail fast so the application does not create a broken queue.
  throw new Error('REDIS_URL environment variable is missing.');
}

// This shared connection is reused by the queue and worker so they talk to the same Redis instance.
export const connection = new Redis(redisUrl, {
  // BullMQ is allowed to retry Redis requests without cutting off the queue if Redis is briefly unavailable.
  maxRetriesPerRequest: null,
  // This avoids the connection waiting on a ready check before processing jobs.
  enableReadyCheck: false,
});

// The queue options control retry behavior, job retention, and the connection used by the queue.
const queueOptions: QueueOptions = {
  // Reuse the Redis instance for all queue operations.
  connection,
  // These defaults are the first production-friendly retry and cleanup settings for email jobs.
  defaultJobOptions: {
    // Retry a failed email job up to three times before it is considered permanently failed.
    attempts: 3,
    // Wait longer between retries using exponential backoff to reduce load when Resend is unstable.
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    // Keep a small number of successful jobs so debugging is easy without filling Redis forever.
    removeOnComplete: { count: 100 },
    // Keep a larger number of failed jobs for investigation and retry analysis.
    removeOnFail: { count: 1000 },
  },
};

// The email queue is the single queue responsible for all transactional emails in the app.
const emailQueue = new Queue<EmailJob>('email', queueOptions);

// Any queue-level errors should be logged immediately so the system does not fail quietly.
emailQueue.on('error', (error) => {
  // Log the queue error with the underlying exception object for debugging in production.
  logger.error({ err: error }, 'BullMQ Queue Error');
});

// Export the queue so the application layer can add email jobs without knowing the queue internals.
export default emailQueue;


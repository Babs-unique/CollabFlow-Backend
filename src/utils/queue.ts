import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is missing.');
}
const connection = new Redis(redisUrl, {
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

const emailQueue = new Queue('email', queueOptions);

// 5. Global error handling for the queue instance
emailQueue.on('error', (error) => {
  console.error(`BullMQ Queue Error: ${error.message}`);
});

export default emailQueue;

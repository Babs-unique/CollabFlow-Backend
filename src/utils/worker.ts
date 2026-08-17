import { Worker } from 'bullmq';
import emailQueue from './queue.js';

const worker = new Worker('email', async (job) => {

});
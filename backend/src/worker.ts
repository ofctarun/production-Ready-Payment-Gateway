import { Worker } from 'bullmq';
import { workerConnection } from './config/redis';
import { processPayment } from './jobs/processPayment';
// import { deliverWebhook } from './jobs/deliverWebhook';
// import { processRefund } from './jobs/processRefund';

console.log('Starting Worker Service...');

const paymentWorker = new Worker('payment-queue', processPayment, { connection: workerConnection });
// const webhookWorker = new Worker('webhook-queue', deliverWebhook, { connection: workerConnection });
const refundWorker = new Worker('refund-queue', processRefund, { connection: workerConnection });
const webhookWorker = new Worker('webhook-queue', deliverWebhook, { connection: workerConnection });

paymentWorker.on('completed', job => console.log(`Payment Job ${job.id} completed`));
paymentWorker.on('failed', (job, err) => console.log(`Payment Job ${job?.id} failed: ${err.message}`));

webhookWorker.on('completed', job => console.log(`Webhook Job ${job.id} completed`));
webhookWorker.on('failed', (job, err) => console.log(`Webhook Job ${job?.id} failed: ${err.message}`));

refundWorker.on('completed', job => console.log(`Refund Job ${job.id} completed`));
refundWorker.on('failed', (job, err) => console.log(`Refund Job ${job?.id} failed: ${err.message}`));

import { Job } from 'bullmq';
import { query } from '../config/db';
import { workerConnection } from '../config/redis';
import { Queue } from 'bullmq';
import { TEST_MODE } from '../utils';

const webhookQueue = new Queue('webhook-queue', { connection: workerConnection });

export const processPayment = async (job: Job) => {
  const { paymentId } = job.data;
  console.log(`Processing payment ${paymentId}`);

  try {
    // Fetch payment
    const paymentResult = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    if (paymentResult.rows.length === 0) {
      throw new Error(`Payment ${paymentId} not found`);
    }
    const payment = paymentResult.rows[0];

    // Simulate Processing Delay
    let delay = 1000;
    if (TEST_MODE) {
        delay = process.env.TEST_PROCESSING_DELAY ? parseInt(process.env.TEST_PROCESSING_DELAY) : 1000;
    } else {
        delay = Math.floor(Math.random() * 5000) + 5000;
    }
    
    await new Promise(r => setTimeout(r, delay));

    // Determine Outcome
    let success = true;
    if (TEST_MODE) {
       // Default to true if not set
       success = process.env.TEST_PAYMENT_SUCCESS !== 'false';
    } else {
        const threshold = payment.method === 'upi' ? 0.90 : 0.95;
        success = Math.random() < threshold;
    }

    const status = success ? 'success' : 'failed';
    const errorCode = success ? null : 'PAYMENT_FAILED';
    const errorDesc = success ? null : 'Payment processing failed';

    // Update DB
    await query(
      'UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = NOW() WHERE id = $4',
      [status, errorCode, errorDesc, paymentId]
    );

    // Enqueue Webhook
    const event = success ? 'payment.success' : 'payment.failed';
    await webhookQueue.add('deliver-webhook', {
      merchantId: payment.merchant_id,
      event,
      payload: {
        event,
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          payment: {
            ...payment,
            status,
            error_code: errorCode,
            error_description: errorDesc
          }
        }
      }
    });

  } catch (error) {
    console.error(`Error processing payment ${paymentId}:`, error);
    throw error;
  }
};

import { Job } from 'bullmq';
import { query } from '../config/db';
import { workerConnection } from '../config/redis';
import { Queue } from 'bullmq';
import { TEST_MODE } from '../utils';

const webhookQueue = new Queue('webhook-queue', { connection: workerConnection });

export const processRefund = async (job: Job) => {
  const { refundId } = job.data;
  console.log(`Processing refund ${refundId}`);

  try {
    const refundRes = await query('SELECT * FROM refunds WHERE id = $1', [refundId]);
    if (refundRes.rows.length === 0) return;
    const refund = refundRes.rows[0];

    // Verify Refundable State (Double check inside worker for safety)
    const paymentRes = await query('SELECT * FROM payments WHERE id = $1', [refund.payment_id]);
    const payment = paymentRes.rows[0];

    if (payment.status !== 'success') {
        // Should not happen if API validation works, but good safety
        console.error('Cannot refund failed payment');
        return;
    }

    // Simulate Delay
    const delay = TEST_MODE ? 1000 : Math.floor(Math.random() * 2000) + 3000;
    await new Promise(r => setTimeout(r, delay));

    // Update Status
    await query(
        'UPDATE refunds SET status = $1, processed_at = NOW() WHERE id = $2',
        ['processed', refundId]
    );

    // Enqueue Webhook
    await webhookQueue.add('deliver-webhook', {
        merchantId: refund.merchant_id,
        event: 'refund.processed',
        payload: {
            event: 'refund.processed',
            timestamp: Math.floor(Date.now() / 1000),
            data: {
                refund: {
                    ...refund,
                    status: 'processed'
                }
            }
        }
    });

  } catch (error) {
    console.error(`Error processing refund ${refundId}:`, error);
    throw error;
  }
};

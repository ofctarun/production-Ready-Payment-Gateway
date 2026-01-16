import { Job } from 'bullmq';
import { query } from '../config/db';
import { generateSignature, WEBHOOK_RETRY_TEST } from '../utils';
import axios from 'axios';
import { workerConnection } from '../config/redis';
import { Queue } from 'bullmq';

const webhookQueue = new Queue('webhook-queue', { connection: workerConnection });

export const deliverWebhook = async (job: Job) => {
  const { merchantId, event, payload, attempt = 1, webhookLogId } = job.data;
  console.log(`Delivering webhook ${event} to merchant ${merchantId} (Attempt ${attempt})`);

  let logId = webhookLogId;

  try {
    // 1. Fetch Merchant
    const merchantRes = await query('SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1', [merchantId]);
    const merchant = merchantRes.rows[0];

    if (!merchant || !merchant.webhook_url) {
        console.log('No webhook URL configured, skipping');
        return;
    }

    // 2. Create Log if not exists (first attempt)
    if (!logId) {
        const logRes = await query(
            'INSERT INTO webhook_logs (merchant_id, event, payload, status, attempts) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [merchantId, event, JSON.stringify(payload), 'pending', 0]
        );
        logId = logRes.rows[0].id;
    }

    // 3. Prepare Request
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, merchant.webhook_secret);
    
    // 4. Send Request
    let responseCode = 0;
    let responseBody = '';
    let success = false;

    try {
        const res = await axios.post(merchant.webhook_url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature
            },
            timeout: 5000
        });
        responseCode = res.status;
        responseBody = JSON.stringify(res.data).substring(0, 1000); // Truncate
        success = responseCode >= 200 && responseCode < 300;
    } catch (err: any) {
        if (err.response) {
            responseCode = err.response.status;
            responseBody = JSON.stringify(err.response.data).substring(0, 1000);
        } else {
            responseBody = err.message;
        }
    }

    // 5. Update Log
    const status = success ? 'success' : 'pending'; // Remain pending if failed and retrying
    await query(
        'UPDATE webhook_logs SET status = $1, response_code = $2, response_body = $3, attempts = attempts + 1, last_attempt_at = NOW() WHERE id = $4',
        [success ? 'success' : (attempt >= 5 ? 'failed' : 'pending'), responseCode, responseBody, logId]
    );

    // 6. Handle Retry
    if (!success) {
        if (attempt < 5) {
            // Calculate delay
            const delays = WEBHOOK_RETRY_TEST 
                ? [0, 5000, 10000, 15000, 20000] // Test intervals (ms) - wait, Attempt 1 is immediate(0), so next is index attempt?
                // Logic: Attempt 1 failed. Next is Attempt 2.
                // Test Intervals: Attempt 2(+5s), Attempt 3(+10s)...
                // Production: 1min, 5min, 30min, 2hr
                : [0, 60000, 300000, 1800000, 7200000];

            const delay = delays[attempt]; // attempt 1 -> index 1
            
            const nextRetryAt = new Date(Date.now() + delay);
            await query('UPDATE webhook_logs SET next_retry_at = $1 WHERE id = $2', [nextRetryAt, logId]);

            console.log(`Scheduling retry ${attempt + 1} in ${delay}ms`);
            
            await webhookQueue.add('deliver-webhook', {
                ...job.data,
                attempt: attempt + 1,
                webhookLogId: logId
            }, { delay });
        } else {
             console.log(`Webhook failed after 5 attempts`);
        }
    }

  } catch (error) {
    console.error('Error in deliverWebhook:', error);
    throw error;
  }
};

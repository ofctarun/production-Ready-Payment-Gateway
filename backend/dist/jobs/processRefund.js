"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRefund = void 0;
const db_1 = require("../config/db");
const redis_1 = require("../config/redis");
const bullmq_1 = require("bullmq");
const utils_1 = require("../utils");
const webhookQueue = new bullmq_1.Queue('webhook-queue', { connection: redis_1.workerConnection });
const processRefund = async (job) => {
    const { refundId } = job.data;
    console.log(`Processing refund ${refundId}`);
    try {
        const refundRes = await (0, db_1.query)('SELECT * FROM refunds WHERE id = $1', [refundId]);
        if (refundRes.rows.length === 0)
            return;
        const refund = refundRes.rows[0];
        // Verify Refundable State (Double check inside worker for safety)
        const paymentRes = await (0, db_1.query)('SELECT * FROM payments WHERE id = $1', [refund.payment_id]);
        const payment = paymentRes.rows[0];
        if (payment.status !== 'success') {
            // Should not happen if API validation works, but good safety
            console.error('Cannot refund failed payment');
            return;
        }
        // Simulate Delay
        const delay = utils_1.TEST_MODE ? 1000 : Math.floor(Math.random() * 2000) + 3000;
        await new Promise(r => setTimeout(r, delay));
        // Update Status
        await (0, db_1.query)('UPDATE refunds SET status = $1, processed_at = NOW() WHERE id = $2', ['processed', refundId]);
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
    }
    catch (error) {
        console.error(`Error processing refund ${refundId}:`, error);
        throw error;
    }
};
exports.processRefund = processRefund;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPayment = void 0;
const db_1 = require("../config/db");
const redis_1 = require("../config/redis");
const bullmq_1 = require("bullmq");
const utils_1 = require("../utils");
const webhookQueue = new bullmq_1.Queue('webhook-queue', { connection: redis_1.workerConnection });
const processPayment = async (job) => {
    const { paymentId } = job.data;
    console.log(`Processing payment ${paymentId}`);
    try {
        // Fetch payment
        const paymentResult = await (0, db_1.query)('SELECT * FROM payments WHERE id = $1', [paymentId]);
        if (paymentResult.rows.length === 0) {
            throw new Error(`Payment ${paymentId} not found`);
        }
        const payment = paymentResult.rows[0];
        // Simulate Processing Delay
        let delay = 1000;
        if (utils_1.TEST_MODE) {
            delay = process.env.TEST_PROCESSING_DELAY ? parseInt(process.env.TEST_PROCESSING_DELAY) : 1000;
        }
        else {
            delay = Math.floor(Math.random() * 5000) + 5000;
        }
        await new Promise(r => setTimeout(r, delay));
        // Determine Outcome
        let success = true;
        if (utils_1.TEST_MODE) {
            // Default to true if not set
            success = process.env.TEST_PAYMENT_SUCCESS !== 'false';
        }
        else {
            const threshold = payment.method === 'upi' ? 0.90 : 0.95;
            success = Math.random() < threshold;
        }
        const status = success ? 'success' : 'failed';
        const errorCode = success ? null : 'PAYMENT_FAILED';
        const errorDesc = success ? null : 'Payment processing failed';
        // Update DB
        await (0, db_1.query)('UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = NOW() WHERE id = $4', [status, errorCode, errorDesc, paymentId]);
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
    }
    catch (error) {
        console.error(`Error processing payment ${paymentId}:`, error);
        throw error;
    }
};
exports.processPayment = processPayment;

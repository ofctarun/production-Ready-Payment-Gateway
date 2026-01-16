"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWebhook = exports.getWebhooks = void 0;
const db_1 = require("../config/db");
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const webhookQueue = new bullmq_1.Queue('webhook-queue', { connection: redis_1.redisConnection });
const getWebhooks = async (req, res) => {
    const merchantId = req.merchant.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const logsRes = await (0, db_1.query)('SELECT * FROM webhook_logs WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [merchantId, limit, offset]);
    const countRes = await (0, db_1.query)('SELECT COUNT(*) FROM webhook_logs WHERE merchant_id = $1', [merchantId]);
    res.json({
        data: logsRes.rows,
        total: parseInt(countRes.rows[0].count),
        limit,
        offset
    });
};
exports.getWebhooks = getWebhooks;
const retryWebhook = async (req, res) => {
    const { webhookId } = req.params;
    const merchantId = req.merchant.id;
    const logRes = await (0, db_1.query)('SELECT * FROM webhook_logs WHERE id = $1 AND merchant_id = $2', [webhookId, merchantId]);
    if (logRes.rows.length === 0)
        return res.status(404).json({ error: 'Webhook log not found' });
    const log = logRes.rows[0];
    // Reset status and Attempts? Requirement says "Reset attempts to 0".
    // "Reset attempts to 0, set status to 'pending', enqueue DeliverWebhookJob."
    await (0, db_1.query)('UPDATE webhook_logs SET status = $1, attempts = 0 WHERE id = $2', ['pending', webhookId]);
    await webhookQueue.add('deliver-webhook', {
        merchantId,
        event: log.event,
        payload: log.payload,
        webhookLogId: webhookId,
        attempt: 1
    });
    res.json({
        id: webhookId,
        status: 'pending',
        message: 'Webhook retry scheduled'
    });
};
exports.retryWebhook = retryWebhook;

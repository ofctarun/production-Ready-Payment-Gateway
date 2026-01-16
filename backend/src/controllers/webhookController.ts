import { Request, Response } from 'express';
import { query } from '../config/db';
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { AuthRequest } from '../middlewares/auth';

const webhookQueue = new Queue('webhook-queue', { connection: redisConnection });

export const getWebhooks = async (req: AuthRequest, res: Response) => {
  const merchantId = req.merchant.id;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  const logsRes = await query(
    'SELECT * FROM webhook_logs WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [merchantId, limit, offset]
  );
  
  const countRes = await query('SELECT COUNT(*) FROM webhook_logs WHERE merchant_id = $1', [merchantId]);
  
  res.json({
      data: logsRes.rows,
      total: parseInt(countRes.rows[0].count),
      limit,
      offset
  });
};

export const retryWebhook = async (req: AuthRequest, res: Response) => {
  const { webhookId } = req.params;
  const merchantId = req.merchant.id;

  const logRes = await query('SELECT * FROM webhook_logs WHERE id = $1 AND merchant_id = $2', [webhookId, merchantId]);
  if (logRes.rows.length === 0) return res.status(404).json({ error: 'Webhook log not found' });
  
  const log = logRes.rows[0];

  // Reset status and Attempts? Requirement says "Reset attempts to 0".
  // "Reset attempts to 0, set status to 'pending', enqueue DeliverWebhookJob."
  
  await query('UPDATE webhook_logs SET status = $1, attempts = 0 WHERE id = $2', ['pending', webhookId]);

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

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { query } from '../config/db';
import { AuthRequest } from '../middlewares/auth';

const paymentQueue = new Queue('payment-queue', { connection: redisConnection });
// const refundQueue = new Queue('refund-queue', { connection: redisConnection });

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { order_id, amount, currency, method, vpa } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const merchantId = req.merchant.id;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const keyRes = await query(
        'SELECT * FROM idempotency_keys WHERE key = $1 AND merchant_id = $2',
        [idempotencyKey, merchantId]
      );
      if (keyRes.rows.length > 0) {
        const keyRecord = keyRes.rows[0];
        if (new Date() < new Date(keyRecord.expires_at)) {
          return res.status(201).json(keyRecord.response);
        } else {
          // Expired, delete and continue
          await query('DELETE FROM idempotency_keys WHERE key = $1 AND merchant_id = $2', [idempotencyKey, merchantId]);
        }
      }
    }

    // 2. Validate
    if (!amount || !currency || !method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 3. Create Payment (Pending)
    const paymentId = `pay_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const now = new Date();

    const payment = {
      id: paymentId,
      order_id,
      amount,
      currency,
      method,
      vpa,
      status: 'pending',
      created_at: now
    };

    await query(
      'INSERT INTO payments (id, merchant_id, order_id, amount, currency, method, vpa, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [payment.id, merchantId, payment.order_id, payment.amount, payment.currency, payment.method, payment.vpa, payment.status, payment.created_at]
    );

    // 4. Enqueue Job
    await paymentQueue.add('process-payment', { paymentId });

    // 5. Store Idempotency & Return
    const response = payment;

    if (idempotencyKey) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr
      await query(
        'INSERT INTO idempotency_keys (key, merchant_id, response, expires_at) VALUES ($1, $2, $3, $4)',
        [idempotencyKey, merchantId, response, expiresAt]
      );
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Create Payment Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

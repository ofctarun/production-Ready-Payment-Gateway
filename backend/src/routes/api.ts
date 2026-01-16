import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { createPayment, capturePayment, createRefund, getRefund } from '../controllers/paymentController';
import { getWebhooks, retryWebhook } from '../controllers/webhookController';
import { getJobStatus } from '../controllers/testController';

const router = Router();

// Test Endpoints (No Auth)
router.get('/test/jobs/status', getJobStatus);

// Authenticated Endpoints
router.post('/payments', authenticate, createPayment);
router.post('/payments/:paymentId/capture', authenticate, capturePayment);
router.post('/payments/:paymentId/refunds', authenticate, createRefund);
router.get('/refunds/:refundId', authenticate, getRefund);
router.get('/webhooks', authenticate, getWebhooks);
router.post('/webhooks/:webhookId/retry', authenticate, retryWebhook);

export default router;

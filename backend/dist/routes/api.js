"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const paymentController_1 = require("../controllers/paymentController");
const webhookController_1 = require("../controllers/webhookController");
const testController_1 = require("../controllers/testController");
const router = (0, express_1.Router)();
// Test Endpoints (No Auth)
router.get('/test/jobs/status', testController_1.getJobStatus);
// Authenticated Endpoints
router.post('/payments', auth_1.authenticate, paymentController_1.createPayment);
router.post('/payments/:paymentId/capture', auth_1.authenticate, paymentController_1.capturePayment);
router.post('/payments/:paymentId/refunds', auth_1.authenticate, paymentController_1.createRefund);
router.get('/refunds/:refundId', auth_1.authenticate, paymentController_1.getRefund);
router.get('/webhooks', auth_1.authenticate, webhookController_1.getWebhooks);
router.post('/webhooks/:webhookId/retry', auth_1.authenticate, webhookController_1.retryWebhook);
exports.default = router;

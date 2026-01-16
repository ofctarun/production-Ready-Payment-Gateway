"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBHOOK_RETRY_TEST = exports.TEST_MODE = exports.generateSignature = exports.sleep = void 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const generateSignature = (payload, secret) => {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};
exports.generateSignature = generateSignature;
exports.TEST_MODE = process.env.TEST_MODE === 'true';
exports.WEBHOOK_RETRY_TEST = process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true';

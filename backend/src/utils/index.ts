export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateSignature = (payload: string, secret: string): string => {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

export const TEST_MODE = process.env.TEST_MODE === 'true';
export const WEBHOOK_RETRY_TEST = process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true';

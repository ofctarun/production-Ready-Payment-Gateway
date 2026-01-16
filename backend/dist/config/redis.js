"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerConnection = exports.redisConnection = void 0;
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
exports.redisConnection = new ioredis_1.Redis(redisUrl, {
    maxRetriesPerRequest: null,
});
exports.workerConnection = new ioredis_1.Redis(redisUrl, {
    maxRetriesPerRequest: null,
});
console.log(`Redis connected to ${redisUrl}`);

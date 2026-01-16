# Payment Gateway Project

This project simulates a payment gateway with a backend API, a merchant dashboard, and an embedded checkout widget.

## Project Structure

```text
payment-gatewayy/
├── backend/                # Node.js/Express API & Worker
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   └── package.json
├── checkout-widget/        # React Checkout Widget
│   ├── src/
│   ├── webpack.config.js
│   └── package.json
├── dashboard/              # React Merchant Dashboard
│   ├── public/
│   ├── src/
│   └── package.json
├── database/               # Database initialization
│   └── init.sql
├── docker-compose.yml
└── README.md
```

## Service Details

| Service      | Container Name   | Port (Host:Internal) | Description                                                       |
| :----------- | :--------------- | :------------------- | :---------------------------------------------------------------- |
| **postgres** | `payment_db`     | `5432:5432`          | PostgreSQL database for storing transactions and user data.       |
| **redis**    | `redis_gateway`  | `6379:6379`          | Redis instance for job queues (BullMQ) and caching.               |
| **api**      | `payment_api`    | `8000:8000`          | Main backend API service.                                         |
| **worker**   | `gateway_worker` | N/A                  | Background worker for processing async payment jobs and webhooks. |
| **checkout** | `checkout_cdn`   | `3001:3001`          | Serves the checkout widget static files.                          |

## Environment Variables

These variables are configured in `docker-compose.yml` for the `api` and `worker` services.

| Variable                       | Default Value        | Description                                                      |
| :----------------------------- | :------------------- | :--------------------------------------------------------------- |
| `NODE_ENV`                     | `development`        | Environment mode (development/production).                       |
| `PORT`                         | `8000`               | Port the API server listens on.                                  |
| `DATABASE_URL`                 | `postgresql://...`   | Connection string for PostgreSQL.                                |
| `REDIS_URL`                    | `redis://redis:6379` | Connection string for Redis.                                     |
| `TEST_MODE`                    | `"true"`             | Enables specific behaviors for testing (e.g., simulated delays). |
| `WEBHOOK_RETRY_INTERVALS_TEST` | `"true"`             | Uses shorter retry intervals for easier testing of webhooks.     |

## API Reference

Base URL: `http://localhost:8000/api/v1`

### Authentication

All API requests must include the following headers:

- `x-api-key`: Your API Key
- `x-api-secret`: Your API Secret

### Payments

#### Create Payment

`POST /payments`

Creates a new payment intent.

**Request Body:**

```json
{
  "amount": 1000,
  "currency": "INR",
  "method": "card", // or "upi"
  "order_id": "order_12345",
  "vpa": "test@upi" // required if method is "upi"
}
```

**Response:**

```json
{
  "id": "pay_12345...",
  "status": "pending",
  ...
}
```

#### Capture Payment

`POST /payments/:id/capture`

Captures a successful payment.

**Response:**

```json
{
  "id": "pay_12345...",
  "captured": true,
  ...
}
```

### Refunds

#### Create Refund

`POST /payments/:id/refunds`

Initiates a refund for a payment.

**Request Body:**

```json
{
  "amount": 500,
  "reason": "Customer request"
}
```

#### Get Refund

`GET /refunds/:id`

Retrieves refund details.

### Webhooks

#### List Webhooks

`GET /webhooks`

Returns a list of recent webhooks.

#### Retry Webhook

`POST /webhooks/:id/retry`

Retries a failed webhook delivery.

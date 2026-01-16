import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', apiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

export default app;

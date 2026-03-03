import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './config/database';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

initDb();

app.listen(PORT, () => {
  console.log(`Freelancer Tax AI backend running on http://localhost:${PORT}`);
});

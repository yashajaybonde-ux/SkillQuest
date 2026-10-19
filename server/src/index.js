import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { config } from './config.js';
import { HttpError } from './lib/errors.js';
import publicRoutes from './routes/public.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Render/Railway proxies
app.use(helmet());
app.use(cors({ origin: config.clientOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/quests/:slug/submit', rateLimit({ windowMs: 60_000, limit: 15, message: { error: 'Too many attempts. Wait a minute and try again.' } }));
app.use('/api/verify', rateLimit({ windowMs: 60_000, limit: 60, message: { error: 'Too many verification requests. Try again shortly.' } }));

app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api', meRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues.map((i) => i.message).join(' ') });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

app.listen(config.port, () => console.log(`SkillQuest API listening on http://localhost:${config.port}`));

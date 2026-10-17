import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiRouter } from './routes/aiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or project root .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Basic CORS configuration for local development and specified origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in development
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request size limit to prevent memory exhaustion
app.use(express.json({ limit: '100kb' }));

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ingredia-server',
    groqConfigured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key-here'),
    timestamp: new Date().toISOString()
  });
});

// AI Explanation Route
app.use('/api/ai', aiRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`[Ingredia Backend] Server listening on http://localhost:${PORT}`);
  console.log(`[Ingredia Backend] Groq AI: ${process.env.GROQ_API_KEY ? 'Configured (Active)' : 'Not configured (Deterministic fallback active)'}`);
});

export default app;

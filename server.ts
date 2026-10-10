import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/routes';
import { db } from './src/server/db';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use('/api', apiRouter);

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      bank: 'MOVAFI BANK'
    });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
        watch: {
          ignored: ['**/movafi_database*.json', '**/movafi_database*.tmp']
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MOVAFI BANK] Core Banking & Web Engine active on http://0.0.0.0:${PORT}`);
    db.hydrateFromSupabase().catch((err) => console.warn('[SUPABASE] Hydration error:', err));
  });
}

startServer().catch((err) => {
  console.error('[MOVAFI BANK] Server startup failure:', err);
  process.exit(1);
});


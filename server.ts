import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Goal Sheet Validation
  app.post('/api/goals/validate', (req, res) => {
    const { goals } = req.body;
    if (!goals || !Array.isArray(goals)) {
      return res.status(400).json({ error: 'Invalid goals data' });
    }

    const totalWeightage = goals.reduce((sum: number, g: any) => sum + (parseFloat(g.weightage) || 0), 0);
    const errors: string[] = [];

    // Rule: Total weightage exactly 100%
    if (Math.abs(totalWeightage - 100) > 0.001) {
      errors.push(`Total weightage must be exactly 100%. Current: ${totalWeightage.toFixed(2)}%`);
    }

    // Rule: Max 8 goals
    if (goals.length > 8) {
      errors.push('Maximum 8 goals allowed per cycle.');
    }

    // Rule: Min 10% per goal
    goals.forEach((g: any, index: number) => {
      const w = parseFloat(g.weightage) || 0;
      if (w < 10) {
        errors.push(`Goal "${g.title || index + 1}" must have at least 10% weightage.`);
      }
      if (!g.thrustArea || !g.title || !g.uomType || !g.targetValue) {
        errors.push(`Goal "${g.title || index + 1}" has missing required fields.`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    res.json({ valid: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), {
      name: 'local-essay-analysis-api',
      async configureServer(server) {
        const { createAnalyzeHandler } = await import('./server/analyze.mjs');
        const handler = createAnalyzeHandler({ getKey: () => env.GROQ_API_KEY || process.env.GROQ_API_KEY });
        server.middlewares.use('/api/analyze', (req, res) => { void handler(req, res); });
      },
    }],
  };
});

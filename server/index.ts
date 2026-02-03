import { createServer } from 'vite';
import path from 'path';

async function startDevServer() {
  const server = await createServer({
    configFile: path.resolve(import.meta.dirname, '..', 'vite.config.ts'),
    server: {
      host: '0.0.0.0',
      port: 5000,
    },
  });
  
  await server.listen();
  server.printUrls();
  console.log('Vite dev server running on port 5000');
}

startDevServer().catch(console.error);

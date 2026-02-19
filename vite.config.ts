import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

const wsPlugin: Plugin = {
    name: 'ws-server',
    configureServer(server) {
        server.httpServer?.on('upgrade', async (req, socket, head) => {
             // Only load ws server on upgrade request
            if (req.url === '/api/ws') {
                const { WebSocketServer } = await import('ws');
                const wss = new WebSocketServer({ noServer: true });
                
                wss.handleUpgrade(req, socket, head, async (ws) => {
                    const { handleConnection } = await import('./src/lib/server/wsHandler.ts');
                    handleConnection(ws as any, '');
                });
            }
        });
    }
};

export default defineConfig({
	plugins: [
        tailwindcss(),
        sveltekit(),
        wsPlugin
    ]
});

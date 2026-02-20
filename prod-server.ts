import 'dotenv/config';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handler } from './build/handler.js';
import { handleConnection } from './src/lib/server/wsHandler.ts';

const PORT = process.env.PORT || 3000;

const server = createServer(handler);

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
	if (req.url === '/api/ws') {
		wss.handleUpgrade(req, socket, head, (ws) => {
			handleConnection(ws as any, '');
		});
	} else {
		socket.destroy();
	}
});

server.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});

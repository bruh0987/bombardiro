import type { RequestHandler } from './$types';

// Store verified connections
// Map<RoomID, Set<WebSocket>>
// This variable seems to be just for local use or debugging?
// SvelteKit +server.ts cannot export arbitrary variables.
const rooms = new Map<string, Set<WebSocket>>();

export const GET: RequestHandler = async ({ request, locals }) => {
	const upgrade = request.headers.get('upgrade');
	if (upgrade?.toLowerCase() !== 'websocket') {
		return new Response('Not a WebSocket upgrade', { status: 400 });
	}

	// @ts-ignore
    try {
        const { socket, response } = Deno.upgradeWebSocket(request);
        
        // We don't have roomId yet, it comes in REGISTER message.
        // But handleConnection sets up listeners.
        // We pass '' as initial roomId or handle it inside?
        // handleConnection sets up onmessage which handles REGISTER.
        
        handleConnection(socket, ''); 

        return response;
    } catch (err) {
        console.error('Deno upgrade failed:', err);
        return new Response('WebSocket upgrade failed', { status: 500 });
    }
};

import { handleConnection } from '$lib/server/wsHandler.ts';

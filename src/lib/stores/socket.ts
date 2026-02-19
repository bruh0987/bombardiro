import { writable } from 'svelte/store';

export const ws = writable<WebSocket | null>(null);
export const isConnected = writable(false);

export function connect(roomId: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/ws`);

    socket.onopen = () => {
        console.log('Connected to WS');
        isConnected.set(true);
        socket.send(JSON.stringify({ type: 'JOIN', roomId }));
    };

    socket.onclose = () => {
        console.log('Disconnected from WS');
        isConnected.set(false);
        ws.set(null);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        // Dispatch to other stores or handlers
    };

    ws.set(socket);
}

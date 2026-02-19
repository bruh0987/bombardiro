export interface GameState {
    players: Map<WebSocket, { name: string, role: string, isHost: boolean }>;
    timeLimit: number;
    status: 'LOBBY' | 'PLAYING' | 'WON' | 'LOST';
    startTime: number | null;
    moduleConfig?: any;
    strikes: number;
    solvedModules: Set<string>;
}

// Global in-memory state
export const connections = new Map<string, GameState>();

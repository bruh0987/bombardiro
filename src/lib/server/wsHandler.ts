import { connections } from './gameState.ts';
import { db } from './db/index.ts';
import { rooms } from './db/schema.ts';

export function handleConnection(socket: WebSocket, roomId: string) {
    // Initial connection setup if needed?
    // Actually, we just wait for messages.
    // But we might want to track the socket immediately?
    // No, existing logic sets up room state on first message or assumes existence.
    // Wait, existing 'handleMessage' creates room state if missing.

    socket.onopen = () => {
        console.log('WS Open');
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(socket, data);
        } catch (e) {
            console.error('Failed to parse message', e);
        }
    };

    socket.onclose = () => {
        console.log('WS Close');
        cleanupSocket(socket);
    };
    
    socket.onerror = (e) => {
        console.error('WS Error', e);
    };
}

async function handleMessage(socket: WebSocket, data: any) {
    const { type, roomId } = data;
    
    if (!connections.has(roomId)) {
        connections.set(roomId, {
            players: new Map(),
            timeLimit: 300,
            status: 'LOBBY',
            startTime: null,
            strikes: 0,
            solvedModules: new Set()
        });
    }
    
    const roomState = connections.get(roomId)!;
    
    switch (type) {
        case 'REGISTER': {
            const { name } = data;
            const isFirst = roomState.players.size === 0;
            roomState.players.set(socket, { 
                name, 
                role: 'NONE', 
                isHost: isFirst 
            });
            (socket as any).roomId = roomId;
            broadcastState(roomId);
            break;
        }
        
        case 'ASSIGN_ROLE': {
            const player = roomState.players.get(socket);
            if (player?.isHost) {
                const { targetName, role } = data;
                
                // If assigning a real role (not NONE), check if anyone else has it and clear them
                if (role !== 'NONE') {
                    for (const [pSocket, pData] of roomState.players) {
                        if (pData.role === role) {
                            pData.role = 'NONE';
                        }
                    }
                }

                // Find target player and assign
                for (const [pSocket, pData] of roomState.players) {
                    if (pData.name === targetName) {
                         pData.role = role;
                         break;
                    }
                }
                broadcastState(roomId);
            }
            break;
        }
        
        case 'update_settings': {
             const player = roomState.players.get(socket);
             if (player?.isHost) {
                 roomState.timeLimit = data.timeLimit;
                 broadcastState(roomId);
             }
             break;
        }

        case 'start_game': {
            const player = roomState.players.get(socket);
             if (player?.isHost) {
                 // Generate Game!
                 const { generateGame } = await import('./gameGenerator.ts');
                 const seed = Math.random().toString(36).substring(7);
                 
                 // Default options if not provided (legacy support / safety)
                 const defaultOptions = { mode: 'RANDOM', moduleCount: 5, selectedModules: [] };
                 const options = data.options || defaultOptions;
                 
                 const gameConfig = generateGame(seed, roomState.timeLimit, options); // await? no, sync

                 roomState.status = 'PLAYING';
                 roomState.startTime = Date.now();
                 roomState.strikes = 0;
                 roomState.solvedModules = new Set();
                 roomState.moduleConfig = gameConfig;
                 
                 broadcastState(roomId);
                 broadcastGameStart(roomId);
             }
             break;
        }

        case 'RESET_LOBBY': {
            const player = roomState.players.get(socket);
            if (player?.isHost) {
                roomState.status = 'LOBBY';
                roomState.startTime = null;
                roomState.strikes = 0;
                roomState.solvedModules = new Set();
                roomState.moduleConfig = undefined;
                broadcastState(roomId);
            }
            break;
        }
        
        case 'TIME_EXPIRED': {
            if (roomState.status === 'PLAYING') {
                roomState.status = 'LOST';
                broadcastState(roomId);
            }
            break;
        }

        case 'VOICE_SIGNAL': {
            // Relays WebRTC signaling data (offer, answer, candidate) to other peers
            // Payload: { signal: any, target: string (optional, or broadcast to all others) }
            const { signal } = data;
            const sender = roomState.players.get(socket);
            
            if (!sender) return;

            // Broadcast to all OTHER players in the room
            // In a 2-player game, this is just the other person.
            for (const [client, info] of roomState.players) {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'VOICE_SIGNAL',
                        payload: {
                            signal,
                            from: sender.name
                        }
                    }));
                }
            }
            break;
        }

        case 'MODULE_INTERACTION': {
            if (roomState.status !== 'PLAYING') {
                console.log(`[${roomId}] Interaction ignored: Status is ${roomState.status}`);
                return;
            }
            const { moduleId, action, data: actionData } = data;
            
            console.log(`[${roomId}] Interaction: ${moduleId} - ${action}`, actionData);

            const module = roomState.moduleConfig.modules.find((m: any) => m.id === moduleId);
            if (!module) {
                 console.error(`[${roomId}] Module not found: ${moduleId}`);
                 return;
            }

            if (roomState.solvedModules.has(moduleId)) {
                 console.log(`[${roomId}] Module already solved: ${moduleId}`);
                 return;
            }

            // --- Generic Logic Handling ---
            let solved = false;
            let strike = false;

            if (module.type === 'WIRES' && action === 'CUT') {
                const { wireIndex } = actionData;
                const correctIndices = module.rules.validIndices; 
                console.log(`[${roomId}] Wires Cut: ${wireIndex}. Valid: ${correctIndices}`);
                
                if (correctIndices.includes(wireIndex)) {
                     solved = true;
                } else {
                    strike = true;
                }
            } else if (module.type === 'BUTTON') {
                const { timeRemaining } = actionData;
                const userAction = action; 
                
                const correctAction = module.rules.action;
                const releaseDigit = module.rules.releaseDigit;

                console.log(`[${roomId}] Button Action: ${userAction}, Rule: ${correctAction}, Release: ${releaseDigit}, Time: ${timeRemaining}`);
                
                if (userAction === 'TAP') {
                    if (correctAction === 'TAP') {
                        solved = true;
                    } else {
                        strike = true;
                    }
                } else if (userAction === 'RELEASE_HOLD') {
                    if (correctAction === 'HOLD') {
                        const m = Math.floor(timeRemaining / 60);
                        const s = Math.floor(timeRemaining % 60);
                        const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                        console.log(`[${roomId}] Button Release Time: ${timeStr}`);
                        
                        if (timeStr.includes(releaseDigit.toString())) {
                            solved = true;
                        } else {
                            strike = true;
                        }
                    } else {
                        strike = true;
                    }
                }
            } else if (module.type === 'SIMON') {
                const { color } = actionData; // User pressed color
                const expectedInput = module.rules.expectedInput; // e.g. ['red', 'blue', 'green']
                
                // Initialize input index if not present
                if (typeof module.data.inputIndex === 'undefined') {
                    module.data.inputIndex = 0;
                }
                
                const currentIndex = module.data.inputIndex;
                const expectedColor = expectedInput[currentIndex];
                
                if (color === expectedColor) {
                    // Correct press
                    console.log(`[${roomId}] Simon Correct: Unlocked ${currentIndex + 1}/${expectedInput.length}`);
                    module.data.inputIndex++;
                    
                    // Check if sequence complete
                    if (module.data.inputIndex >= expectedInput.length) {
                        solved = true;
                    }
                } else {
                    // Wrong press
                    console.log(`[${roomId}] Simon Strike! Expected ${expectedColor}, Got ${color} (Index ${currentIndex})`);
                    console.log(`[${roomId}] Full Sequence: ${module.data.sequence.join(', ')} -> Expected Inputs: ${expectedInput.join(', ')}`);
                    strike = true;
                    module.data.inputIndex = 0; // Reset progress
                }
            } else if (module.type === 'KNOB') {
                const { direction } = actionData; // 'GÓRA', 'DÓŁ', etc
                const correct = module.rules.correctPosition;
                
                if (direction === correct) {
                    solved = true;
                } else {
                    strike = true;
                }
            } else if (module.type === 'LOGIC') {
                const { p, q } = actionData;
                const { solutionP, solutionQ } = module.rules;
                
                if (p === solutionP && q === solutionQ) {
                    solved = true;
                } else {
                    strike = true;
                }
            }

            // Apply Result
            if (solved) {
                console.log(`[${roomId}] Module SOLVED: ${moduleId}`);
                roomState.solvedModules.add(moduleId);
                
                // CRITICAL FIX: Update the config object so client sees it!
                const mod = roomState.moduleConfig.modules.find((m: any) => m.id === moduleId);
                if(mod) mod.solved = true;

                // Check Win
                // Count only interactive modules (WIRES, etc.)
                // For now assuming all modules in config are interactive
                if (roomState.solvedModules.size === roomState.moduleConfig.modules.length) {
                    roomState.status = 'WON';
                }
            }
            
            if (strike) {
                console.log(`[${roomId}] Module STRIKE: ${moduleId}`);
                roomState.strikes++;
                // Check Lose
                if (roomState.strikes >= 3) {
                    roomState.status = 'LOST';
                }
            }
            
            broadcastState(roomId);
            break;
        }
    }
}

function broadcastState(roomId: string) {
    const roomState = connections.get(roomId);
    if (!roomState) return;

    const playerList = Array.from(roomState.players.values()).map(p => ({
        name: p.name,
        role: p.role,
        isHost: p.isHost
    }));

    const payload = {
        type: 'STATE_UPDATE',
        payload: {
            players: playerList,
            timeLimit: roomState.timeLimit,
            status: roomState.status,
            moduleConfig: roomState.moduleConfig,
            startTime: roomState.startTime,
            strikes: roomState.strikes,
            solvedCount: roomState.solvedModules.size
        }
    };

    const msg = JSON.stringify(payload);
    for (const client of roomState.players.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

function broadcastGameStart(roomId: string) {
     const msg = JSON.stringify({ type: 'GAME_START', roomId });
     const roomState = connections.get(roomId);
     if(!roomState) return;

     for (const client of roomState.players.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

function cleanupSocket(socket: WebSocket) {
    const roomId = (socket as any).roomId;
    if (roomId && connections.has(roomId)) {
        const room = connections.get(roomId)!;
        room.players.delete(socket);
        if (room.players.size === 0) {
            connections.delete(roomId);
        } else {
            broadcastState(roomId);
        }
    }
}

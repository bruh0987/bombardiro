import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { rooms } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export const POST: RequestHandler = async () => {
    let code = generateCode();
    let attempts = 0;
    
    // Simple retry loop for collisions
    while (attempts < 5) {
        try {
            await db.insert(rooms).values({
                id: code,
                seed: Math.random().toString(36).substring(7), // Initial random seed
                status: 'LOBBY'
            });
            break;
        } catch (e) {
            code = generateCode();
            attempts++;
        }
    }

    if (attempts >= 5) {
        return json({ error: 'Failed to generate room code' }, { status: 500 });
    }

    return json({ code });
};

// Mock SvelteKit modules for Deno context (vite.config.ts)
import '@std/dotenv/load';

// @ts-ignore
export const env = Deno.env.toObject();
export const dev = true;
export const browser = false;
export const building = false;
export const version = '0.0.1';

<script lang="ts">
    import Wires from './modules/Wires.svelte';
    import Button from './modules/Button.svelte';
    import Simon from './modules/Simon.svelte';
    import Knob from './modules/Knob.svelte';
    import Logic from './modules/Logic.svelte';
    import type { ModuleConfig } from '$lib/server/gameGenerator';
    import { onDestroy } from 'svelte';
    
    // Global Props - Refactored for reactivity
    let props = $props<{ 
        modules: ModuleConfig[],
        onInteract: (moduleId: string, action: string, data: any) => void,
        strikes: number,
        startTime: number | null,
        timeLimit: number
        serialNumber: string,
        batteries: number,
        ports: string[]
    }>();

    // Timer Logic
    let timeRemaining = $state(0); 
    let timerInterval: any;

    // Reset when timeLimit changes (using effect to sync)
    $effect(() => {
        // Init/Reset time if not running or if rules changed
        if (!props.startTime) {
             timeRemaining = props.timeLimit;
        }
    });

    $effect(() => {
        if (props.startTime) {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                const elapsed = (Date.now() - props.startTime!) / 1000;
                timeRemaining = Math.max(0, props.timeLimit - elapsed);
            }, 100);
        } else {
            clearInterval(timerInterval);
        }
        return () => clearInterval(timerInterval);
    });

    onDestroy(() => {
        clearInterval(timerInterval);
    });

    function formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
</script>

<div class="relative bg-[#2a2a2a] p-4 md:p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] border-t border-white/10 w-full max-w-4xl mx-auto briefcase-texture flex flex-col gap-6">
    
    <!-- Sticky Header Container -->
    <div class="sticky top-0 z-50 bg-[#2a2a2a] pb-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b-2 border-black/50 shadow-xl mb-6 pt-2 transition-all">
        <div class="flex flex-col md:flex-row justify-between items-center bg-black/40 p-2 md:p-4 rounded border border-black/50 shadow-inner gap-4">
            <!-- Strikes -->
            <div class="flex flex-col gap-1 items-center md:items-start">
                <div class="text-[0.6rem] text-stone-500 font-bold uppercase tracking-widest">BŁĘDY</div>
                <div class="flex gap-2">
                    {#each {length: 3} as _, i}
                        <div class="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-red-900 bg-black shadow-inner flex items-center justify-center relative overflow-hidden transition-all duration-300 {i < props.strikes ? 'shadow-[0_0_15px_red]' : ''}">
                             <div class="w-full h-full bg-red-600 rounded-full opacity-20 {i < props.strikes ? 'opacity-100 animate-pulse' : ''}"></div>
                             {#if i < props.strikes}
                                <div class="absolute inset-0 bg-red-500 blur-sm opacity-50"></div>
                             {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Widgets Strip (Compact) -->
            <div class="flex flex-wrap gap-2 items-center justify-center p-1">
                <!-- Serial -->
                <div class="bg-stone-300 border border-stone-500 p-1 px-2 rounded shadow flex flex-col gap-0.5">
                    <div class="text-[0.4rem] uppercase font-bold text-stone-600 leading-none">SERIAL</div>
                    <div class="font-mono font-bold text-sm tracking-widest text-stone-900 leading-none">{props.serialNumber}</div>
                </div>

                <!-- Batteries -->
                {#if props.batteries > 0}
                    <div class="flex gap-0.5 bg-[#111] p-1 rounded border border-stone-700">
                        {#each {length: props.batteries} as _}
                            <div class="w-2 h-5 bg-yellow-600 rounded-sm border border-yellow-800 relative"></div>
                        {/each}
                    </div>
                {/if}

                <!-- Ports -->
                {#if props.ports.length > 0}
                     <div class="flex gap-1 bg-[#222] p-1 rounded border border-stone-600 select-none">
                        {#each props.ports as port}
                            <div class="group relative h-5 w-8 bg-stone-700 rounded-sm border border-stone-500 flex items-center justify-center" title={port}>
                                {#if port === 'Równoległy'}
                                    <div class="w-6 h-1 bg-pink-900 rounded-sm"></div>
                                {:else if port === 'Szeregowy'}
                                    <div class="w-6 h-1 bg-teal-900 rounded-sm"></div>
                                {:else if port === 'RCA'}
                                    <div class="flex gap-0.5"><div class="w-1.5 h-1.5 rounded-full bg-white"></div><div class="w-1.5 h-1.5 rounded-full bg-red-600"></div></div>
                                {:else if port === 'DVI-D'}
                                    <div class="w-6 h-2 border border-white/50 bg-black flex gap-0.5 items-center justify-center"><div class="w-0.5 h-0.5 bg-white"></div></div>
                                {:else if port === 'RJ-45'}
                                    <div class="w-3 h-3 border border-black bg-yellow-900/50"></div>
                                {:else}
                                    <div class="text-[0.3rem] text-white overflow-hidden">{port.slice(0,3)}</div>
                                {/if}
                                <!-- Hover Label -->
                                <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-[0.6rem] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-stone-500">
                                    {port}
                                </div>
                            </div>
                        {/each}
                     </div>
                {/if}
            </div>

            <!-- Timer -->
            <div class="bg-black border-4 border-stone-700 px-4 md:px-6 py-2 rounded shadow-[0_0_10px_rgba(0,0,0,1)] relative overflow-hidden">
                 <div class="font-mono text-4xl md:text-5xl font-bold text-red-600 tracking-widest relative z-10 tabular-nums">
                     {formatTime(timeRemaining)}
                 </div>
                 <div class="absolute inset-0 bg-red-900/10 blur-md z-0"></div>
                 <div class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-size-[100%_4px] pointer-events-none z-20 opacity-50"></div>
            </div>
        </div>
    </div>

    <!-- Modules Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-[#151515] p-4 md:p-6 rounded-lg shadow-inner border border-white/5">
        {#each props.modules as module (module.id)}
            <div class="aspect-4/3 bg-[#202020] rounded relative shadow-[0_4px_6px_rgba(0,0,0,0.5)] border-t border-white/5 overflow-hidden ring-1 ring-black">
                {#if module.type === 'WIRES'}
                    <Wires 
                        config={module} 
                        onInteract={(action, data) => props.onInteract(module.id, action, data)} 
                    />
                {:else if module.type === 'BUTTON'}
                     <Button
                        config={module}
                        timeRemaining={timeRemaining}
                        onInteract={(action, data) => props.onInteract(module.id, action, data)}
                    />
                {:else if module.type === 'SIMON'}
                    <Simon
                        config={module}
                        onInteract={(action, data) => props.onInteract(module.id, action, data)}
                    />
                {:else if module.type === 'KNOB'}
                    <Knob
                        config={module}
                        onInteract={(action, data) => props.onInteract(module.id, action, data)}
                    />
                {:else if module.type === 'LOGIC'}
                    <Logic
                        config={module}
                        onInteract={(action, data) => props.onInteract(module.id, action, data)}
                    />
                {:else}
                    <div class="w-full h-full flex items-center justify-center text-stone-600 font-mono text-xs p-4 text-center">
                        NIEZNANY TYP MODUŁU: {module.type}
                    </div>
                {/if}
                
                <!-- Screws -->
                <div class="absolute top-2 left-2 w-3 h-3 rounded-full bg-linear-to-br from-stone-400 to-stone-600 shadow-md flex items-center justify-center"><div class="w-full h-px bg-stone-700 rotate-45"></div></div>
                <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-linear-to-br from-stone-400 to-stone-600 shadow-md flex items-center justify-center"><div class="w-full h-px bg-stone-700 rotate-45"></div></div>
                <div class="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-linear-to-br from-stone-400 to-stone-600 shadow-md flex items-center justify-center"><div class="w-full h-px bg-stone-700 rotate-45"></div></div>
                <div class="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-linear-to-br from-stone-400 to-stone-600 shadow-md flex items-center justify-center"><div class="w-full h-px bg-stone-700 rotate-45"></div></div>
                
                <!-- Status LED -->
                <div class="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                    <div class="w-2 h-2 rounded-full {module.solved ? 'bg-green-500 shadow-[0_0_8px_lime]' : 'bg-red-900'} transition-all duration-300"></div>
                </div>

                <!-- Disable interaction overlay if solved -->
                {#if module.solved}
                    <div class="absolute inset-0 z-50 bg-black/10 pointer-events-none"></div>
                {/if}
            </div>
        {/each}
        
        <!-- Empty slots filler (opt) -->
        {#if props.modules.length < 4}
            {#each {length: 4 - props.modules.length} as _}
                <div class="aspect-4/3 bg-[#181818] rounded border border-white/5 flex items-center justify-center relative shadow-inner opacity-50">
                     <span class="text-stone-700 font-mono text-xs uppercase">SLOT PUSTY</span>
                     <!-- Screws -->
                    <div class="absolute top-2 left-2 w-3 h-3 rounded-full bg-stone-800 shadow-inner flex items-center justify-center"></div>
                    <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-stone-800 shadow-inner flex items-center justify-center"></div>
                    <div class="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-stone-800 shadow-inner flex items-center justify-center"></div>
                    <div class="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-stone-800 shadow-inner flex items-center justify-center"></div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- Case Handle/Latch hints -->
    <div class="h-4 bg-[#111] mt-8 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border-b border-white/10"></div>
</div>

<style>
    .briefcase-texture {
        background-image: 
            radial-gradient(circle at 50% 0, rgba(255,255,255,0.05), transparent 70%),
            url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23000000' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E");
    }
</style>

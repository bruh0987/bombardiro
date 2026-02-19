<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connect, ws, isConnected } from '$lib/stores/socket';
    import Bomb from '$lib/components/Bomb.svelte';
    import Manual from '$lib/components/Manual.svelte';
    import VoiceManager from '$lib/components/VoiceManager.svelte';
    
    // Types
    type Player = { id: string, name: string, isHost: boolean, role: 'DEFUSER' | 'EXPERT' | 'NONE' };
    
    // Basic State
    let roomCode = $state($page.params.code);
    let players = $state<Player[]>([]);
    let myName = $state('');
    let isRegistered = $state(false);
    let timeLimit = $state(300); // 5 mins default
    let isHost = $state(false);
    
    // Game State (using 'as' casting to avoid Svelte 5 parser issues with generics)
    let moduleConfig = $state(null as any);
    let gameStatus = $state('LOBBY' as 'LOBBY' | 'PLAYING' | 'WON' | 'LOST');
    let myRole = $state('NONE' as 'DEFUSER' | 'EXPERT' | 'NONE');
    let strikes = $state(0);
    let startTime = $state(null as number | null);
    
    // Computed
    let canStart = $derived(players.length === 2 && players.every(p => p.role !== 'NONE'));

    onMount(() => {
        connect(roomCode);
    });

    // WebSocket handling using effect
    let voiceManager = $state<VoiceManager>();

    $effect(() => {
        if ($ws) {
            const handler = (event: MessageEvent) => {
                const data = JSON.parse(event.data);
                
                // ... existing handlers ...
                if (data.type === 'VOICE_SIGNAL') {
                    if (voiceManager) {
                        voiceManager.handleSignal(data.payload.signal);
                    }
                }

                if (data.type === 'STATE_UPDATE') {
                    players = data.payload.players;
                    timeLimit = data.payload.timeLimit;
                    gameStatus = data.payload.status;
                    moduleConfig = data.payload.moduleConfig;
                    strikes = data.payload.strikes;
                    startTime = data.payload.startTime;
                    
                    const me = players.find(p => p.name === myName);
                    if (me) {
                        isHost = me.isHost;
                        if (me.role !== 'NONE') {
                             myRole = me.role as any;
                        }
                    }
                }
                
                if (data.type === 'GAME_START') {
                    console.log('GAME STARTED');
                }
            };
            
            $ws.addEventListener('message', handler);
            
            return () => {
                $ws?.removeEventListener('message', handler);
            };
        }
    });

    function joinLobby() {
        if (!myName.trim()) return;
        if (!$ws || $ws.readyState !== WebSocket.OPEN) {
            console.warn('Socket not connected');
            return;
        }
        try {
            $ws.send(JSON.stringify({ type: 'REGISTER', roomId: roomCode, name: myName }));
            isRegistered = true;
        } catch (e) {
            console.error('Error sending register:', e);
        }
    }

    function assignRole(targetName: string, role: 'DEFUSER' | 'EXPERT') {
        $ws?.send(JSON.stringify({ type: 'ASSIGN_ROLE', roomId: roomCode, targetName, role }));
    }

    function returnToLobby() {
        if(!isHost) return;
        $ws?.send(JSON.stringify({ type: 'RESET_LOBBY', roomId: roomCode }));
    }
    
    function updateTimeLimit() {
         $ws?.send(JSON.stringify({ type: 'update_settings', roomId: roomCode, timeLimit }));
    }

    // Module Config State
    let selectionMode = $state('RANDOM' as 'RANDOM' | 'MANUAL');
    let moduleCount = $state(5);
    // Manual counts
    let manualCounts = $state({
        'WIRES': 1,
        'BUTTON': 0,
        'SIMON': 0,
        'KNOB': 0,
        'LOGIC': 0
    });
    
    // ... existing functions ...
    
    function startGame() {
        if(!canStart) return;
        
        let options: any = { mode: selectionMode };
        if (selectionMode === 'RANDOM') {
            options.moduleCount = moduleCount;
        } else {
            // Flatten counts to array: ['WIRES', 'BUTTON', 'BUTTON']
            const selectedModules = [];
            for (const [type, count] of Object.entries(manualCounts)) {
                for(let i=0; i<count; i++) selectedModules.push(type);
            }
            // Fallback if empty
            if (selectedModules.length === 0) {
                 selectionMode = 'RANDOM';
                 options.mode = 'RANDOM';
                 options.moduleCount = 5;
            } else {
                options.selectedModules = selectedModules;
            }
        }
        
        $ws?.send(JSON.stringify({ type: 'start_game', roomId: roomCode, options }));
    }

    function handleInteraction(moduleId: string, action: string, data: any) {
        $ws?.send(JSON.stringify({
            type: 'MODULE_INTERACTION',
            roomId: roomCode,
            moduleId,
            action,
            data
        }));
    }
</script>

<div class="min-h-screen bg-stone-900 text-stone-100 font-mono p-4 flex flex-col items-center">
    <!-- Header -->
    <div class="w-full max-w-2xl mb-8">
        <header class="flex justify-between items-end border-b-4 border-stone-700 pb-4">
            <div>
                <div class="text-xs text-stone-500 font-bold uppercase tracking-widest mb-1">KOD OPERACYJNY</div>
                <div class="text-6xl font-black text-white tracking-widest">{roomCode}</div>
            </div>
            <div class="text-right">
                <div class="text-xs text-stone-500 font-bold uppercase tracking-widest mb-1">STATUS</div>
                <div class="text-xl font-bold text-green-500 animate-pulse">
                    {$isConnected ? 'POŁĄCZONO' : 'ŁĄCZENIE...'}
                </div>
            </div>
        </header>
    </div>

    <!-- Voice Chat Manager -->
    {#if $ws && isRegistered}
        <VoiceManager 
            bind:this={voiceManager}
            socket={$ws}
            roomId={roomCode}
            playerName={myName}
        />
    {/if}

    <!-- Main Content -->
    {#if gameStatus === 'LOBBY'}
        <div class="w-full max-w-2xl">
            {#if !isRegistered}
                 <div class="bg-stone-800 p-8 border-2 border-stone-600 shadow-xl">
                    <h2 class="text-2xl font-bold mb-4">IDENTYFIKACJA PERSONELU</h2>
                    <form onsubmit={(e) => { e.preventDefault(); joinLobby(); }} class="flex flex-col gap-4">
                        <input 
                            type="text" 
                            bind:value={myName}
                            placeholder="WPROWADŹ KRYPTONIM"
                            class="w-full bg-black border border-stone-500 p-4 text-xl font-bold text-center uppercase focus:outline-none focus:border-red-500 text-white placeholder-stone-600"
                            required
                        />
                        <button 
                            type="submit"
                            class="w-full bg-red-700 hover:bg-red-600 text-white p-4 font-bold uppercase tracking-widest transition-colors shadow-lg active:scale-[0.98]"
                        >
                            POTWIERDŹ TOŻSAMOŚĆ
                        </button>
                    </form>
                 </div>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Player List with Host Controls -->
                    <div class="bg-stone-800 p-6 border-2 border-stone-600 md:col-span-2">
                        <h3 class="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">PERSONEL ({players.length}/2)</h3>
                        <div class="flex flex-col gap-2">
                            {#each players as player}
                                <div class="flex items-center justify-between bg-black/40 p-3 border border-stone-700">
                                    <span class="font-bold flex-1">{player.name} {player.isHost ? '(D-CA)' : ''}</span>
                                    
                                    <div class="flex gap-2 items-center">
                                        {#if isHost}
                                            <button 
                                                onclick={() => assignRole(player.name, 'DEFUSER')}
                                                class="px-2 py-1 text-xs font-bold border {player.role === 'DEFUSER' ? 'bg-red-600 border-red-600 text-white' : 'border-stone-600 text-stone-500 hover:border-red-500 hover:text-red-500'}"
                                            >SAPER</button>
                                            <button 
                                                onclick={() => assignRole(player.name, 'EXPERT')}
                                                class="px-2 py-1 text-xs font-bold border {player.role === 'EXPERT' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-stone-600 text-stone-500 hover:border-cyan-500 hover:text-cyan-500'}"
                                            >EKSPERT</button>
                                        {:else}
                                            <span class="text-xs font-mono px-2 py-1 bg-stone-700 rounded uppercase">
                                                {player.role === 'NONE' ? 'NIEPRZYPISANY' : (player.role === 'DEFUSER' ? 'SAPER' : 'EKSPERT')}
                                            </span>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                            {#if players.length < 2}
                                <div class="text-stone-500 italic text-center py-4">Oczekiwanie na partnera...</div>
                            {/if}
                        </div>
                    </div>

                    <!-- Host Controls -->
                    {#if isHost}
                        <div class="bg-stone-800 p-6 border-2 border-stone-600 md:col-span-2 flex flex-col gap-4">
                            <h3 class="text-sm font-bold text-stone-400 uppercase tracking-widest">PARAMETRY MISJI</h3>
                            <div>
                                <label for="timeLimit" class="block text-xs uppercase mb-2">LIMIT CZASU (SEKUNDY)</label>
                                <input 
                                    class="w-full bg-black border border-stone-500 p-2 text-right font-mono text-white"
                                    step="30"
                                    min="60"
                                    aria-label="Limit czasu"
                                />
                            </div>

                             <div class="border-t border-stone-600 pt-4 mt-2">
                                <h3 class="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">KONFIGURACJA MODUŁÓW</h3>
                                <div class="flex gap-2 mb-4">
                                    <button 
                                        onclick={() => selectionMode = 'RANDOM'}
                                        class="flex-1 py-2 text-xs font-bold border {selectionMode === 'RANDOM' ? 'bg-stone-700 border-stone-500 text-white' : 'border-stone-800 text-stone-600'}"
                                    >LOSOWO</button>
                                    <button 
                                        onclick={() => selectionMode = 'MANUAL'}
                                        class="flex-1 py-2 text-xs font-bold border {selectionMode === 'MANUAL' ? 'bg-stone-700 border-stone-500 text-white' : 'border-stone-800 text-stone-600'}"
                                    >RĘCZNIE</button>
                                </div>
                                
                                {#if selectionMode === 'RANDOM'}
                                    <div class=" bg-black/30 p-2 border border-stone-700">
                                        <label for="module-count" class="block text-[0.6rem] uppercase text-stone-500 mb-1">LICZBA MODUŁÓW ({moduleCount})</label>
                                        <input id="module-count" type="range" min="3" max="11" bind:value={moduleCount} class="w-full accent-yellow-600 cursor-pointer" />
                                        <div class="flex justify-between text-[0.5rem] text-stone-600">
                                            <span>3</span><span>11</span>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="grid grid-cols-1 gap-2 bg-black/30 p-2 border border-stone-700 max-h-48 overflow-y-auto">
                                        {#each Object.entries(manualCounts) as [type, count]}
                                            <div class="flex items-center justify-between text-xs">
                                                <span class="text-stone-400">{type}</span>
                                                <div class="flex items-center gap-2">
                                                    <button onclick={() => manualCounts[type as keyof typeof manualCounts] = Math.max(0, count - 1)} class="w-5 h-5 bg-stone-800 text-stone-400 hover:text-white">-</button>
                                                    <span class="w-4 text-center">{count}</span>
                                                    <button onclick={() => manualCounts[type as keyof typeof manualCounts] = Math.min(5, count + 1)} class="w-5 h-5 bg-stone-800 text-stone-400 hover:text-white">+</button>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                             </div>

                             <button 
                                onclick={startGame}
                                disabled={!canStart}
                                class="bg-yellow-600 hover:bg-yellow-500 disabled:bg-stone-700 disabled:opacity-50 text-black p-6 font-black text-2xl uppercase tracking-[0.2em] shadow-lg border-2 border-yellow-800 transition-all hover:scale-[1.02] active:scale-95 text-center block w-full mt-4"
                            >
                                INICJACJA SEKWENCJI
                            </button>
                        </div>
                    {:else}
                         <div class="col-span-2 text-center text-stone-500 animate-pulse mt-8 border-2 border-dashed border-stone-700 p-4">
                            OCZEKIWANIE NA ROZKAZ DOWÓDCY...
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {:else if gameStatus === 'PLAYING' && moduleConfig}
        <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
             <!-- Give Up Button (Top Right) -->
            {#if isHost}
                <button 
                    onclick={returnToLobby}
                    class="absolute top-4 right-4 bg-red-900/50 hover:bg-red-900 text-red-200 hover:text-white px-4 py-2 border border-red-800 rounded text-xs uppercase font-bold tracking-widest z-50 transition-colors"
                >
                    PRZERWIJ MISJĘ (POWRÓT)
                </button>
            {/if}

            {#if myRole === 'DEFUSER'}
                <div class="flex flex-col items-center gap-4 w-full">
                    <h2 class="text-2xl font-bold text-red-500 tracking-widest uppercase mb-4 animate-pulse">URZĄDZENIE AKTYWNE</h2>
                    <Bomb 
                        modules={moduleConfig.modules} 
                        onInteract={handleInteraction}
                        {strikes}
                        {startTime}
                        {timeLimit}
                        serialNumber={moduleConfig.serialNumber}
                        batteries={moduleConfig.batteries}
                        ports={moduleConfig.ports}
                    />
                </div>
            {:else if myRole === 'EXPERT'}
                 <div class="flex flex-col items-center gap-4">
                    <h2 class="text-2xl font-bold text-cyan-500 tracking-widest uppercase mb-4">INSTRUKCJA OBSŁUGI</h2>
                    <Manual pages={moduleConfig.manual} />
                </div>
            {:else}
                <div class="text-red-500 font-bold text-2xl bg-black p-8 border-4 border-red-800">
                    BŁĄD PRZYDZIAŁU - ROLA OBSERWATORA
                </div>
            {/if}
        </div>
            <!-- WON Screen -->
    {:else if gameStatus === 'WON'}
        <div class="fixed inset-0 bg-green-900/90 flex items-center justify-center z-50 text-center p-8">
            <div class="bg-black border-4 border-green-500 p-8 shadow-[0_0_50px_rgba(0,255,0,0.5)] max-w-lg w-full">
                <h1 class="text-6xl font-black text-green-500 mb-4 tracking-widest uppercase">ZWYCIĘSTWO</h1>
                <p class="text-white mb-8 text-xl">Zagrożenie zneutralizowane. Dobra robota, żołnierzu.</p>
                {#if isHost}
                    <button onclick={returnToLobby} class="bg-green-600 hover:bg-green-500 text-black px-8 py-4 font-bold text-xl uppercase tracking-widest w-full shadow-lg">POWRÓT DO BAZY</button>
                {:else}
                     <p class="text-stone-500 animate-pulse uppercase text-sm">Oczekiwanie na dowódcę...</p>
                {/if}
            </div>
        </div>
    <!-- LOST Screen -->
    {:else if gameStatus === 'LOST'}
        <div class="fixed inset-0 bg-red-900/90 flex items-center justify-center z-50 text-center p-8">
            <div class="bg-black border-4 border-red-500 p-8 shadow-[0_0_50px_rgba(255,0,0,0.5)] max-w-lg w-full">
                <h1 class="text-6xl font-black text-red-600 mb-4 tracking-widest uppercase animate-pulse">PORAŻKA</h1>
                <p class="text-white mb-8 text-xl">Urządzenie uległo detonacji.</p>
                {#if isHost}
                    <button onclick={returnToLobby} class="bg-red-600 hover:bg-red-500 text-black px-8 py-4 font-bold text-xl uppercase tracking-widest w-full shadow-lg">POWRÓT DO BAZY</button>
                {:else}
                     <p class="text-stone-500 animate-pulse uppercase text-sm">Oczekiwanie na dowódcę...</p>
                {/if}
            </div>
        </div>
    {:else}
        <div class="text-center text-stone-500 mt-20">
            WGRYWANIE DANYCH MISJI...
        </div>
    {/if}
</div>

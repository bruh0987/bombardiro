<script lang="ts">
    import type { ModuleConfig } from '$lib/server/gameGenerator';
    
    // Use props object to ensure reactivity
    let props = $props<{ 
        config: ModuleConfig, 
        onInteract: (action: string, data: any) => void 
    }>();
    
    // Derived values for convenience
    let sequence = $derived(props.config.data.sequence); // e.g. ['czerwony', 'niebieski', 'żółty']
    
    // State
    let isPlayingSequence = $state(false);
    let activeColor = $state<string | null>(null);
    let userProgress = $state(0);
    
    // Visual map
    const colors: Record<string, string> = {
        'czerwony': 'bg-red-500 shadow-[0_0_20px_red] z-10',
        'niebieski': 'bg-blue-500 shadow-[0_0_20px_blue] z-10',
        'zielony': 'bg-green-500 shadow-[0_0_20px_lime] z-10',
        'żółty': 'bg-yellow-400 shadow-[0_0_20px_yellow] z-10'
    };
    
    const dimColors: Record<string, string> = {
        'czerwony': 'bg-red-900',
        'niebieski': 'bg-blue-900',
        'zielony': 'bg-green-900',
        'żółty': 'bg-yellow-900'
    };
    
    let interval: any;
    
    // Cleanup
    $effect(() => {
        return () => clearTimeout(interval);
    });

    function playSequence() {
        if (isPlayingSequence || props.config.solved) return;
        isPlayingSequence = true;
        
        let step = 0;
        
        const playNext = () => {
            if (step >= sequence.length) {
                isPlayingSequence = false;
                activeColor = null;
                return;
            }
            
            const color = sequence[step];
            activeColor = color;
            // sound logic would go here
            
            // Turn off after 600ms
            setTimeout(() => {
                activeColor = null;
                // Pause between flashes: 200ms
                step++;
                interval = setTimeout(playNext, 200);
            }, 600);
        };
        
        playNext();
    }
    
    function handlePress(color: string) {
        if (props.config.solved || isPlayingSequence) return;
        
        // Immediate Visual feedback
        activeColor = color;
        setTimeout(() => {
            if (activeColor === color) activeColor = null;
        }, 300);
        
        props.onInteract('PRESS', { color });
    }

</script>

<div class="w-full h-full flex flex-col items-center justify-center p-2 relative">
    <!-- Main Diamond layout -->
    <div class="relative w-32 h-32 md:w-40 md:h-40 rotate-45">
        
        <!-- Top Left: Blue -->
        <button 
            class="absolute top-0 left-0 w-1/2 h-1/2 border-2 border-black rounded-tl-full transition-all duration-100 
            {activeColor === 'niebieski' ? colors['niebieski'] : dimColors['niebieski']}"
            onmousedown={() => handlePress('niebieski')}
            aria-label="Blue"
        ></button>

        <!-- Top Right: Red -->
        <button 
            class="absolute top-0 right-0 w-1/2 h-1/2 border-2 border-black rounded-tr-full transition-all duration-100 
            {activeColor === 'czerwony' ? colors['czerwony'] : dimColors['czerwony']}"
            onmousedown={() => handlePress('czerwony')}
            aria-label="Red"
        ></button>

        <!-- Bottom Left: Yellow -->
        <button 
            class="absolute bottom-0 left-0 w-1/2 h-1/2 border-2 border-black rounded-bl-full transition-all duration-100 
            {activeColor === 'żółty' ? colors['żółty'] : dimColors['żółty']}"
            onmousedown={() => handlePress('żółty')}
            aria-label="Yellow"
        ></button>
        
        <!-- Bottom Right: Green -->
        <button 
            class="absolute bottom-0 right-0 w-1/2 h-1/2 border-2 border-black rounded-br-full transition-all duration-100 
            {activeColor === 'zielony' ? colors['zielony'] : dimColors['zielony']}"
            onmousedown={() => handlePress('zielony')}
            aria-label="Green"
        ></button>
        
        <!-- Center Control -->
        <div class="absolute inset-0 m-auto w-1/3 h-1/3 bg-[#111] rounded-full border-2 border-stone-600 shadow-inner flex items-center justify-center -rotate-45 z-20">
             {#if props.config.solved}
                <div class="w-full h-full flex items-center justify-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_lime]"></div>
                </div>
             {:else}
                <button 
                    class="w-full h-full flex items-center justify-center rounded-full hover:bg-stone-800 active:scale-95 transition-transform"
                    onclick={playSequence}
                    disabled={isPlayingSequence}
                >
                    {#if isPlayingSequence}
                         <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    {:else}
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white ml-0.5">
                             <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                         </svg>
                    {/if}
                </button>
             {/if}
        </div>
    </div>
</div>

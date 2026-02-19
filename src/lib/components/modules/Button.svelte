<script lang="ts">
    import type { ModuleConfig } from '$lib/server/gameGenerator';
    import { onDestroy } from 'svelte';
    
    // Use props object to ensure reactivity
    let props = $props<{ 
        config: ModuleConfig, 
        onInteract: (action: string, data: any) => void,
        timeRemaining: number
    }>();
    
    // Derived values for convenience, or properly reactive using $derived if needed.
    // However, simply accessing props.config.data in the template is usually checking enough.
    // For local vars that are just shortcuts:
    let color = $derived(props.config.data.color);
    let label = $derived(props.config.data.label);
    let stripColor = $derived(props.config.data.stripColor);
    
    let isHolding = $state(false);
    let holdStartTime = $state(0);
    let showStrip = $state(false);
    
    // Check for hold duration to show strip
    let holdCheckInterval: any;

    function handleMouseDown() {
        if (props.config.solved) return;
        isHolding = true;
        holdStartTime = Date.now();
        
        // If held for > 500ms, show the strip
        holdCheckInterval = setTimeout(() => {
            if (isHolding) {
                showStrip = true;
            }
        }, 300);
    }
    
    function handleMouseUp() {
        if (!isHolding || props.config.solved) return;
        
        clearTimeout(holdCheckInterval);
        const holdDuration = Date.now() - holdStartTime;
        isHolding = false;
        showStrip = false;
        
        if (holdDuration < 300) {
            // Tap
            console.log('Button Tap');
            props.onInteract('TAP', {});
        } else {
            // Released after hold
            // Log the time we are sending
            console.log('Button Release Hold', { timeRemaining: props.timeRemaining });
            props.onInteract('RELEASE_HOLD', { timeRemaining: props.timeRemaining });
        }
    }

    // Color Maps (static)
    const bgColors: Record<string, string> = {
        'czerwony': 'bg-red-600 border-red-800 shadow-[0_5px_0_darkred]',
        'niebieski': 'bg-blue-600 border-blue-800 shadow-[0_5px_0_darkblue]',
        'żółty': 'bg-yellow-500 border-yellow-700 shadow-[0_5px_0_#b45309]',
        'biały': 'bg-stone-200 border-stone-400 shadow-[0_5px_0_gray]'
    };
    
    const textColors: Record<string, string> = {
        'biały': 'text-black',
        'żółty': 'text-black',
        'czerwony': 'text-white',
        'niebieski': 'text-white'
    };

    const stripColors: Record<string, string> = {
        'niebieski': 'bg-blue-500 shadow-[0_0_10px_blue]',
        'biały': 'bg-white shadow-[0_0_10px_white]',
        'żółty': 'bg-yellow-400 shadow-[0_0_10px_yellow]',
        'czerwony': 'bg-red-500 shadow-[0_0_10px_red]'
    };
    
</script>

<div class="w-full h-full flex flex-row items-center justify-center gap-4 p-4 select-none relative"
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    ontouchstart={handleMouseDown}
    ontouchend={handleMouseUp}
    role="button"
    tabindex="0"
    aria-label="Bomb Button"
    onmouseleave={() => { if(isHolding) handleMouseUp(); }}
>
    <!-- Solved light -->
    {#if props.config.solved}
        <div class="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_5px_lime]"></div>
    {/if}

    <!-- The Button -->
    <div class="w-32 h-32 rounded-full flex items-center justify-center font-bold text-lg tracking-wider border-b-8 active:border-b-0 active:translate-y-2 transition-all cursor-pointer z-10 
        {bgColors[color] || 'bg-gray-500'} 
        {textColors[color] || 'text-white'}
    ">
        {label}
    </div>

    <!-- The Strip (Hidden unless holding) -->
    <div class="w-4 h-24 bg-black rounded border border-stone-600 relative overflow-hidden">
        {#if showStrip}
            <div class="w-full h-full animate-pulse transition-colors duration-200 {stripColors[stripColor]}"></div>
        {:else}
            <!-- Dark strip -->
            <div class="w-full h-full bg-[#111]"></div>
        {/if}
    </div>

</div>

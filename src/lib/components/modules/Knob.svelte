<script lang="ts">
    import type { ModuleConfig } from '$lib/server/gameGenerator';
    
    // Use props object to ensure reactivity
    let props = $props<{ 
        config: ModuleConfig, 
        onInteract: (action: string, data: any) => void 
    }>();
    
    // Derived values
    let leds = $derived(props.config.data.leds); // "101010..."
    
    // Split into 2 rows of 6
    let row1 = $derived(leds.slice(0, 6).split(''));
    let row2 = $derived(leds.slice(6, 12).split(''));
    
    // Visual state for the knob rotation (purely visual feedback)
    let rotation = $state(0); // degrees
    
    function handleDirection(dir: string, deg: number) {
        if (props.config.solved) return;
        rotation = deg;
        props.onInteract('POINT', { direction: dir });
    }
</script>

<div class="w-full h-full flex flex-col items-center justify-center p-2 gap-4">
    <!-- LEDs -->
    <div class="flex flex-col gap-2 bg-black p-2 rounded border border-stone-600 shadow-inner">
        <!-- Row 1 -->
        <div class="flex gap-2">
            {#each row1 as led, i}
                <div class="w-3 h-3 md:w-4 md:h-4 rounded-full border border-stone-800 
                    {led === '1' ? 'bg-green-500 shadow-[0_0_8px_lime]' : 'bg-[#111] opacity-50'}"></div>
            {/each}
        </div>
        <!-- Row 2 -->
        <div class="flex gap-2">
            {#each row2 as led, i}
                <div class="w-3 h-3 md:w-4 md:h-4 rounded-full border border-stone-800 
                    {led === '1' ? 'bg-green-500 shadow-[0_0_8px_lime]' : 'bg-[#111] opacity-50'}"></div>
            {/each}
        </div>
    </div>
    
    <!-- Knob Control -->
    <div class="relative w-24 h-24 md:w-32 md:h-32">
        <!-- Background Circle -->
        <div class="absolute inset-0 m-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-stone-300 border-4 border-stone-400 shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform duration-300"
             style="transform: rotate({rotation}deg)">
            <div class="w-2 h-8 bg-stone-500 rounded-full absolute top-2"></div>
        </div>
        
        <!-- Directional Buttons (Invisible click zones or visible labels?) -->
        <!-- Visible labels are better for UX -->
        
        <!-- UP -->
        <button class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-[0.6rem] font-bold text-stone-400 hover:text-white uppercase"
            onmousedown={() => handleDirection('GÓRA', 0)}>
            UP
        </button>
        <!-- DOWN -->
        <button class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-[0.6rem] font-bold text-stone-400 hover:text-white uppercase"
            onmousedown={() => handleDirection('DÓŁ', 180)}>
            DN
        </button>
        <!-- LEFT -->
        <button class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-[0.6rem] font-bold text-stone-400 hover:text-white uppercase"
            onmousedown={() => handleDirection('LEWO', -90)}>
            LFT
        </button>
        <!-- RIGHT -->
        <button class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-[0.6rem] font-bold text-stone-400 hover:text-white uppercase"
            onmousedown={() => handleDirection('PRAWO', 90)}>
            RGT
        </button>

        {#if props.config.solved}
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div class="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_lime] z-20"></div>
            </div>
        {/if}
    </div>
</div>

<script lang="ts">
    import type { ModuleConfig } from '$lib/server/gameGenerator';
    
    // Use props object to ensure reactivity
    let props = $props<{ 
        config: ModuleConfig, 
        onInteract: (action: string, data: any) => void 
    }>();
    
    let expression = $derived(props.config.data.expression); // e.g. "(P AND A) XOR (Q OR B)"
    
    // Switch states
    let p = $state(false);
    let q = $state(false);
    
    function handleCheck() {
        if (props.config.solved) return;
        props.onInteract('CHECK', { p, q });
    }
</script>

<div class="w-full h-full flex flex-col items-center justify-center p-2 gap-2 text-stone-200">
    <!-- Screen -->
    <div class="w-full bg-[#0a0a0a] border-2 border-stone-600 rounded p-2 mb-2 shadow-inner relative overflow-hidden">
        <div class="font-mono text-center text-green-500 text-sm md:text-base tracking-wider break-all leading-tight">
            {expression}
        </div>
        <!-- Solved Indicator on screen -->
        {#if props.config.solved}
             <div class="absolute inset-0 bg-green-900/50 flex items-center justify-center text-green-400 font-bold uppercase tracking-widest text-xl">
                 TRUE
             </div>
        {/if}
    </div>
    
    <!-- Controls -->
    <div class="flex items-center justify-around w-full px-4">
        <!-- Switch P -->
        <div class="flex flex-col items-center gap-1">
            <div class="font-bold text-xs text-stone-400">P</div>
            <button class="w-8 h-12 bg-stone-300 rounded shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-stone-500 relative transition-all"
                onclick={() => p = !p}>
                <!-- Toggle nub -->
                <div class="absolute w-6 h-6 bg-stone-600 rounded shadow-md left-1 transition-all duration-200"
                    style="top: {p ? '4px' : '22px'}"></div>
            </button>
            <div class="text-[0.6rem] font-mono {p ? 'text-green-500' : 'text-red-500'}">{p ? 'T' : 'F'}</div>
        </div>

        <!-- Check Button -->
        <button class="px-4 py-2 bg-stone-700 hover:bg-stone-600 active:translate-y-0.5 border-b-4 border-stone-900 active:border-b-0 rounded text-xs font-bold uppercase tracking-widest text-white transition-all"
            onclick={handleCheck}>
            onclick={handleCheck}
            aria-label="Sprawdź poprawność">
            SPRAWDŹ
        </button>

        <!-- Switch Q -->
        <div class="flex flex-col items-center gap-1">
            <div class="font-bold text-xs text-stone-400">Q</div>
            <button class="w-8 h-12 bg-stone-300 rounded shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-stone-500 relative transition-all"
                onclick={() => q = !q}>
                <div class="absolute w-6 h-6 bg-stone-600 rounded shadow-md left-1 transition-all duration-200"
                    style="top: {q ? '4px' : '22px'}"></div>
            </button>
            <div class="text-[0.6rem] font-mono {q ? 'text-green-500' : 'text-red-500'}">{q ? 'T' : 'F'}</div>
        </div>
    </div>
</div>

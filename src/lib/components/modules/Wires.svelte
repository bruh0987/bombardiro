<script lang="ts">
    import type { ModuleConfig } from '$lib/server/gameGenerator';
    
    // Props
    let props = $props<{ 
        config: ModuleConfig, 
        onInteract: (action: string, data: any) => void 
    }>();

    let cutWires = $state<number[]>([]);
    
    // Map backend colors to Tailwind classes
    const colorMap: Record<string, string> = {
        // Polish
        czerwony: 'bg-red-600',
        niebieski: 'bg-blue-600',
        żółty: 'bg-yellow-400',
        biały: 'bg-stone-200',
        czarny: 'bg-stone-900',
        // English fallback (for existing game states)
        red: 'bg-red-600',
        blue: 'bg-blue-600',
        yellow: 'bg-yellow-400',
        white: 'bg-stone-200',
        black: 'bg-stone-900'
    };

    function cut(index: number) {
        if (props.config.solved || cutWires.includes(index)) return;
        cutWires.push(index);
        props.onInteract('CUT', { wireIndex: index });
    }
</script>

<div class="relative w-full h-full bg-[#1a1818] p-4 border-l-4 border-b-4 border-black/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex flex-col justify-evenly font-mono">
    <!-- Serial/Header visual -->
    <div class="absolute top-2 right-2 text-[0.6rem] text-yellow-600/50 tracking-widest border border-yellow-600/30 px-1">
        MODUŁ-{props.config.id.split('-')[1]}
    </div>

    {#each props.config.data.wires as color, i}
        <div class="relative flex items-center h-8 group">
            <!-- Left Connector -->
            <div class="w-2 h-4 bg-stone-400 rounded-sm shadow-md z-10 border-b-2 border-stone-600"></div>
            
            <!-- The Wire -->
            {#if !cutWires.includes(i)}
                <button 
                    onclick={() => cut(i)}
                    class="flex-1 h-2 -mx-px hover:brightness-110 active:brightness-90 transition-all shadow-[0_2px_2px_rgba(0,0,0,0.5)] cursor-pointer {colorMap[color]} relative group-hover:scale-y-125"
                    aria-label="Przetnij {color} przewód"
                >
                    <!-- Highlight/Sheen -->
                    <div class="absolute top-0 left-0 w-full h-1/3 bg-white/30 rounded-full blur-[0.5px]"></div>
                    <!-- Wire texture/striping maybe? -->
                </button>
            {:else}
                <div class="flex-1 flex gap-4 -mx-px relative items-center">
                    <!-- Cut Ends -->
                    <div class="h-2 w-1/2 {colorMap[color]} shadow-sm rounded-r-full relative">
                         <div class="absolute -right-px top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-copper rounded-full"></div>
                    </div>
                    <div class="h-2 w-1/2 {colorMap[color]} shadow-sm rounded-l-full relative">
                        <div class="absolute -left-px top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-copper rounded-full"></div>
                    </div>
                </div>
            {/if}

            <!-- Right Connector -->
            <div class="w-2 h-4 bg-stone-400 rounded-sm shadow-md z-10 border-b-2 border-stone-600"></div>
            
            <!-- Label (for dev/debugging or aesthetic) -->
            <span class="absolute left-full ml-2 text-xs text-stone-600 select-none opacity-30 font-bold">{i+1}</span>
        </div>
    {/each}
</div>

<style>
    .bg-copper {
        background-color: #b87333;
    }
</style>

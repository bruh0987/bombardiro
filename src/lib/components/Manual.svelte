<script lang="ts">
    import type { ManualPage } from '$lib/server/gameGenerator';

    let { pages } = $props<{ pages: ManualPage[] }>();
    let currentPage = $state(0);

    function next() {
        if (currentPage < pages.length - 1) currentPage++;
    }

    function prev() {
        if (currentPage > 0) currentPage--;
    }
</script>

<div class="w-full max-w-xl mx-auto bg-[#f0e6d2] text-stone-900 font-serif h-[600px] shadow-2xl relative flex flex-col overflow-hidden border-r-8 border-b-8 border-stone-800">
    <!-- Binder Rings -->
    <div class="absolute left-2 top-0 bottom-0 w-8 flex flex-col justify-evenly z-10">
        {#each {length: 4} as _, i}
            <div class="w-12 h-4 bg-stone-400 -ml-4 rounded shadow-lg border-t border-white/50"></div>
        {/each}
    </div>

    <!-- Paper Content -->
    <div class="flex-1 p-12 pl-16 overflow-y-auto prose prose-stone max-w-none">
        <h2 class="text-3xl font-black border-b-4 border-black mb-6 uppercase tracking-widest">{pages[currentPage].title}</h2>
        
        <!-- Render HTML content safely -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html pages[currentPage].content}

        <div class="mt-8 text-xs font-mono text-center border-t border-stone-400 pt-2 opacity-50">
            STRONA {currentPage + 1} Z {pages.length} // TAJNE
        </div>
    </div>

    <!-- Navigation -->
    <div class="bg-stone-800 p-2 flex justify-between text-white font-mono text-xs">
        <button 
            onclick={prev} 
            disabled={currentPage === 0}
            class="px-4 py-2 hover:bg-stone-700 disabled:opacity-25 uppercase"
        >
            &lt; Poprzednia
        </button>
        <div class="py-2">INSTRUKCJA W1.0</div>
        <button 
            onclick={next} 
            disabled={currentPage === pages.length - 1}
            class="px-4 py-2 hover:bg-stone-700 disabled:opacity-25 uppercase"
        >
            Następna &gt;
        </button>
    </div>
</div>

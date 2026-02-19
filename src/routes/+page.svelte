<script lang="ts">
  import { goto } from '$app/navigation';

  let joinCode = $state('');
  let isCreating = $state(false);

  async function createGame() {
    isCreating = true;
    const res = await fetch('/api/lobby/create', { method: 'POST' });
    const data = await res.json();
    if (data.code) {
      goto(`/lobby/${data.code}`);
    }
    isCreating = false;
  }

  function joinGame() {
    if (joinCode.length === 4) {
      goto(`/lobby/${joinCode.toUpperCase()}`);
    }
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-stone-300 font-mono p-4 relative overflow-hidden">
  
  <!-- CRT Scanline & Vignette Overlay -->
  <div class="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
  <div class="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>

  <!-- Glitch Title -->
  <div class="relative mb-16 group">
      <h1 class="text-7xl md:text-9xl font-black tracking-tighter text-red-600 glitch-text relative z-10" data-text="BOMBARDIRO">
          BOMBARDIRO
      </h1>
      <div class="absolute -inset-1 bg-red-600/20 blur-xl opacity-50 animate-pulse"></div>
  </div>

  <div class="flex flex-col gap-8 w-full max-w-sm relative z-20">
    <!-- Host Button -->
    <button
      onclick={createGame}
      disabled={isCreating}
      class="group relative bg-red-900/20 hover:bg-red-900/40 text-red-500 p-6 border-4 border-red-800 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed clip-corners"
    >
      <div class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.4)_10px,rgba(0,0,0,0.4)_20px)] opacity-20"></div>
      <div class="relative flex flex-col items-center gap-1">
          <span class="font-black text-2xl uppercase tracking-[0.2em] group-hover:tracking-[0.3em] transition-all">
              {isCreating ? 'INICJOWANIE...' : 'INICJACJA OPERACJI'}
          </span>
          <span class="text-[0.6rem] bg-red-800 text-black px-2 py-0.5 font-bold uppercase">Priorytet Alpha</span>
      </div>
      <!-- Corner Accents -->
      <div class="absolute top-0 left-0 w-2 h-2 bg-red-500"></div>
      <div class="absolute top-0 right-0 w-2 h-2 bg-red-500"></div>
      <div class="absolute bottom-0 left-0 w-2 h-2 bg-red-500"></div>
      <div class="absolute bottom-0 right-0 w-2 h-2 bg-red-500"></div>
    </button>

    <!-- Join Section -->
    <div class="flex flex-col gap-2">
      <label for="code" class="text-xs uppercase font-bold text-stone-600 tracking-widest text-center mb-2">DOŁĄCZ DO JEDNOSTKI</label>
      <div class="flex gap-4">
        <input
          id="code"
          type="text"
          bind:value={joinCode}
          maxlength="4"
          placeholder="KOD"
          class="bg-black/80 border-2 border-stone-700 text-center text-3xl p-4 w-full uppercase font-bold tracking-[0.5em] focus:outline-none focus:border-yellow-600 text-yellow-500 placeholder-stone-800 shadow-inner"
        />
        <button
          onclick={joinGame}
          disabled={joinCode.length !== 4}
          class="bg-stone-800 hover:bg-stone-700 text-stone-300 px-8 font-bold uppercase border-2 border-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-colors"
        >
          START
        </button>
      </div>
    </div>
  </div>
    
  <!-- Footer Warning -->
  <div class="mt-24 text-red-900/60 text-[0.6rem] text-center max-w-md uppercase tracking-wider font-bold border-t border-red-900/30 pt-4">
      OSTRZEŻENIE: NIEAUTORYZOWANY DOSTĘP DO MATERIAŁÓW WYBUCHOWYCH SKUTKUJE NATYCHMIASTOWYM ROZWIĄZANIEM KONTRAKTU ODDECHOWEGO.
  </div>
</div>

<style>
    .clip-corners {
        clip-path: polygon(
            10px 0, 100% 0, 
            100% calc(100% - 10px), calc(100% - 10px) 100%, 
            0 100%, 0 10px
        );
    }

    .glitch-text {
        position: relative;
    }
    
    .glitch-text::before,
    .glitch-text::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .glitch-text::before {
        left: 2px;
        text-shadow: -1px 0 #ff00c1;
        clip: rect(44px, 450px, 56px, 0);
        animation: glitch-anim 5s infinite linear alternate-reverse;
    }

    .glitch-text::after {
        left: -2px;
        text-shadow: -1px 0 #00fff9;
        clip: rect(44px, 450px, 56px, 0);
        animation: glitch-anim2 5s infinite linear alternate-reverse;
    }

    @keyframes glitch-anim {
        0% { clip: rect(33px, 9999px, 11px, 0); }
        20% { clip: rect(89px, 9999px, 13px, 0); }
        40% { clip: rect(12px, 9999px, 67px, 0); }
        60% { clip: rect(45px, 9999px, 4px, 0); }
        80% { clip: rect(2px, 9999px, 98px, 0); }
        100% { clip: rect(56px, 9999px, 23px, 0); }
    }

    @keyframes glitch-anim2 {
        0% { clip: rect(65px, 9999px, 100px, 0); }
        20% { clip: rect(12px, 9999px, 3px, 0); }
        40% { clip: rect(87px, 9999px, 92px, 0); }
        60% { clip: rect(3px, 9999px, 34px, 0); }
        80% { clip: rect(45px, 9999px, 56px, 0); }
        100% { clip: rect(2px, 9999px, 11px, 0); }
    }
</style>

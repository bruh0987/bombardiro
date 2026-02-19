import { g as getContext, s as store_get, e as escape_html, a as attr, b as unsubscribe_stores } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils2.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { w as writable } from "../../../../chunks/index2.js";
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
const ws = writable(null);
const isConnected = writable(false);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let roomCode = store_get($$store_subs ??= {}, "$page", page).params.code;
    let myName = "";
    let isRegistered = false;
    $$renderer2.push(`<div class="min-h-screen bg-stone-900 text-stone-100 font-mono p-4 flex flex-col items-center"><div class="w-full max-w-2xl mb-8"><header class="flex justify-between items-end border-b-4 border-stone-700 pb-4"><div><div class="text-xs text-stone-500 font-bold uppercase tracking-widest mb-1">KOD OPERACYJNY</div> <div class="text-6xl font-black text-white tracking-widest">${escape_html(roomCode)}</div></div> <div class="text-right"><div class="text-xs text-stone-500 font-bold uppercase tracking-widest mb-1">STATUS</div> <div class="text-xl font-bold text-green-500 animate-pulse">${escape_html(store_get($$store_subs ??= {}, "$isConnected", isConnected) ? "POŁĄCZONO" : "ŁĄCZENIE...")}</div></div></header></div> `);
    if (store_get($$store_subs ??= {}, "$ws", ws) && isRegistered) ;
    else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="w-full max-w-2xl">`);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="bg-stone-800 p-8 border-2 border-stone-600 shadow-xl"><h2 class="text-2xl font-bold mb-4">IDENTYFIKACJA PERSONELU</h2> <form class="flex flex-col gap-4"><input type="text"${attr("value", myName)} placeholder="WPROWADŹ KRYPTONIM" class="w-full bg-black border border-stone-500 p-4 text-xl font-bold text-center uppercase focus:outline-none focus:border-red-500 text-white placeholder-stone-600" required=""/> <button type="submit" class="w-full bg-red-700 hover:bg-red-600 text-white p-4 font-bold uppercase tracking-widest transition-colors shadow-lg active:scale-[0.98]">POTWIERDŹ TOŻSAMOŚĆ</button></form></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};

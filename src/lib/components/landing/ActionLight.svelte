<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-svelte";

    const prints = [
        {
            img: "/images/trades_light.png",
            title: "Registro de Trades",
            value: "Lista de operações ricas em detalhes (preços, ativos, pontos de saída) com histórico unificado.",
            benefit: "Organização Completa"
        },
        {
            img: "/images/strategies_light.png",
            title: "Análise de Estratégias",
            value: "Identificação rápida das melhores táticas e setups operacionais para otimização de lucro.",
            benefit: "Validação de Estratégia"
        }
    ];

    const lightboxItems = [
        { img: "/images/trades_light.png", title: "Registro de Trades (Light Mode)", description: "Lista de operações ricas em detalhes (preços, ativos, pontos de saída) com histórico unificado." },
        { img: "/images/strategies_light.png", title: "Análise de Estratégias (Light Mode)", description: "Identificação rápida das melhores táticas e setups operacionais para otimização de lucro." }
    ];

    let lightboxIndex = $state<number | null>(null);

    function nextImage() {
        if (lightboxIndex !== null) {
            lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
        }
    }

    function prevImage() {
        if (lightboxIndex !== null) {
            lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (lightboxIndex === null) return;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
            nextImage();
        } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
            prevImage();
        } else if (e.key === "Escape") {
            lightboxIndex = null;
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<section id="action-light" class="py-24 px-6 bg-slate-50 border-y border-slate-200/60 relative z-10">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Gestão Eficiente</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">CONTROLE DETALHADO (LIGHT MODE)</h3>
            <p class="text-slate-600 font-medium">Os módulos de trades e estratégias exibidos em fundo claro para contraste ideal.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {#each prints as item}
                <button
                    type="button"
                    class="group bg-white border border-slate-200/80 rounded-[2rem] p-6 space-y-6 hover:bg-slate-100/50 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left cursor-pointer w-full"
                    onclick={() => {
                        const idx = lightboxItems.findIndex(l => l.img === item.img);
                        if (idx !== -1) lightboxIndex = idx;
                    }}
                >
                    <div class="relative bg-slate-100 rounded-2xl overflow-hidden aspect-video border border-slate-200/60 group">
                        <img src={item.img} alt={item.title} class="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-all duration-700" />
                        <div class="absolute inset-0 bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div class="w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <ZoomIn class="w-5 h-5 text-slate-900" />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <span class="text-[8px] bg-emerald-50 border border-emerald-500/20 text-emerald-600 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">{item.benefit}</span>
                        <h4 class="font-outfit text-lg font-black uppercase tracking-tight text-slate-900 mt-1 group-hover:text-emerald-600 transition-colors">{item.title}</h4>
                        <p class="text-slate-500 text-sm leading-relaxed">{item.value}</p>
                    </div>
                </button>
            {/each}
        </div>
    </div>
</section>

<!-- Lightbox Carousel Modal (Light Mode) -->
{#if lightboxIndex !== null}
    <div
        class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8"
        in:fade={{ duration: 250 }}
        out:fade={{ duration: 200 }}
    >
        <!-- Top bar with counters and close -->
        <div class="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
            <span class="text-xs md:text-sm font-bold text-slate-400 bg-slate-900/80 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                {lightboxIndex + 1} / {lightboxItems.length}
            </span>
            <button
                class="bg-white/10 hover:bg-white/20 border border-white/10 rounded-full p-2.5 text-white transition-all cursor-pointer"
                onclick={() => lightboxIndex = null}
                aria-label="Fechar"
            >
                <X class="w-6 h-6" />
            </button>
        </div>

        <!-- Background tap-to-close (excluding UI controls) -->
        <button type="button" class="absolute inset-0 z-10 cursor-default" onclick={() => lightboxIndex = null}></button>

        <!-- Slide Area -->
        <div class="relative z-20 w-full max-w-5xl flex items-center justify-between px-2 md:px-12 select-none">
            <!-- Left Arrow -->
            <button
                class="absolute left-2 md:left-6 z-30 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-sm"
                onclick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="Anterior"
            >
                <ChevronLeft class="w-6 h-6" />
            </button>

            <!-- Active Slide Container -->
            <div
                class="mx-auto max-h-[70vh] md:max-h-[78vh] overflow-hidden bg-slate-900/40 border border-white/10 rounded-2xl md:rounded-[2.5rem] shadow-2xl p-1 md:p-2"
                in:scale={{ duration: 300, start: 0.95 }}
            >
                {#key lightboxIndex}
                    <img
                        src={lightboxItems[lightboxIndex].img}
                        alt={lightboxItems[lightboxIndex].title}
                        class="max-w-full max-h-[65vh] md:max-h-[74vh] object-contain rounded-xl md:rounded-3xl"
                        in:fade={{ duration: 150 }}
                    />
                {/key}
            </div>

            <!-- Right Arrow -->
            <button
                class="absolute right-2 md:right-6 z-30 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-sm"
                onclick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="Próximo"
            >
                <ChevronRight class="w-6 h-6" />
            </button>
        </div>

        <!-- Bottom details bar -->
        <div class="relative z-20 mt-6 max-w-2xl text-center space-y-2 px-6">
            <h4 class="font-outfit text-lg md:text-xl font-black uppercase text-white tracking-tight">
                {lightboxItems[lightboxIndex].title}
            </h4>
            <p class="text-slate-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                {lightboxItems[lightboxIndex].description}
            </p>
            
            <!-- Quick navigation dots inside lightbox -->
            <div class="flex justify-center gap-1.5 pt-3">
                {#each lightboxItems as _, idx}
                    <button
                        type="button"
                        class="h-2 rounded-full transition-all duration-300 cursor-pointer {idx === lightboxIndex ? 'bg-emerald-400 w-5' : 'bg-white/20 hover:bg-white/40 w-2'}"
                        onclick={() => lightboxIndex = idx}
                        aria-label="Ir para imagem {idx + 1}"
                    ></button>
                {/each}
            </div>
        </div>
    </div>
</if>

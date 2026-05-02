<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X, ZoomIn } from "lucide-svelte";

    const prints = [
        {
            img: "/images/trades.png",
            title: "Registro & Diário de Trades",
            desc: "Lista completa de operações com filtragem instantânea e detalhes ricos de cada entrada."
        },
        {
            img: "/images/strategies.png",
            title: "Análise de Estratégias",
            desc: "Identifique exatamente quais operacionais e setups trazem maior retorno financeiro."
        }
    ];

    let selectedImg = $state<string | null>(null);

    function openImage(img: string) {
        selectedImg = img;
    }

    function closeImage() {
        selectedImg = null;
    }
</script>

<section id="action-light" class="py-24 px-6 bg-slate-50 border-y border-slate-200/60 relative z-10">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Gestão & Estratégia</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">CONTROLE DETALHADO (LIGHT MODE)</h3>
            <p class="text-slate-600 font-medium">Foque no controle de cada trade com fundos claros e visuais impecáveis.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {#each prints as item}
                <button type="button" class="group bg-white border border-slate-200/80 rounded-[2rem] p-6 space-y-6 hover:bg-slate-100/50 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left cursor-pointer w-full" onclick={() => openImage(item.img)}>
                    <div class="relative bg-slate-100 rounded-2xl overflow-hidden aspect-video border border-slate-200/60 group">
                        <img src={item.img} alt={item.title} class="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-all duration-700" />
                        <div class="absolute inset-0 bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div class="w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <ZoomIn class="w-5 h-5 text-slate-900" />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <h4 class="font-outfit text-lg font-black uppercase tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">{item.title}</h4>
                        <p class="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                </button>
            {/each}
        </div>
    </div>
</section>

<!-- Lightbox Modal -->
{#if selectedImg}
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" in:fade={{ duration: 250 }} out:fade={{ duration: 200 }}>
        <button class="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full p-3 text-white transition-all cursor-pointer select-none" onclick={closeImage}>
            <X class="w-6 h-6" />
        </button>

        <button type="button" class="absolute inset-0 z-10 cursor-default" onclick={closeImage}></button>

        <div class="relative z-20 max-w-6xl max-h-[90vh] overflow-hidden bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-2 select-none" in:scale={{ duration: 300, start: 0.95 }}>
            <img src={selectedImg} alt="Visualização Ampliada" class="max-w-full max-h-[85vh] object-contain rounded-2xl" />
        </div>
    </div>
{/if}

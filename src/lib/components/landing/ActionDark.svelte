<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X, ZoomIn } from "lucide-svelte";

    const prints = [
        {
            img: "/images/dashboard.png",
            title: "Visão Geral (Cockpit)",
            value: "Mapeamento em tempo real do Win Rate geral, patrimônio acumulado e metas diárias.",
            benefit: "Consistência e Visão Macro"
        },
        {
            img: "/images/analytics.png",
            title: "Performance & Estatísticas",
            value: "Análise profunda de métricas de ganho, fator de lucro e máximo drawdown.",
            benefit: "Otimização Financeira"
        },
        {
            img: "/images/emotional.png",
            title: "Saúde Mental (Psicologia)",
            value: "Identificação exata de vieses cognitivos como FOMO ou overtrading nas entradas.",
            benefit: "Domínio Emocional"
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

<section id="action-dark" class="py-24 px-6 bg-slate-900 border-y border-white/5 relative z-10">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Análise Premium</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-white uppercase">RECURSOS AVANÇADOS (DARK MODE)</h3>
            <p class="text-slate-400 font-medium">Observe os módulos fundamentais do TraderLogPro sob o tema escuro profissional.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            {#each prints as item}
                <button type="button" class="group bg-slate-950/60 border border-white/5 rounded-[2rem] p-6 space-y-6 hover:bg-slate-800/40 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left cursor-pointer w-full" onclick={() => openImage(item.img)}>
                    <div class="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-white/5 group">
                        <img src={item.img} alt={item.title} class="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-700" />
                        <div class="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div class="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <ZoomIn class="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <span class="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">{item.benefit}</span>
                        <h4 class="font-outfit text-lg font-black uppercase tracking-tight text-white mt-1 group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                        <p class="text-slate-400 text-sm leading-relaxed">{item.value}</p>
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

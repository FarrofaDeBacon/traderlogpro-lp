<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X, ZoomIn } from "lucide-svelte";

    const dashboardSlides = [
        "/images/dashboard_1.png",
        "/images/dashboard_2.png",
        "/images/dashboard_3.png"
    ];

    const prints = [
        {
            isCarousel: true,
            title: "Visão Geral (Cockpit)",
            value: "Mapeamento em tempo real do Win Rate geral, patrimônio acumulado e metas diárias.",
            benefit: "Consistência e Visão Macro"
        },
        {
            img: "/images/page_psicologia.png",
            title: "Hub de Psicologia & Emoções",
            value: "Mapeamento emocional de entradas e saídas com identificação de vieses cognitivos e fúria/ansiedade.",
            benefit: "Domínio Emocional"
        },
        {
            img: "/images/page_fiscal.png",
            title: "Apuração de IRPF Automática",
            value: "Compensação de prejuízos acumulados anteriores, isenção de R$ 20k em ações e relatórios da Receita Federal.",
            benefit: "Contabilidade & DARF"
        },
        {
            img: "/images/page_finance.png",
            title: "Gestão Financeira & DARFs",
            value: "Visualização detalhada de guias DARF pendentes e pagas, saldo de contas de corretoras e conciliação bancária.",
            benefit: "Saúde Financeira"
        },
        {
            img: "/images/page_trades.png",
            title: "Livro de Registro de Trades",
            value: "Histórico completo e detalhado de todas as operações fechadas e integradas via Profit RTD.",
            benefit: "Livro Diário"
        },
        {
            img: "/images/page_strategies.png",
            title: "Raio-X de Estratégias",
            value: "Desempenho analítico e financeiro individualizado por setup ou estratégia operacional.",
            benefit: "Validação Estatística"
        }
    ];

    let selectedImg = $state<string | null>(null);
</script>

<section id="action-dark" class="py-24 px-6 bg-slate-900 border-y border-white/5 relative z-10">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Análise Premium</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-white uppercase">MÓDULOS DE EXCELÊNCIA TÉCNICA</h3>
            <p class="text-slate-400 font-medium">Explore as telas reais e o cockpit do TraderLog Pro populado e integrado.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            {#each prints as item}
                {#if item.isCarousel}
                    <!-- Card do Dashboard: carrossel puro CSS -->
                    <div class="group bg-slate-950/60 border border-white/5 rounded-[2rem] p-6 space-y-6 hover:bg-slate-800/40 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left w-full">
                        <button
                            type="button"
                            class="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-white/5 w-full cursor-pointer block"
                            onclick={() => selectedImg = dashboardSlides[0]}
                        >
                            <!-- 3 imagens animadas por CSS -->
                            {#each dashboardSlides as slide, idx}
                                <img
                                    src={slide}
                                    alt="Dashboard {idx + 1}"
                                    class="carousel-slide absolute inset-0 w-full h-full object-cover"
                                    style="animation-delay: {idx * 3}s"
                                />
                            {/each}

                            <!-- Zoom overlay -->
                            <div class="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div class="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <ZoomIn class="w-5 h-5 text-white" />
                                </div>
                            </div>

                            <!-- Dots fixos indicadores -->
                            <div class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                                <span class="carousel-dot dot-1 h-1.5 rounded-full bg-emerald-400"></span>
                                <span class="carousel-dot dot-2 h-1.5 w-1.5 rounded-full bg-white/40"></span>
                                <span class="carousel-dot dot-3 h-1.5 w-1.5 rounded-full bg-white/40"></span>
                            </div>
                        </button>

                        <div class="space-y-2">
                            <span class="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">{item.benefit}</span>
                            <h4 class="font-outfit text-lg font-black uppercase tracking-tight text-white mt-1 group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                            <p class="text-slate-400 text-sm leading-relaxed">{item.value}</p>
                        </div>
                    </div>
                {:else}
                    <button
                        type="button"
                        class="group bg-slate-950/60 border border-white/5 rounded-[2rem] p-6 space-y-6 hover:bg-slate-800/40 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left cursor-pointer w-full"
                        onclick={() => selectedImg = item.img ?? null}
                    >
                        <div class="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-white/5">
                            <img src={item.img} alt={item.title} class="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-700" />
                            <div class="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div class="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
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
                {/if}
            {/each}
        </div>
    </div>
</section>

<!-- Lightbox -->
{#if selectedImg}
    <div
        class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        in:fade={{ duration: 250 }}
        out:fade={{ duration: 200 }}
    >
        <button
            class="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full p-3 text-white transition-all cursor-pointer"
            onclick={() => selectedImg = null}
        >
            <X class="w-6 h-6" />
        </button>
        <button type="button" class="absolute inset-0 z-10 cursor-default" onclick={() => selectedImg = null}></button>
        <div
            class="relative z-20 max-w-6xl max-h-[90vh] overflow-hidden bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-2"
            in:scale={{ duration: 300, start: 0.95 }}
        >
            <img src={selectedImg} alt="Visualização Ampliada" class="max-w-full max-h-[85vh] object-contain rounded-2xl" />
        </div>
    </div>
{/if}

<style>
    /* Carrossel 100% CSS — funciona sem JavaScript */
    /* Ciclo total: 9s (3 slides × 3s cada) */
    @keyframes carousel-show {
        0%        { opacity: 0; }
        5%        { opacity: 1; }
        30%       { opacity: 1; }
        35%, 100% { opacity: 0; }
    }

    .carousel-slide {
        opacity: 0;
        animation: carousel-show 9s ease-in-out infinite;
        animation-fill-mode: both;
    }

    /* Dots sincronizados com o carrossel */
    @keyframes dot-active {
        0%        { width: 1.25rem; background-color: rgb(52 211 153); } /* emerald-400 */
        35%, 100% { width: 0.375rem; background-color: rgba(255,255,255,0.4); }
    }

    .carousel-dot {
        animation: dot-active 9s ease-in-out infinite;
        animation-fill-mode: both;
    }
    .dot-1 { animation-delay: 0s; }
    .dot-2 { animation-delay: 3s; }
    .dot-3 { animation-delay: 6s; }
</style>

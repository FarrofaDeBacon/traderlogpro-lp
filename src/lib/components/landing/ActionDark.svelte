<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-svelte";

    const dashboardSlides = [
        "/images/dashboard_1.png",
        "/images/dashboard_2.png",
        "/images/dashboard_3.png"
    ];

    const psychologySlides = [
        "/images/page_psicologia_1.png",
        "/images/page_psicologia_2.png",
        "/images/page_psicologia_3.png",
        "/images/page_psicologia_4.png",
        "/images/page_psicologia_5.png"
    ];

    const fiscalSlides = [
        "/images/page_fiscal_1.png",
        "/images/page_fiscal_2.png",
        "/images/page_fiscal_3.png"
    ];

    const financeSlides = [
        "/images/page_finance.png",
        "/images/page_fiscal_4.png",
        "/images/page_fiscal_5.png",
        "/images/page_fiscal_6.png"
    ];

    const strategiesSlides = [
        "/images/page_strategies_2.png",
        "/images/page_strategies_3.png",
        "/images/page_strategies_4.png",
        "/images/page_strategies_5.png"
    ];

    const prints = [
        {
            isCarousel: true,
            slides: dashboardSlides,
            carouselType: "3",
            title: "Visão Geral (Cockpit)",
            value: "Mapeamento em tempo real do Win Rate geral, patrimônio acumulado e metas diárias.",
            benefit: "Consistência e Visão Macro",
            lightboxIndex: 0
        },
        {
            isCarousel: true,
            slides: psychologySlides,
            carouselType: "5",
            title: "Hub de Psicologia & Emoções",
            value: "Mapeamento emocional de entradas e saídas com identificação de vieses cognitivos e fúria/ansiedade.",
            benefit: "Domínio Emocional",
            lightboxIndex: 3
        },
        {
            isCarousel: true,
            slides: fiscalSlides,
            carouselType: "3",
            title: "Apuração de IRPF Automática",
            value: "Compensação de prejuízos acumulados anteriores, isenção de R$ 20k em ações e relatórios da Receita Federal.",
            benefit: "Contabilidade & DARF",
            lightboxIndex: 8
        },
        {
            isCarousel: true,
            slides: financeSlides,
            carouselType: "4",
            title: "Gestão Financeira & DARFs",
            value: "Visualização detalhada de guias DARF pendentes e pagas, saldo de contas de corretoras e conciliação bancária.",
            benefit: "Saúde Financeira",
            lightboxIndex: 11
        },
        {
            img: "/images/page_trades.png",
            title: "Livro de Registro de Trades",
            value: "Histórico completo e detalhado de todas as operações fechadas e integradas via Profit RTD.",
            benefit: "Livro Diário"
        },
        {
            isCarousel: true,
            slides: strategiesSlides,
            carouselType: "4",
            title: "Raio-X de Estratégias",
            value: "Desempenho analítico e financeiro individualizado por setup ou estratégia operacional com curvas de capital e drawdown.",
            benefit: "Validação Estatística",
            lightboxIndex: 16
        }
    ];

    // Flat array of all prints for the Lightbox carousel
    const lightboxItems = [
        { img: "/images/dashboard_1.png", title: "Visão Geral (Cockpit) - Tela 1", description: "Mapeamento em tempo real do Win Rate geral, patrimônio acumulado e metas diárias." },
        { img: "/images/dashboard_2.png", title: "Visão Geral (Cockpit) - Tela 2", description: "Heatmap mensal de resultados operacionais detalhado por dia." },
        { img: "/images/dashboard_3.png", title: "Visão Geral (Cockpit) - Tela 3", description: "Calendário operacional completo com estatísticas consolidadas." },
        { img: "/images/page_psicologia_1.png", title: "Hub de Psicologia & Emoções - Dashboard Principal", description: "Overview completo com score psicológico, killer/savior emotions e gráficos de performance." },
        { img: "/images/page_psicologia_2.png", title: "Hub de Psicologia & Emoções - Mapa Comportamental", description: "Raio-X em radar octogonal mapeando os estados mentais operacionais recorrentes." },
        { img: "/images/page_psicologia_3.png", title: "Hub de Psicologia & Emoções - Frequência de Emoções", description: "Gráfico de rosca exibindo a distribuição percentual das emoções relatadas." },
        { img: "/images/page_psicologia_4.png", title: "Hub de Psicologia & Emoções - Impacto Financeiro", description: "Ranking preciso demonstrando o impacto financeiro (PnL) real de cada estado emocional." },
        { img: "/images/page_psicologia_5.png", title: "Hub de Psicologia & Emoções - Curva de Performance", description: "Histórico patrimonial anotado com gatilhos e pontos de controle psicológico." },
        { img: "/images/page_fiscal_1.png", title: "Apuração de IRPF Automática - Evolução Fiscal", description: "Controle anual consolidado com expectativa de pagamento mensal de impostos sobre operações." },
        { img: "/images/page_fiscal_2.png", title: "Apuração de IRPF Automática - Gráfico Fiscal", description: "Visualização analítica de imposto devido vs. imposto pago ao longo do ano corrente." },
        { img: "/images/page_fiscal_3.png", title: "Apuração de IRPF Automática - Histórico Mensal", description: "Histórico de apurações completas organizadas de forma cronológica." },
        { img: "/images/page_finance.png", title: "Gestão Financeira & DARFs - Visão Geral", description: "Visualização detalhada do saldo de contas de corretoras e conciliação bancária." },
        { img: "/images/page_fiscal_4.png", title: "Gestão Financeira & DARFs - Gerenciamento de DARFs", description: "Painel completo de controle das guias DARF pendentes, pagas e atrasadas." },
        { img: "/images/page_fiscal_5.png", title: "Gestão Financeira & DARFs - Pagar Guia", description: "Modal rápido e integrado para registro de quitação de guias DARF no sistema." },
        { img: "/images/page_fiscal_6.png", title: "Gestão Financeira & DARFs - Detalhes da DARF", description: "Detalhamento completo de receita (Código 6015), base de cálculo e compensação de prejuízos." },
        { img: "/images/page_trades.png", title: "Livro de Registro de Trades", description: "Histórico completo e detalhado de todas as operações fechadas e integradas via Profit RTD." },
        { img: "/images/page_strategies_2.png", title: "Raio-X de Estratégias - Curva de Patrimônio", description: "Evolução do saldo líquido acumulado especificamente para a estratégia selecionada." },
        { img: "/images/page_strategies_3.png", title: "Raio-X de Estratégias - Curva de Drawdown", description: "Mapeamento rigoroso e drawdown máximo do setup ao longo do tempo." },
        { img: "/images/page_strategies_4.png", title: "Raio-X de Estratégias - Mapa de Calor (PnL)", description: "Matriz interativa mapeando dias da semana e horários com os melhores e piores retornos." },
        { img: "/images/page_strategies_5.png", title: "Raio-X de Estratégias - Fatores Operacionais", description: "Métricas consolidadas como média de lucro/prejuízo, payoff e fator de recuperação." }
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
                    <!-- Card de Carrossel: Dashboard (3 slides), Psicologia (5 slides) ou Fiscal (6 slides) -->
                    <div class="group bg-slate-950/60 border border-white/5 rounded-[2rem] p-6 space-y-6 hover:bg-slate-800/40 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left w-full">
                        <button
                            type="button"
                            class="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-white/5 w-full cursor-pointer block"
                            onclick={() => lightboxIndex = item.lightboxIndex}
                        >
                            <!-- Imagens animadas por CSS -->
                            {#each item.slides as slide, idx}
                                <img
                                    src={slide}
                                    alt="{item.title} {idx + 1}"
                                    class="{item.carouselType === '3' ? 'carousel-slide' : item.carouselType === '4' ? 'carousel-slide-4' : item.carouselType === '5' ? 'carousel-slide-5' : 'carousel-slide-6'} absolute inset-0 w-full h-full object-cover"
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
                                {#each item.slides as _, idx}
                                    <span class="carousel-dot {item.carouselType === '3' ? 'dot-3' : item.carouselType === '4' ? 'dot-4' : item.carouselType === '5' ? 'dot-5' : 'dot-6'} {item.carouselType === '3' ? 'dot-' + (idx + 1) : item.carouselType === '4' ? 'dot4-' + (idx + 1) : item.carouselType === '5' ? 'dot5-' + (idx + 1) : 'dot6-' + (idx + 1)} h-1.5 rounded-full {idx === 0 ? 'bg-emerald-400' : 'bg-white/40'}"></span>
                                {/each}
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
                        onclick={() => {
                            const idx = lightboxItems.findIndex(l => l.img === item.img);
                            if (idx !== -1) lightboxIndex = idx;
                        }}
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

<!-- Lightbox Carousel Modal -->
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
{/if}

<style>
    /* --- Carrossel 3 slides (Cockpit) --- */
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

    @keyframes dot-active {
        0%        { width: 1.25rem; background-color: rgb(52 211 153); }
        35%, 100% { width: 0.375rem; background-color: rgba(255,255,255,0.4); }
    }

    .dot-3 {
        animation: dot-active 9s ease-in-out infinite;
        animation-fill-mode: both;
    }
    .dot-1 { animation-delay: 0s; }
    .dot-2 { animation-delay: 3s; }
    .dot-3 { animation-delay: 6s; }

    /* --- Carrossel 4 slides (Estratégias) --- */
    @keyframes carousel-show-4 {
        0%        { opacity: 0; }
        5%        { opacity: 1; }
        22%       { opacity: 1; }
        27%, 100% { opacity: 0; }
    }

    .carousel-slide-4 {
        opacity: 0;
        animation: carousel-show-4 12s ease-in-out infinite;
        animation-fill-mode: both;
    }

    @keyframes dot-active-4 {
        0%        { width: 1.25rem; background-color: rgb(52 211 153); }
        27%, 100% { width: 0.375rem; background-color: rgba(255,255,255,0.4); }
    }

    .dot-4 {
        animation: dot-active-4 12s ease-in-out infinite;
        animation-fill-mode: both;
    }
    .dot4-1 { animation-delay: 0s; }
    .dot4-2 { animation-delay: 3s; }
    .dot4-3 { animation-delay: 6s; }
    .dot4-4 { animation-delay: 9s; }

    /* --- Carrossel 5 slides (Psicologia) --- */
    @keyframes carousel-show-5 {
        0%        { opacity: 0; }
        4%        { opacity: 1; }
        18%       { opacity: 1; }
        22%, 100% { opacity: 0; }
    }

    .carousel-slide-5 {
        opacity: 0;
        animation: carousel-show-5 15s ease-in-out infinite;
        animation-fill-mode: both;
    }

    @keyframes dot-active-5 {
        0%        { width: 1.25rem; background-color: rgb(52 211 153); }
        22%, 100% { width: 0.375rem; background-color: rgba(255,255,255,0.4); }
    }

    .dot-5 {
        animation: dot-active-5 15s ease-in-out infinite;
        animation-fill-mode: both;
    }
    .dot5-1 { animation-delay: 0s; }
    .dot5-2 { animation-delay: 3s; }
    .dot5-3 { animation-delay: 6s; }
    .dot5-4 { animation-delay: 9s; }
    .dot5-5 { animation-delay: 12s; }

    /* --- Carrossel 6 slides (Fiscal) --- */
    @keyframes carousel-show-6 {
        0%        { opacity: 0; }
        3%        { opacity: 1; }
        15%       { opacity: 1; }
        18%, 100% { opacity: 0; }
    }

    .carousel-slide-6 {
        opacity: 0;
        animation: carousel-show-6 18s ease-in-out infinite;
        animation-fill-mode: both;
    }

    @keyframes dot-active-6 {
        0%        { width: 1.25rem; background-color: rgb(52 211 153); }
        18%, 100% { width: 0.375rem; background-color: rgba(255,255,255,0.4); }
    }

    .dot-6 {
        animation: dot-active-6 18s ease-in-out infinite;
        animation-fill-mode: both;
    }
    .dot6-1 { animation-delay: 0s; }
    .dot6-2 { animation-delay: 3s; }
    .dot6-3 { animation-delay: 6s; }
    .dot6-4 { animation-delay: 9s; }
    .dot6-5 { animation-delay: 12s; }
    .dot6-6 { animation-delay: 15s; }
</style>

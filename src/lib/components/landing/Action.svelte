<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X, ZoomIn } from "lucide-svelte";
    import { onMount, onDestroy } from "svelte";

    // Dashboard carousel images (slides)
    const dashboardSlides = [
        "/images/dashboard_1.png",
        "/images/dashboard_2.png",
        "/images/dashboard_3.png"
    ];

    let currentSlide = $state(0);
    let carouselInterval: ReturnType<typeof setInterval> | null = null;

    function nextSlide() {
        currentSlide = (currentSlide + 1) % dashboardSlides.length;
    }

    function goToSlide(index: number) {
        currentSlide = index;
        // Reset timer on manual interaction
        if (carouselInterval) {
            clearInterval(carouselInterval);
            carouselInterval = setInterval(nextSlide, 3000);
        }
    }

    onMount(() => {
        carouselInterval = setInterval(nextSlide, 3000);
    });

    onDestroy(() => {
        if (carouselInterval) clearInterval(carouselInterval);
    });

    const prints = [
        {
            isCarousel: true,
            title: "Cockpit do Trader",
            desc: "Dashboard completo: calendário, heatmap de P&L e curva patrimonial em tempo real."
        },
        {
            img: "/images/trades.png",
            title: "Histórico de Trades",
            desc: "Tabela completa com todos os dados de cada trade realizado."
        },
        {
            img: "/images/analytics.png",
            title: "Análise de Performance",
            desc: "Página completa de finanças e métricas para apuração de resultados."
        },
        {
            img: "/images/emotional.png",
            title: "Controle Psicológico",
            desc: "Identifique padrões mentais destrutivos para mitigar erros."
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

<section id="action" class="py-24 px-6 bg-slate-50 border-y border-slate-200/60 relative z-10">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Galeria Real</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">VEJA O SISTEMA EM AÇÃO</h3>
            <p class="text-slate-600 font-medium">Clique em qualquer imagem para ampliá-la e visualizar os dados em detalhes.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
            {#each prints as item}
                {#if item.isCarousel}
                    <!-- Dashboard card com carrossel automático -->
                    <div class="group bg-white border border-slate-200/80 rounded-[2rem] p-6 space-y-6 hover:bg-slate-50/50 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left w-full">
                        <div class="relative bg-slate-100 rounded-2xl overflow-hidden aspect-video border border-slate-200/50"
                             role="button" tabindex="0"
                             onclick={() => openImage(dashboardSlides[currentSlide])}
                             onkeydown={(e) => e.key === 'Enter' && openImage(dashboardSlides[currentSlide])}>
                            {#each dashboardSlides as slide, idx}
                                {#if idx === currentSlide}
                                    <img
                                        src={slide}
                                        alt="Dashboard - slide {idx + 1}"
                                        class="absolute inset-0 w-full h-full object-cover opacity-95 cursor-pointer group-hover:scale-105 transition-all duration-700"
                                        in:fade={{ duration: 600 }}
                                    />
                                {/if}
                            {/each}

                            <!-- Zoom overlay -->
                            <div class="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div class="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <ZoomIn class="w-5 h-5 text-slate-900" />
                                </div>
                            </div>

                            <!-- Dot indicators -->
                            <div class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                                {#each dashboardSlides as _, idx}
                                    <button
                                        type="button"
                                        aria-label="Slide {idx + 1}"
                                        class="h-2 rounded-full transition-all duration-300 cursor-pointer {idx === currentSlide ? 'bg-emerald-400 w-5' : 'bg-white/50 hover:bg-white/80 w-2'}"
                                        onclick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                                    ></button>
                                {/each}
                            </div>

                            <!-- Slide counter badge -->
                            <div class="absolute top-3 right-3 bg-slate-950/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                                {currentSlide + 1}/{dashboardSlides.length}
                            </div>
                        </div>

                        <div class="space-y-1">
                            <h4 class="font-outfit text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">{item.title}</h4>
                            <p class="text-slate-500 text-sm">{item.desc}</p>
                        </div>
                    </div>
                {:else}
                    <button type="button" class="group bg-white border border-slate-200/80 rounded-[2rem] p-6 space-y-6 hover:bg-slate-50/50 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 text-left cursor-pointer w-full" onclick={() => openImage(item.img ?? '')}>
                        <div class="relative bg-slate-100 rounded-2xl overflow-hidden aspect-video border border-slate-200/50 group">
                            <img src={item.img} alt={item.title} class="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-all duration-700" />
                            <div class="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div class="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <ZoomIn class="w-5 h-5 text-slate-900" />
                                </div>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <h4 class="font-outfit text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">{item.title}</h4>
                            <p class="text-slate-500 text-sm">{item.desc}</p>
                        </div>
                    </button>
                {/if}
            {/each}
        </div>
    </div>
</section>

<!-- Lightbox Modal -->
{#if selectedImg}
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" in:fade={{ duration: 250 }} out:fade={{ duration: 200 }}>
        <!-- Close button -->
        <button class="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full p-3 text-white transition-all cursor-pointer select-none" onclick={closeImage}>
            <X class="w-6 h-6" />
        </button>

        <!-- Clickable background to close -->
        <button type="button" class="absolute inset-0 z-10 cursor-default" onclick={closeImage}></button>

        <div class="relative z-20 max-w-6xl max-h-[90vh] overflow-hidden bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-2 select-none" in:scale={{ duration: 300, start: 0.95 }}>
            <img src={selectedImg} alt="Visualização Ampliada" class="max-w-full max-h-[85vh] object-contain rounded-2xl" />
        </div>
    </div>
{/if}

<script lang="ts">
    import { fly } from "svelte/transition";
    import { Sparkles, ArrowRight } from "lucide-svelte";

    let { visible = true } = $props();
</script>

<section class="relative pt-44 pb-24 px-6 overflow-hidden max-w-6xl mx-auto w-full z-10">
    <div class="grid lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-6 space-y-8 text-center lg:text-left">
            {#if visible}
                <div in:fly={{ y: 20, duration: 800 }} class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                    <Sparkles class="w-3.5 h-3.5 text-emerald-500" />
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Sistema Completo em SvelteKit</span>
                </div>

                <h1 in:fly={{ y: 20, duration: 800, delay: 200 }} class="font-outfit text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-white">
                    PARE DE PERDER DINHEIRO POR <span class="text-emerald-500">FALTA DE CONTROLE</span> NAS SUAS OPERAÇÕES.
                </h1>

                <p in:fly={{ y: 20, duration: 800, delay: 400 }} class="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                    Transforme seus trades em dados e evolua com consistência através do diário de trade do TraderLogPro.
                </p>

                <div in:fly={{ y: 20, duration: 800, delay: 600 }} class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <a href="#pricing" class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-4.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 active:scale-95 cursor-pointer select-none">
                        Começar Agora
                        <ArrowRight class="w-4 h-4" />
                    </a>
                </div>
            {/if}
        </div>

        <!-- Real Screenshot of Dashboard (Dark mode) -->
        <div class="lg:col-span-6 relative group">
            <div class="absolute inset-0 bg-emerald-500/15 blur-[100px] rounded-full"></div>
            <div class="relative bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden aspect-video group">
                <img src="/images/page_dashboard.png" alt="TraderLogPro Dashboard" class="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent"></div>
            </div>
        </div>
    </div>
</section>

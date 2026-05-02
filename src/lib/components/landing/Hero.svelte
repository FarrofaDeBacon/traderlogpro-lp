<script lang="ts">
    import { fly } from "svelte/transition";
    import { TrendingUp, Sparkles, ArrowRight } from "lucide-svelte";

    let { visible = true } = $props();
</script>

<section class="relative pt-44 pb-24 px-6 overflow-hidden max-w-6xl mx-auto w-full">
    <div class="grid lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-7 space-y-8 text-center lg:text-left">
            {#if visible}
                <div in:fly={{ y: 20, duration: 800 }} class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                    <Sparkles class="w-3.5 h-3.5 text-emerald-500" />
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Versão 2025 Disponível</span>
                </div>

                <h1 in:fly={{ y: 20, duration: 800, delay: 200 }} class="font-outfit text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">
                    PARE DE PERDER DINHEIRO POR <span class="text-emerald-500">FALTA DE CONTROLE</span> NAS SUAS OPERAÇÕES.
                </h1>

                <p in:fly={{ y: 20, duration: 800, delay: 400 }} class="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    O diário de trade que transforma seus erros em consistência. Assuma o controle total do seu emocional, risco e resultados.
                </p>

                <div in:fly={{ y: 20, duration: 800, delay: 600 }} class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <a href="#pricing" class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-4.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-500/40 flex items-center justify-center gap-3 active:scale-95 cursor-pointer">
                        Começar Agora
                        <ArrowRight class="w-4 h-4" />
                    </a>
                    <a href="#solution" class="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-4.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center">
                        Saiba Mais
                    </a>
                </div>
            {/if}
        </div>

        <!-- App Preview/Mockup -->
        <div class="lg:col-span-5 relative group">
            <div class="absolute inset-0 bg-emerald-500/15 blur-[100px] rounded-full"></div>
            <div class="relative bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden aspect-video group">
                <img src="/dashboard_mockup.png" alt="TraderLogPro Cockpit" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                
                <div class="absolute top-6 right-6 p-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-bounce-slow">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp class="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p class="text-[8px] uppercase font-black text-slate-500 tracking-widest leading-none">Meta</p>
                            <p class="text-sm font-black text-emerald-400 leading-tight">Consistente</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

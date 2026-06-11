<script lang="ts">
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { Sparkles, ArrowDown, Activity, Brain, ShieldAlert } from "lucide-svelte";

    let { visible = true } = $props();
    let activeTab = $state("cockpit");

    const baseCounter = 92;
    let currentCounter = $state(baseCounter);
    let counterDisplay = $derived(currentCounter.toLocaleString("pt-BR"));

    onMount(() => {
        const stored = localStorage.getItem("traderlog_downloads_total");
        if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed >= baseCounter) {
                currentCounter = parsed;
            }
        } else {
            localStorage.setItem("traderlog_downloads_total", String(baseCounter));
        }
    });
</script>

<section class="relative pt-36 pb-24 px-6 overflow-hidden max-w-6xl mx-auto w-full z-10">
    <div class="grid lg:grid-cols-12 gap-12 items-center">
        <!-- Hero Copy -->
        <div class="lg:col-span-7 space-y-8 text-center lg:text-left">
            {#if visible}
                <div in:fly={{ y: 20, duration: 800 }} class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                    <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Aplicativo Desktop de Alta Performance</span>
                </div>

                <h1 in:fly={{ y: 20, duration: 800, delay: 200 }} class="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-tight text-white uppercase">
                    A VELOCIDADE E PRIVACIDADE DE UM <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">SOFTWARE DESKTOP</span>.
                </h1>

                <p in:fly={{ y: 20, duration: 800, delay: 400 }} class="text-lg text-slate-300 leading-relaxed font-medium">
                    Sincronize suas operações do ProfitChart localmente via RTD de forma instantânea. Mantenha 100% das suas estratégias e histórico de saldo criptografados no seu próprio computador — sem expor seus dados na nuvem.
                </p>

                <div in:fly={{ y: 20, duration: 800, delay: 600 }} class="space-y-4">
                    <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <a href="#pricing" class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 active:scale-95 cursor-pointer select-none">
                            <ArrowDown class="w-4 h-4" />
                            GARANTIR LICENÇA TRADERLOGPRO
                        </a>
                        <a href="/download" class="w-full sm:w-auto border-2 border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 hover:text-white px-10 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer select-none shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/20">
                            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                            BAIXAR TESTE GRÁTIS
                        </a>
                    </div>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1">
                        <span class="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/10">
                            <span class="relative flex h-1.5 w-1.5">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span class="tracking-normal font-black">{counterDisplay}</span> traders testando
                        </span>
                        <span class="text-slate-700">•</span>
                        <span>LIVRE DE VÍRUS</span>
                        <span class="text-slate-700">•</span>
                        <span>SEM NECESSIDADE DE CARTÃO</span>
                        <span class="text-slate-700">•</span>
                        <span>ATIVAÇÃO IMEDIATA VIA HOTMART</span>
                    </p>
                </div>
            {/if}
        </div>

        <!-- Simulated Active UI Dashboard Mockup in Svelte -->
        <div class="lg:col-span-5 relative w-full">
            <div class="relative w-full rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-1 overflow-hidden transition-all duration-500 hover:border-emerald-500/30">
                <!-- OS Title Bar -->
                <div class="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-950/40">
                    <div class="flex gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-rose-500/70"></span>
                        <span class="w-2.5 h-2.5 rounded-full bg-amber-500/70"></span>
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></span>
                    </div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">TraderLogPro v0.4.3 - OFFLINE</span>
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>

                <!-- Tab Controller -->
                <div class="flex border-b border-white/5 bg-slate-950/20 text-[9px] font-black uppercase tracking-wider divide-x divide-white/5">
                    <button onclick={() => activeTab = "cockpit"} class="flex-1 py-2.5 text-center focus:outline-none transition-all {activeTab === 'cockpit' ? 'text-white bg-slate-950 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}">
                        Cockpit
                    </button>
                    <button onclick={() => activeTab = "ai"} class="flex-1 py-2.5 text-center focus:outline-none transition-all {activeTab === 'ai' ? 'text-white bg-slate-950 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}">
                        Insights IA
                    </button>
                    <button onclick={() => activeTab = "shield"} class="flex-1 py-2.5 text-center focus:outline-none transition-all {activeTab === 'shield' ? 'text-white bg-slate-950 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}">
                        Escudo
                    </button>
                </div>

                <!-- Mockup Body Content -->
                <div class="p-4 bg-slate-950/60 min-h-[280px] flex flex-col justify-between">
                    {#if activeTab === 'cockpit'}
                        <div in:fade class="space-y-4">
                            <!-- Stats Rows -->
                            <div class="grid grid-cols-3 gap-2.5">
                                <div class="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                    <span class="block text-[8px] text-slate-500 uppercase font-bold tracking-widest">Saldo Líquido</span>
                                    <span class="text-xs sm:text-sm font-black text-emerald-400">R$ 64.303,52</span>
                                </div>
                                <div class="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                    <span class="block text-[8px] text-slate-500 uppercase font-bold tracking-widest">Fator de Lucro</span>
                                    <span class="text-xs sm:text-sm font-black text-white">2.56</span>
                                </div>
                                <div class="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                    <span class="block text-[8px] text-slate-500 uppercase font-bold tracking-widest">Taxa de Acerto</span>
                                    <span class="text-xs sm:text-sm font-emerald-400 font-black text-emerald-400">64.5%</span>
                                </div>
                            </div>

                            <!-- Candlestick Graphic Mock -->
                            <div class="h-28 bg-slate-950 border border-white/5 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
                                <div class="flex justify-between items-center z-10">
                                    <span class="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Curva de Capital Real</span>
                                    <span class="text-[7px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-bold">LATÊNCIA: 0.1ms</span>
                                </div>
                                <div class="absolute inset-0 pt-8 pb-3 px-3">
                                    <svg class="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                        <path d="M 0 35 Q 20 28 40 32 T 80 12 T 100 5" fill="none" stroke="#10B981" stroke-width="1.5" />
                                        <circle cx="20" cy="28" r="1.5" fill="#10B981" />
                                        <circle cx="40" cy="32" r="1.5" fill="#EF4444" />
                                        <circle cx="60" cy="18" r="1.5" fill="#10B981" />
                                        <circle cx="80" cy="12" r="1.5" fill="#10B981" />
                                        <circle cx="100" cy="5" r="1.5" fill="#10B981" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    {:else if activeTab === 'ai'}
                        <div in:fade class="space-y-4">
                            <div class="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                                <div class="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                                    <Brain class="w-5 h-5 animate-pulse" />
                                </div>
                                <div class="space-y-1">
                                    <span class="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Feedback Comportamental IA</span>
                                    <p class="text-[11px] text-slate-300 leading-normal font-medium">
                                        "Identifiquei hesitação na terceira operação do setup *Elephant Bar*. A disciplina foi perfeita, mas o tempo de decisão foi de 4.7 segundos acima da média."
                                    </p>
                                </div>
                            </div>

                            <div class="p-3 bg-slate-900/50 rounded-xl border border-white/5 space-y-2">
                                <span class="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Controle de Impulsividade</span>
                                <div class="space-y-1.5">
                                    <div class="flex justify-between text-[9px] font-bold">
                                        <span>Meta Diária Blindada</span>
                                        <span class="text-emerald-400">Excelente (94%)</span>
                                    </div>
                                    <div class="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div class="bg-emerald-400 h-full rounded-full" style="width: 94%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div in:fade class="space-y-4">
                            <div class="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                <div class="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 shrink-0">
                                    <ShieldAlert class="w-5 h-5" />
                                </div>
                                <div class="space-y-1">
                                    <span class="text-[9px] text-rose-400 font-black uppercase tracking-widest">Escudo de Risco Ativo</span>
                                    <p class="text-[11px] text-slate-300 leading-normal font-medium">
                                        "Atenção: Você atingiu 80% do limite máximo de perda diária estabelecido para hoje (R$ 1.000,00). As travas operacionais já foram enviadas."
                                    </p>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-medium">
                                <div class="p-2.5 bg-slate-900/50 rounded-lg border border-white/5 flex items-center justify-between">
                                    <span>Max Drawdown</span>
                                    <span class="text-rose-400 font-bold">R$ 1.000</span>
                                </div>
                                <div class="p-2.5 bg-slate-900/50 rounded-lg border border-white/5 flex items-center justify-between">
                                    <span>Max Operações</span>
                                    <span class="text-emerald-400 font-bold">6 Trades</span>
                                </div>
                            </div>
                        </div>
                    {/if}
                    
                    <!-- App Status Footer -->
                    <div class="pt-3 border-t border-white/5 flex justify-between items-center text-[8px] text-slate-500 font-mono">
                        <span>CONEXÃO RTD PROFITCHART: ONLINE</span>
                        <span>BANCO DE DADOS: LOCAL</span>
                    </div>
                </div>
            </div>
            
            <!-- Glow background decorator -->
            <div class="absolute -right-6 -bottom-6 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        </div>
    </div>
</section>

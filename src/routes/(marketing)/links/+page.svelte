<svelte:head>
    <title>@traderlogprobr — Link na Bio</title>
    <meta name="description" content="TraderLogPro — O diário de trade definitivo. Links oficiais." />
</svelte:head>

<div class="min-h-screen bg-slate-950 flex flex-col items-center justify-start px-4 py-12 relative overflow-hidden font-inter">

    <!-- Ambient Glows -->
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div class="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-emerald-500/8 blur-[140px] rounded-full"></div>
        <div class="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-emerald-400/5 blur-[160px] rounded-full"></div>
    </div>

    <div class="relative z-10 w-full max-w-md flex flex-col items-center gap-6">

        <!-- Profile Avatar -->
        <div class="relative">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 p-[3px] shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                <div class="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    <!-- Logo mark only -->
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" class="w-14 h-14">
                        <defs>
                            <linearGradient id="lg" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#059669"/>
                                <stop offset="100%" stop-color="#10B981"/>
                            </linearGradient>
                        </defs>
                        <g transform="translate(10, 8)">
                            <path d="M 25,8 L 8,8 L 8,82 L 25,82" fill="none" stroke="#475569" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M 65,8 L 82,8 L 82,82 L 65,82" fill="none" stroke="#475569" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M 18,65 L 36,45 L 50,57 L 72,25" fill="none" stroke="url(#lg)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M 58,25 L 72,25 L 72,39" fill="none" stroke="url(#lg)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                    </svg>
                </div>
            </div>
            <!-- Online pulse indicator -->
            <span class="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
        </div>

        <!-- Name + handle -->
        <div class="text-center space-y-1">
            <h1 class="text-white text-xl font-black tracking-tight font-outfit">
                Trader<span class="text-emerald-400">LogPro</span>
            </h1>
            <p class="text-slate-500 text-sm font-semibold tracking-wide">@traderlogprobr</p>
            <p class="text-slate-400 text-sm leading-relaxed max-w-xs text-center mt-2">
                O diário de trade <strong class="text-white">mais rápido e privado</strong> do Brasil. 100% local. Sem nuvem.
            </p>
        </div>

        <!-- Stats Row -->
        <div class="flex items-center gap-6 py-3 px-6 rounded-2xl bg-white/[0.03] border border-white/5">
            <div class="text-center">
                <p class="text-emerald-400 font-black text-lg font-outfit">7</p>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Dias Grátis</p>
            </div>
            <div class="w-px h-8 bg-white/5"></div>
            <div class="text-center">
                <p class="text-emerald-400 font-black text-lg font-outfit">100%</p>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Offline</p>
            </div>
            <div class="w-px h-8 bg-white/5"></div>
            <div class="text-center">
                <p class="text-emerald-400 font-black text-lg font-outfit">0</p>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Dados na Nuvem</p>
            </div>
        </div>

        <!-- CTA Primary -->
        <a href="https://go.hotmart.com/U105324624J?dp=1"
           target="_blank" rel="noopener noreferrer"
           class="w-full group relative flex items-center justify-between px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition-all duration-200 shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_45px_rgba(16,185,129,0.45)] active:scale-[0.98]">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                    </svg>
                </div>
                <div class="text-left">
                    <p class="text-slate-950 font-black text-sm uppercase tracking-wider font-outfit">Garantir Licença Vitalícia</p>
                    <p class="text-slate-800 text-[10px] font-semibold">Oferta especial de lançamento · Hotmart</p>
                </div>
            </div>
            <svg class="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
            </svg>
        </a>

        <!-- Links Grid -->
        <div class="w-full space-y-3">

            <!-- Ver o Site -->
            <a href="https://traderlogpro.com.br"
               target="_blank" rel="noopener noreferrer"
               class="w-full group flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-200 active:scale-[0.98]">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253"/>
                        </svg>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Visitar o Site Oficial</p>
                        <p class="text-slate-500 text-[10px] font-semibold">traderlogpro.com.br</p>
                    </div>
                </div>
                <svg class="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
            </a>

            <!-- Funcionalidades -->
            <a href="https://traderlogpro.com.br/#modules"
               target="_blank" rel="noopener noreferrer"
               class="w-full group flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-200 active:scale-[0.98]">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
                        </svg>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Ver Todos os Módulos</p>
                        <p class="text-slate-500 text-[10px] font-semibold">Cockpit · IA · Escudo de Risco · Fiscal</p>
                    </div>
                </div>
                <svg class="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
            </a>

            <!-- Planos e Preços -->
            <a href="https://traderlogpro.com.br/#pricing"
               target="_blank" rel="noopener noreferrer"
               class="w-full group flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-200 active:scale-[0.98]">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z"/>
                        </svg>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Planos e Preços</p>
                        <p class="text-slate-500 text-[10px] font-semibold">Vitalício · Anual · Garantia 7 dias</p>
                    </div>
                </div>
                <svg class="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
            </a>

            <!-- Suporte -->
            <a href="mailto:atendimento@traderlogpro.com.br"
               class="w-full group flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-200 active:scale-[0.98]">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
                        </svg>
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">Falar com Suporte</p>
                        <p class="text-slate-500 text-[10px] font-semibold">atendimento@traderlogpro.com.br</p>
                    </div>
                </div>
                <svg class="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
            </a>

        </div>

        <!-- Key Features badges -->
        <div class="flex flex-wrap justify-center gap-2 pt-2">
            <span class="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-slate-400 text-[10px] font-bold uppercase tracking-wider">🔒 100% Local</span>
            <span class="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-slate-400 text-[10px] font-bold uppercase tracking-wider">⚡ Profit & RTD</span>
            <span class="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-slate-400 text-[10px] font-bold uppercase tracking-wider">🛡️ Sem Nuvem</span>
            <span class="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-slate-400 text-[10px] font-bold uppercase tracking-wider">✅ Garantia 7 Dias</span>
        </div>

        <!-- Footer -->
        <p class="text-slate-700 text-[10px] font-bold uppercase tracking-widest mt-4">
            © 2025 TraderLogPro · Todos os direitos reservados
        </p>

    </div>
</div>

<style>
    :global(body) {
        background: #020617;
    }
</style>

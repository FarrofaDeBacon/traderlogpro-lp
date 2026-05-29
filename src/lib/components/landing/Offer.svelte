<script lang="ts">
    import { Check } from "lucide-svelte";

    // Value Stack reativo em Svelte 5!
    let activePlan = $state("vitalicio");
    
    // Links de Checkout do Hotmart
    const checkoutLinks = {
        vitalicio: "https://pay.hotmart.com/U105324624J",
        anual: "https://pay.hotmart.com/U105324624J?off=ANNUAL_OFFER" // Replace with actual annual offer link/parameter if needed
    };
</script>

<section id="pricing" class="py-24 px-6 bg-slate-900 border-t border-white/5 relative z-10">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Oferta Especial de Lançamento</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-white uppercase">O EMPILHAMENTO DE VALOR</h3>
            <p class="text-slate-400 font-medium">Leve hoje todos os módulos e bônus e garanta sua evolução consistente com risco zero.</p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
            
            <!-- Value Stack List (Left Side) -->
            <div class="lg:col-span-7 p-8 md:p-10 rounded-[2.5rem] bg-slate-950/60 border border-white/5 space-y-6 text-left flex flex-col justify-between">
                <div>
                    <h4 class="font-outfit text-lg font-black uppercase text-emerald-400 tracking-tight">O Empilhamento da Oferta</h4>
                    <div class="divide-y divide-white/5 space-y-4">
                        <div class="flex justify-between items-center text-sm pt-4">
                            <span class="text-slate-300 font-medium">Licença do Software TraderLogPro Desktop</span>
                            <span class="text-slate-500 line-through">R$ 497</span>
                        </div>
                        <div class="flex justify-between items-center text-sm pt-4">
                            <span class="text-slate-300 font-medium">Bônus #1: Módulo Mental & Insights de IA Local</span>
                            <span class="text-emerald-400 font-black">Grátis (R$ 197)</span>
                        </div>
                        <div class="flex justify-between items-center text-sm pt-4">
                            <span class="text-slate-300 font-medium">Bônus #2: Painel do Escudo Dinâmico de Risco</span>
                            <span class="text-emerald-400 font-black">Grátis (R$ 147)</span>
                        </div>
                        <div class="flex justify-between items-center text-sm pt-4">
                            <span class="text-slate-300 font-medium">Bônus #3: Updates Locais e Suporte Prioritário</span>
                            <span class="text-emerald-400 font-black">Grátis (R$ 97)</span>
                        </div>
                    </div>
                </div>
                
                <div class="pt-6 border-t border-white/5 flex justify-between items-center">
                    <span class="font-outfit text-xs font-black uppercase tracking-widest text-slate-500">Valor Total Consolidado:</span>
                    <span class="text-xl font-black text-rose-500 line-through">R$ 938,00</span>
                </div>
            </div>

            <!-- Checkout Box with Plan Selector (Right Side) -->
            <div class="lg:col-span-5 p-8 md:p-10 rounded-[2.5rem] bg-slate-950 border-2 border-emerald-500 relative flex flex-col justify-between gap-8 text-left shadow-2xl shadow-emerald-500/10">
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Economia Garantida</div>
                
                <div class="space-y-4">
                    <span class="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Acesso Imediato</span>
                    <h4 class="font-outfit text-2xl font-black text-white uppercase tracking-tight">PLANOS DE ASSINATURA</h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        Escolha a licença vitalícia para ter acesso de membro fundador para sempre ou assine a licença anual.
                    </p>
                    
                    <!-- Svelte Interactive Selectors -->
                    <div class="pt-4 border-t border-white/5 space-y-3">
                        <!-- Option A: Vitalício -->
                        <button onclick={() => activePlan = "vitalicio"} class="w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between {activePlan === 'vitalicio' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 bg-slate-900/40 opacity-60'}">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-black uppercase text-white">Licença Vitalícia</span>
                                    <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase border border-emerald-500/20">Para Sempre</span>
                                </div>
                                <div class="text-xs text-emerald-400 font-bold">12x de R$ 49,90 <span class="text-slate-400 text-[9px]">ou R$ 499 à vista</span></div>
                            </div>
                            <span class="w-3.5 h-3.5 rounded-full border flex items-center justify-center {activePlan === 'vitalicio' ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'}">
                                {#if activePlan === 'vitalicio'}
                                    <span class="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                                {/if}
                            </span>
                        </button>

                        <!-- Option B: Anual -->
                        <button onclick={() => activePlan = "anual"} class="w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between {activePlan === 'anual' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 bg-slate-900/40 opacity-60'}">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-black uppercase text-slate-300">Licença Anual</span>
                                    <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[8px] font-black uppercase">12 Meses</span>
                                </div>
                                <div class="text-xs text-slate-400 font-bold">12x de R$ 9,90 <span class="text-[9px]">ou R$ 99 à vista</span></div>
                            </div>
                            <span class="w-3.5 h-3.5 rounded-full border flex items-center justify-center {activePlan === 'anual' ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'}">
                                {#if activePlan === 'anual'}
                                    <span class="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                                {/if}
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Action Button targeting dynamic link -->
                <div>
                    <a href={checkoutLinks[activePlan]} target="_blank" rel="noopener noreferrer" class="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-outfit text-xs font-black uppercase tracking-widest text-center transition-all duration-300 active:scale-95 cursor-pointer select-none block shadow-lg shadow-emerald-500/20">
                        Garantir Licença e Acesso Imediato
                    </a>
                    <span class="block text-center text-[8px] text-slate-500 uppercase font-bold mt-3">Processamento 100% seguro via Hotmart S.A.</span>
                </div>

            </div>

        </div>
    </div>
</section>

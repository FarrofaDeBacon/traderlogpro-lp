<script lang="ts">
    import { Check } from "lucide-svelte";

    // Value Stack reativo em Svelte 5!
    let activePlan = $state("vitalicio");
    
    // Links de Checkout do Hotmart
    const checkoutLinks = {
        vitalicio: "https://go.hotmart.com/U105324624J?dp=1",
        anual: "https://go.hotmart.com/J105321674U?dp=1"
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
            
            <!-- Hotmart Trust Card (Left Side) -->
            <div class="lg:col-span-7 p-8 md:p-10 rounded-[2.5rem] bg-slate-950/60 border border-white/5 text-left flex flex-col justify-between gap-8">
                <div class="space-y-2">
                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Processado por</span>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg>
                        </div>
                        <div>
                            <p class="font-outfit text-xl font-black text-white tracking-tight">Hotmart S.A.</p>
                            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plataforma Oficial de Vendas</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <!-- Pagamentos -->
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-2">
                        <div class="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg>
                        </div>
                        <p class="text-[10px] font-black uppercase text-white tracking-wide">Formas de Pagamento</p>
                        <p class="text-[10px] text-slate-400 leading-relaxed">Pix · Cartão de Crédito · Boleto Bancário</p>
                    </div>

                    <!-- Parcelamento -->
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-2">
                        <div class="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>
                        </div>
                        <p class="text-[10px] font-black uppercase text-white tracking-wide">Parcelamento</p>
                        <p class="text-[10px] text-slate-400 leading-relaxed">Em até 3x no Cartão sem juros adicionais</p>
                    </div>

                    <!-- Garantia -->
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-2">
                        <div class="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
                        </div>
                        <p class="text-[10px] font-black uppercase text-white tracking-wide">Garantia Hotmart</p>
                        <p class="text-[10px] text-slate-400 leading-relaxed">7 dias de garantia incondicional. Reembolso com 1 clique.</p>
                    </div>

                    <!-- Ativação Imediata -->
                    <div class="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-2">
                        <div class="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                        </div>
                        <p class="text-[10px] font-black uppercase text-white tracking-wide">Ativação Imediata</p>
                        <p class="text-[10px] text-slate-400 leading-relaxed">Chave de licença enviada ao seu e-mail em segundos.</p>
                    </div>
                </div>

                <div class="pt-4 border-t border-white/5 flex items-center gap-3">
                    <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ambiente SSL criptografado · Dados protegidos pela Hotmart</p>
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
                                <div class="text-xs text-emerald-400 font-bold">3x de R$ 166,34 <span class="text-slate-400 text-[9px]">ou R$ 499 à vista</span></div>
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
                                <div class="text-xs text-slate-400 font-bold">3x de R$ 33,33 <span class="text-[9px]">ou R$ 99,99 à vista</span></div>
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

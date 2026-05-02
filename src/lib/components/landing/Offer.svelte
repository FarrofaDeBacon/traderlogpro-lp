<script lang="ts">
    import { Check } from "lucide-svelte";

    const plans = [
        {
            name: "Plano Anual",
            price: "R$ 99,99",
            period: "/ano",
            features: ["Tudo do Mensal", "Módulo Imposto de Renda Automático", "Análise de Risco Completa", "Updates Regulares"],
            cta: "Garantir Oferta Anual",
            link: "https://pay.hotmart.com/J105321674U",
            popular: false
        },
        {
            name: "Plano Vitalício",
            price: "R$ 499",
            period: "Único",
            features: ["Acesso Vitalício Para Sempre", "Insights de IA Ilimitados", "Módulo Completo B3 + Exterior", "Updates Prioritários Gratuitos"],
            cta: "Ser Membro Fundador",
            link: "https://pay.hotmart.com/U105324624J",
            popular: true
        }
    ];
</script>

<section id="pricing" class="py-24 px-6">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Investimento</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight">ACESSO IMEDIATO AO TRADERLOGPRO</h3>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 items-end max-w-4xl mx-auto">
            {#each plans as plan}
                <div class="relative group p-10 bg-slate-900/40 border {plan.popular ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105 z-10' : 'border-white/5'} rounded-[2.5rem] flex flex-col gap-8 transition-all">
                    {#if plan.popular}
                        <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Mais Escolhido</div>
                    {/if}
                    
                    <div class="space-y-2">
                        <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{plan.name}</h4>
                        <div class="flex items-baseline gap-1">
                            <span class="text-4xl font-black font-outfit">{plan.price}</span>
                            <span class="text-slate-500 text-sm font-bold uppercase">{plan.period}</span>
                        </div>
                    </div>

                    <div class="space-y-4 flex-1">
                        {#each plan.features as f}
                            <div class="flex items-center gap-3 text-sm">
                                <div class="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Check class="w-3 h-3 text-emerald-400" />
                                </div>
                                <span class="text-slate-400">{f}</span>
                            </div>
                        {/each}
                    </div>

                    <a href={plan.link} target="_blank" class="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all {plan.popular ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white hover:bg-white/10'} active:scale-95 cursor-pointer">
                        {plan.cta}
                    </a>
                </div>
            {/each}
        </div>
    </div>
</section>

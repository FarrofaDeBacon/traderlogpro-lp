<script lang="ts">
    const steps = [
        {
            num: "01",
            title: "Registre suas operações",
            desc: "Cadastre suas operações com um clique e observe o diário de trading ser populado em tempo real.",
            screen: "Ver no Módulo Trades"
        },
        {
            num: "02",
            title: "Analise seus resultados",
            desc: "Confira todas as suas métricas e estude a sua evolução patrimonial usando os gráficos nativos de finanças.",
            screen: "Ver no Módulo Finanças"
        },
        {
            num: "03",
            title: "Evolua com dados reais",
            desc: "Observe seus padrões mentais mapeados no sistema para dominar o overtrading e manter a disciplina.",
            screen: "Ver no Módulo Psicologia"
        }
    ];
</script>

<section id="how-it-works" class="py-24 px-6 bg-slate-50 border-y border-slate-200/60 z-10 relative">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Fluxo Real</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">COMO FUNCIONA</h3>
            <p class="text-slate-600 font-medium">Processo simples e direto para registrar e evoluir no trading de forma consistente.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {#each steps as step}
                <div class="p-8 bg-white border border-slate-200/80 rounded-[2.5rem] relative space-y-4 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300">
                    <span class="text-4xl font-outfit font-black text-emerald-500/20 absolute top-6 right-8 select-none">{step.num}</span>
                    <span class="text-[8px] bg-slate-100 border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-wider">{step.screen}</span>
                    <h4 class="font-outfit text-xl font-black uppercase tracking-tight text-slate-900 pr-8 pt-2">{step.title}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

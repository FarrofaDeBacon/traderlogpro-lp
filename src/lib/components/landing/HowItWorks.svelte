<script lang="ts">
    const steps = [
        {
            num: "01",
            title: "Registre suas operações",
            desc: "Adicione seus trades com rapidez, selecionando a estratégia, o tempo gráfico e como estava seu emocional."
        },
        {
            num: "02",
            title: "Analise seus resultados",
            desc: "Acesse o painel analítico para conferir métricas como Win Rate, Fator de Lucro e Máximo Drawdown."
        },
        {
            num: "03",
            title: "Evolua com dados reais",
            desc: "Identifique padrões de sucesso e erros recorrentes para refinar seu operacional e crescer seu capital."
        }
    ];
</script>

<section id="how-it-works" class="py-24 px-6">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Metodologia</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight">COMO FUNCIONA</h3>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {#each steps as step}
                <div class="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] relative space-y-4">
                    <span class="text-4xl font-outfit font-black text-emerald-500/20 absolute top-6 right-8 select-none">{step.num}</span>
                    <h4 class="font-outfit text-xl font-black uppercase tracking-tight text-white pr-8">{step.title}</h4>
                    <p class="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

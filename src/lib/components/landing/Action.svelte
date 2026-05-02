<script lang="ts">
    const prints = [
        {
            img: "/images/dashboard.png",
            title: "Dashboard Geral",
            desc: "Visão macro da conta, evolução e consistência em tempo real."
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
            title: "Controle de Psicologia",
            desc: "Identifique padrões psicológicos destrutivos para mitigar erros."
        }
    ];
</script>

<section id="action" class="py-24 px-6 bg-slate-900/30 border-y border-white/5">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Galeria Real</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-white uppercase">VEJA O SISTEMA EM AÇÃO</h3>
            <p class="text-slate-400">Prints reais da nossa plataforma desktop para você saber exatamente o que está adquirindo.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
            {#each prints as item}
                <div class="group bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 space-y-6 hover:bg-slate-800/40 hover:border-white/10 transition-all hover:-translate-y-1 duration-300">
                    <div class="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-white/5">
                        <img src={item.img} alt={item.title} class="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-all duration-700" />
                    </div>
                    <div class="space-y-1">
                        <h4 class="font-outfit text-xl font-black uppercase tracking-tight text-white">{item.title}</h4>
                        <p class="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

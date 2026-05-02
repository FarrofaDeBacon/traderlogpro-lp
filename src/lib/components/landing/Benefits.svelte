<script lang="ts">
    import { Brain, TrendingUp, Shield, Sparkles } from "lucide-svelte";

    const benefits = [
        {
            icon: Brain,
            title: "Controle Emocional",
            desc: "Monitore seu estado mental em cada entrada e identifique gatilhos que sabotam seu operacional."
        },
        {
            icon: TrendingUp,
            title: "Histórico Detalhado",
            desc: "Tenha um registro visual, completo e institucional de todas as operações, ativos e tempos gráficos."
        },
        {
            icon: Shield,
            title: "Identificação de Erros",
            desc: "Filtre seus trades e descubra exatamente quais comportamentos trazem prejuízo para eliminá-los."
        },
        {
            icon: Sparkles,
            title: "Evolução Consistente",
            desc: "Tome decisões com base em dados matemáticos e estatísticos reais, gerando consistência no longo prazo."
        }
    ];
</script>

<section id="benefits" class="py-24 px-6 bg-slate-900/30 border-y border-white/5">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Vantagens</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight">O QUE VOCÊ GANHA NO LONGO PRAZO</h3>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {#each benefits as benefit}
                <div class="flex items-start gap-5 p-6 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800/40 transition-colors">
                    <div class="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <benefit.icon class="w-6 h-6 text-emerald-400" />
                    </div>
                    <div class="space-y-1.5">
                        <h4 class="font-outfit text-lg font-black uppercase tracking-tight text-white">{benefit.title}</h4>
                        <p class="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

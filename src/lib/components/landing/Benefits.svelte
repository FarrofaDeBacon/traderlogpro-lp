<script lang="ts">
    import { Brain, TrendingUp, Shield, Sparkles } from "lucide-svelte";

    const benefits = [
        {
            icon: Brain,
            title: "Controle Emocional",
            desc: "Identifique padrões de ansiedade e overtrading antes que eles destroem seu capital. Veja todos esses dados na página dedicada de psicologia.",
            linkedPrint: "Módulo Psicologia"
        },
        {
            icon: TrendingUp,
            title: "Histórico Detalhado",
            desc: "Monitore suas entradas e saídas em tempo real e consulte o diário completo diretamente no módulo de trades.",
            linkedPrint: "Módulo Trades"
        },
        {
            icon: Shield,
            title: "Performance Blindada",
            desc: "Apure seus resultados, fator de lucro e ganho patrimonial com precisão matemática no módulo financeiro.",
            linkedPrint: "Módulo Finanças"
        },
        {
            icon: Sparkles,
            title: "Evolução Consistente",
            desc: "Acompanhe suas metas semanais e mensais de ganho no seu cockpit de performance (Dashboard).",
            linkedPrint: "Cockpit Geral"
        }
    ];
</script>

<section id="benefits" class="py-24 px-6 bg-slate-900 border-y border-white/5 z-10 relative">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Vantagens Reais</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-white uppercase">BENEFÍCIOS COMPROVADOS</h3>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {#each benefits as benefit}
                <div class="flex items-start gap-5 p-6 bg-slate-950/60 border border-white/5 rounded-2xl hover:bg-slate-800/40 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300">
                    <div class="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center shrink-0">
                        <benefit.icon class="w-6 h-6 text-emerald-400" />
                    </div>
                    <div class="space-y-1.5 flex-1">
                        <span class="text-[8px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-emerald-500/20">{benefit.linkedPrint}</span>
                        <h4 class="font-outfit text-lg font-black uppercase tracking-tight text-white mt-2 group-hover:text-emerald-400 transition-colors">{benefit.title}</h4>
                        <p class="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

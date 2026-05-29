<script lang="ts">
    import { TrendingUp, Brain, ShieldAlert, FileSpreadsheet } from "lucide-svelte";

    const modules = [
        {
            icon: TrendingUp,
            title: "Módulo Operacional",
            linkedPrint: "Consistência e Métricas",
            desc: "Calendário automatizado de P&L nativo, curva de capital líquida e estatísticas consolidadas de alta precisão (drawdown máximo, Payoff, Expectativa Matemática e Sharpe Ratio)."
        },
        {
            icon: Brain,
            title: "Módulo Mental (AI Insights)",
            linkedPrint: "Disciplina com IA Local",
            desc: "Inteligência Artificial que roda 100% offline diretamente na sua máquina. Mapeia velocidade de clique e desvios operacionais para parar Overtrading e parar os famosos Trades de Vingança."
        },
        {
            icon: ShieldAlert,
            title: "Módulo de Risco (Escudo de Capital)",
            linkedPrint: "Proteção Inflexível",
            desc: "Definição de travas rígidas de perda diária consolidada, limite máximo de trades e gerenciamento de drawdown dinâmico com notificações e travas de segurança na tela."
        },
        {
            icon: FileSpreadsheet,
            title: "Módulo Fiscal & DARFs",
            linkedPrint: "Contabilidade Prática",
            desc: "Relatórios fiscais organizados localmente para compensação automática de prejuízos, cálculo de lucro líquido e acompanhamento prático para emissão da guia DARF."
        }
    ];
</script>

<section id="modules" class="py-24 px-6 bg-slate-900 border-y border-white/5 z-10 relative">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">O Carro de Fórmula 1</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-white uppercase">OS 4 MÓDULOS OPERACIONAIS</h3>
            <p class="text-slate-400 font-medium">As ferramentas definitivas construídas localmente para blindar o seu operacional.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {#each modules as mod}
                <div class="flex flex-col justify-between p-8 bg-slate-950/60 border border-white/5 rounded-[2rem] hover:bg-slate-900/40 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 group">
                    <div class="space-y-6">
                        <div class="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <mod.icon class="w-6 h-6" />
                        </div>
                        <div class="space-y-2">
                            <span class="inline-block text-[8px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-emerald-500/20">{mod.linkedPrint}</span>
                            <h4 class="font-outfit text-xl font-black uppercase tracking-tight text-white pt-2">{mod.title}</h4>
                            <p class="text-slate-400 text-sm leading-relaxed font-medium">{mod.desc}</p>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

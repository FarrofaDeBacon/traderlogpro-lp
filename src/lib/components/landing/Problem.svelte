<script lang="ts">
    import { XCircle } from "lucide-svelte";

    const pains = [
        {
            title: "Você não sabe por que está perdendo dinheiro",
            desc: "Opera no escuro, repetindo os mesmos erros e sem dados concretos para identificar o que está drenando seu capital.",
        },
        {
            title: "Falta controle emocional nas entradas",
            desc: "Ansiedade, medo de ficar de fora (FOMO) ou overtrading destroem suas metas em poucos minutos.",
        },
        {
            title: "Opera sem uma estratégia clara",
            desc: "Muda de operacional a todo momento por falta de um diário e de métricas sólidas de validação.",
        }
    ];
</script>

<section id="problem" class="py-24 px-6 bg-slate-50 border-y border-slate-200/60 z-10 relative">
    <div class="max-w-6xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-rose-600">O Ciclo Destrutivo</h2>
            <h3 class="font-outfit text-4xl md:text-5xl font-black tracking-tight text-slate-900">O QUE ESTÁ DESTROÇANDO SEU CAPITAL?</h3>
            <p class="text-slate-600 font-medium">Você já se sentiu operando em círculos, ganhando em um dia e entregando tudo no outro?</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            {#each pains as pain}
                <div class="group p-8 bg-white border border-slate-200/80 rounded-[2rem] hover:bg-slate-50/50 hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-500/5 transition-all hover:-translate-y-2 duration-300">
                    <div class="w-14 h-14 bg-rose-50/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <XCircle class="w-7 h-7 text-rose-600" />
                    </div>
                    <h4 class="font-outfit text-xl font-black mb-3 uppercase tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">{pain.title}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{pain.desc}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

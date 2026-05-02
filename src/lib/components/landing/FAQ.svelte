<script lang="ts">
    import { fade } from "svelte/transition";
    import { ChevronDown } from "lucide-svelte";

    let openFaq = $state<number | null>(null);

    function toggleFaq(index: number) {
        if (openFaq === index) {
            openFaq = null;
        } else {
            openFaq = index;
        }
    }

    const faqs = [
        {
            q: "Funciona no Windows?",
            a: "Sim! O TraderLogPro é um aplicativo desktop nativo desenvolvido com foco em performance para Windows 10 e 11."
        },
        {
            q: "Precisa de internet?",
            a: "Apenas para a sincronização inicial de dados, autenticação de licença e atualizações automáticas. Suas operações são salvas localmente para máxima segurança."
        },
        {
            q: "Para iniciantes funciona?",
            a: "Com certeza! O sistema foi desenhado de forma intuitiva. Você aprende a registrar suas operações em menos de 5 minutos."
        },
        {
            q: "Como recebo acesso?",
            a: "Imediatamente após a aprovação do pagamento, você receberá um e-mail da Hotmart com o link de download e suas credenciais de acesso."
        }
    ];
</script>

<section id="faq" class="py-24 px-6 bg-slate-50 border-y border-slate-200/60 z-10 relative">
    <div class="max-w-3xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">FAQ</h2>
            <h3 class="font-outfit text-4xl font-black tracking-tight text-slate-900 uppercase">DÚVIDAS FREQUENTES</h3>
        </div>

        <div class="space-y-4">
            {#each faqs as faq, i}
                <div class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300">
                    <button class="w-full text-left px-6 py-4 flex items-center justify-between font-outfit font-black text-slate-900 hover:text-emerald-600 uppercase tracking-tight text-sm select-none cursor-pointer" onclick={() => toggleFaq(i)}>
                        <span>{faq.q}</span>
                        <ChevronDown class="w-4 h-4 text-slate-400 transition-transform duration-300 {openFaq === i ? 'rotate-180 text-emerald-600' : ''}" />
                    </button>
                    {#if openFaq === i}
                        <div class="px-6 pb-5 pt-1 text-slate-600 font-medium text-sm leading-relaxed" in:fade={{ duration: 250 }}>
                            {faq.a}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</section>

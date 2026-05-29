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
            q: "Como a Hotmart entrega o aplicativo?",
            a: "Imediatamente após a aprovação do seu pagamento (Pix ou Cartão), a Hotmart processa e envia de forma automática a sua chave de ativação única e o link de download oficial do instalador diretamente para o seu e-mail cadastrado."
        },
        {
            q: "Meus dados de trading saem do meu computador?",
            a: "De forma alguma. Ao contrário de diários web comuns lentos, o TraderLogPro salva 100% dos dados financeiros, de saldo e de estratégias localmente no seu próprio disco rígido de forma criptografada. Privacidade absoluta garantida."
        },
        {
            q: "Como o aplicativo se integra ao MetaTrader 5?",
            a: "De forma estritamente local e offline. O software lê diretamente os arquivos de log locais criados pelo MT5 no seu computador em milissegundos. Você não precisa expor senhas, credenciais de corretoras ou qualquer conexão na internet."
        },
        {
            q: "Como funciona a garantia de 7 dias?",
            a: "A garantia é incondicional e assegurada integralmente pela Hotmart. Se por qualquer motivo você decidir que o software não blindou sua disciplina operacional, basta solicitar o reembolso na plataforma com um clique para receber 100% do seu dinheiro de volta."
        }
    ];
</script>

<section id="faq" class="py-24 px-6 bg-slate-950 border-t border-white/5 z-10 relative">
    <div class="max-w-3xl mx-auto space-y-16">
        <div class="text-center space-y-4 max-w-2xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Esclarecimento Rápido</h2>
            <h3 class="font-outfit text-4xl font-black tracking-tight text-white uppercase">FAQ TÉCNICO E DE SUPORTE</h3>
        </div>

        <div class="space-y-4">
            {#each faqs as faq, i}
                <div class="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/25 transition-all">
                    <button class="w-full text-left px-6 py-5 flex items-center justify-between font-outfit font-black text-white hover:text-emerald-400 uppercase tracking-tight text-sm select-none cursor-pointer focus:outline-none" onclick={() => toggleFaq(i)}>
                        <span>{faq.q}</span>
                        <ChevronDown class="w-4 h-4 text-slate-400 transition-transform duration-300 {openFaq === i ? 'rotate-180 text-emerald-400' : ''}" />
                    </button>
                    {#if openFaq === i}
                        <div class="px-6 pb-6 pt-2 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-white/5" in:fade={{ duration: 200 }}>
                            {faq.a}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</section>

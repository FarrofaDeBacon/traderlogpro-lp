<script lang="ts">
    import { Github } from "lucide-svelte";
</script>

<section id="github" class="py-24 px-6 border-t border-white/5 bg-slate-950 relative z-10">
    <div class="max-w-5xl mx-auto p-8 sm:p-12 rounded-[2.5rem] bg-slate-900 border border-white/5 shadow-2xl grid lg:grid-cols-12 gap-12 items-center">
        
        <div class="lg:col-span-6 space-y-6 text-left">
            <span class="inline-flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <Github class="w-4 h-4 text-white" />
                Auditoria e Integridade
            </span>
            <h4 class="font-outfit text-3xl font-black text-white uppercase tracking-tight">CÓDIGO ABERTO E AUDITÁVEL</h4>
            <p class="text-sm text-slate-400 leading-relaxed font-medium">
                Como nosso aplicativo roda localmente no seu computador de forma offline, nós mantemos o código público no GitHub. Qualquer desenvolvedor ou trader do mundo pode auditar o software para garantir que ele é 100% seguro, livre de rastreadores e focado estritamente na sua performance operacional.
            </p>
            <div class="pt-2">
                <a href="https://github.com/FarrofaDeBacon/site" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 text-xs font-black uppercase tracking-widest text-white transition-all select-none cursor-pointer">
                    Inspecionar Repositório no GitHub
                </a>
            </div>
        </div>

        <!-- Code Block Mockup -->
        <div class="lg:col-span-6 w-full rounded-xl bg-slate-950 border border-white/5 shadow-2xl p-1 overflow-hidden font-mono text-[10px] text-left">
            <div class="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-slate-900/50">
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-rose-500/70"></span>
                    <span class="w-2 h-2 rounded-full bg-amber-500/70"></span>
                    <span class="w-2 h-2 rounded-full bg-emerald-500/70"></span>
                </div>
                <span class="text-[8px] text-slate-500 uppercase tracking-wider font-bold">src-tauri/src/commands/strategies_analytics.rs</span>
                <span class="w-3.5 h-3.5 text-slate-600">
                    <Github class="w-3.5 h-3.5" />
                </span>
            </div>
            <div class="p-4 space-y-1 bg-slate-950 leading-relaxed font-mono">
                <p class="text-slate-500">// Leitura local segura de dados do ProfitChart</p>
                <p><span class="text-rose-400">pub async fn</span> <span class="text-blue-400">process_local_logs</span>(path: <span class="text-yellow-400">&amp;str</span>) -&gt; <span class="text-teal-400">Result</span>&lt;<span class="text-yellow-400">()</span>, <span class="text-yellow-400">Error</span>&gt; &#123;</p>
                <p class="pl-4"><span class="text-rose-400">let</span> <span class="text-purple-400">log_data</span> = fs::<span class="text-blue-400">read_to_string</span>(path)?;</p>
                <p class="pl-4"><span class="text-rose-400">let</span> <span class="text-purple-400">decrypted</span> = crypto::<span class="text-blue-400">decrypt_local_db</span>(<span class="text-purple-400">log_data</span>)?;</p>
                <p class="pl-4"><span class="text-slate-500">// 100% offline - Dados salvos criptografados no seu HD</span></p>
                <p class="pl-4">analytics::<span class="text-blue-400">store_offline</span>(<span class="text-purple-400">decrypted</span>).<span class="text-rose-400">await</span>;</p>
                <p class="pl-4"><span class="text-teal-400">Ok</span>(())</p>
                <p>&#125;</p>
            </div>
        </div>

    </div>
</section>

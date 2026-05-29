<script lang="ts">
    import { AlertTriangle, Info, Play } from "lucide-svelte";
</script>

<div class="max-w-4xl mx-auto px-6 py-4">
    <div class="p-6 sm:p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 text-left relative overflow-hidden shadow-2xl">
        <!-- Ambient decorative background glow -->
        <div class="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row gap-6 items-start">
            <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shrink-0">
                <AlertTriangle class="w-6 h-6 animate-pulse" />
            </div>

            <div class="space-y-4 flex-1">
                <h4 class="font-outfit text-lg font-black uppercase text-amber-400 tracking-tight flex items-center gap-2">
                    Aviso Importante para Usuários Windows (SmartScreen)
                </h4>
                
                <p class="text-sm text-slate-300 leading-relaxed font-medium">
                    Por se tratar de um aplicativo inovador e recém-lançado de forma independente, o Windows Defender (SmartScreen) pode exibir um alerta azul de <strong class="text-white font-bold">"Editor Desconhecido"</strong> no momento da instalação. Isso é perfeitamente normal e acontece com qualquer software independente novo até que ele ganhe reputação nos servidores de segurança da Microsoft. Nosso aplicativo é 100% íntegro e seguro.
                </p>

                <!-- Step by step visual instructions -->
                <div class="grid sm:grid-cols-2 gap-4 pt-2">
                    <!-- Step 1 -->
                    <div class="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-black shrink-0">1</div>
                        <div class="space-y-1">
                            <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Passo Inicial</span>
                            <p class="text-xs text-slate-300 font-medium">
                                No alerta azul da tela do Windows, clique no link sublinhado <strong class="text-white font-bold">"Mais informações" (More info)</strong>.
                            </p>
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div class="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-black shrink-0">2</div>
                        <div class="space-y-1">
                            <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Execução</span>
                            <p class="text-xs text-slate-300 font-medium">
                                Clique no botão <strong class="text-emerald-400 font-bold">"Executar assim mesmo" (Run anyway)</strong> que surgirá no canto inferior.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

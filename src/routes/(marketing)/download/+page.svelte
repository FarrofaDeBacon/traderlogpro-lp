<script lang="ts">
    import { onMount } from "svelte";
    import Logo from "$lib/components/shared/Logo.svelte";
    import Footer from "$lib/components/landing/Footer.svelte";
    import { Download, ShieldCheck, Play, ArrowRightLeft, Info, HelpCircle } from "lucide-svelte";

    let downloadUrl = "/downloads/TraderLogPro_Setup.exe";
    let downloaded = $state(false);

    // Form inputs state
    let name = $state("");
    let email = $state("");
    let whatsapp = $state("");
    let isSubmitting = $state(false);
    let formError = $state("");

    const baseCounter = 92;
    let currentCounter = $state(baseCounter);
    let counterDisplay = $derived(currentCounter.toLocaleString("pt-BR"));

    onMount(async () => {
        // Register visit in the background (POST tracker.php?action=visit)
        fetch("/tracker.php?action=visit", { method: "POST" }).catch(() => {});

        // Fetch global download status
        try {
            const res = await fetch("/tracker.php?action=status");
            const data = await res.json();
            if (data && data.success && data.downloads) {
                currentCounter = data.downloads;
            }
        } catch (e) {
            console.error("[DownloadPage] Failed to fetch global counter status from server:", e);
            
            // Local fallback count
            const stored = localStorage.getItem("traderlog_downloads_total");
            if (stored) {
                const parsed = parseInt(stored, 10);
                if (!isNaN(parsed) && parsed >= baseCounter) {
                    currentCounter = parsed;
                }
            } else {
                localStorage.setItem("traderlog_downloads_total", String(baseCounter));
            }
        }
    });

    async function handleDownloadSubmit(e: Event) {
        e.preventDefault();

        if (!name.trim() || !email.trim()) {
            formError = "Por favor, preencha os campos obrigatórios (Nome e E-mail).";
            return;
        }

        isSubmitting = true;
        formError = "";

        try {
            // Register download and send lead details
            const res = await fetch("/tracker.php?action=download", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    whatsapp: whatsapp.trim()
                })
            });

            const data = await res.json();
            if (data && data.success && data.downloads) {
                currentCounter = data.downloads;
                localStorage.setItem("traderlog_downloads_total", String(data.downloads));
            }
        } catch (err) {
            console.error("[DownloadPage] Failed to send lead to domain tracker:", err);
            // Fallback: local counter increment
            if (!downloaded) {
                currentCounter++;
                localStorage.setItem("traderlog_downloads_total", String(currentCounter));
            }
        } finally {
            isSubmitting = false;
            downloaded = true;

            // Trigger file download automatically
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = "TraderLogPro_Setup.exe";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
</script>

<svelte:head>
    <title>Download TraderLog Pro | Versão de Teste Grátis</title>
    <meta name="description" content="Baixe a versão de testes do diário de trading definitivo para B3. Instalação rápida, offline-first e segura." />
</svelte:head>

<div class="relative min-h-screen bg-slate-950 font-inter selection:bg-emerald-500/20 selection:text-emerald-400">
    <!-- Ambient Background Gradients -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div class="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/3 blur-[120px] rounded-full"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col min-h-screen">
        <!-- Header -->
        <header class="relative z-50 border-b border-white/5 bg-slate-950/75 backdrop-blur-xl sticky top-0">
            <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <a href="/" class="flex items-center gap-2 group">
                    <Logo showText={true} width="230px" height="40px" />
                </a>
                
                <nav class="hidden md:flex items-center gap-8">
                    <a href="/#comparison" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Diferenciais</a>
                    <a href="/#modules" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Módulos</a>
                    <a href="/#pricing" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Planos</a>
                    <a href="/#faq" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">FAQ</a>
                    <a href="/download" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider">Download</a>
                </nav>

                <a href="/#pricing" class="relative group px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-outfit text-xs font-black uppercase tracking-widest overflow-hidden transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/10">
                    Obter Licença
                </a>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-grow max-w-4xl mx-auto px-6 py-16 w-full space-y-12">
            <!-- Download Status Card -->
            <div class="p-8 md:p-12 rounded-[2.5rem] bg-slate-900/40 border border-white/5 relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
                
                <div class="max-w-md mx-auto space-y-6">
                    <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                        {#if !downloaded}
                            <Download class="w-8 h-8 animate-bounce" />
                        {:else}
                            <ShieldCheck class="w-8 h-8 text-emerald-400" />
                        {/if}
                    </div>

                    <div class="space-y-2 text-center">
                        {#if !downloaded}
                            <h2 class="font-outfit text-2xl font-black text-white uppercase tracking-tight">Download do TraderLog Pro</h2>
                            <p class="text-sm text-slate-400">Preencha seus dados para receber o link e iniciar o download grátis.</p>
                        {:else}
                            <h2 class="font-outfit text-2xl font-black text-white uppercase tracking-tight">Download Iniciado!</h2>
                            <p class="text-sm text-slate-400">Obrigado por escolher o TraderLog Pro. Siga as instruções abaixo para começar.</p>
                        {/if}
                    </div>

                    <div class="pt-2">
                        {#if !downloaded}
                            <form onsubmit={handleDownloadSubmit} class="space-y-4 text-left">
                                <div class="space-y-1.5">
                                    <label for="name" class="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo *</label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        placeholder="Ex: João Silva"
                                        bind:value={name}
                                        class="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder:text-slate-600 text-xs font-medium focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div class="space-y-1.5">
                                    <label for="email" class="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail *</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="Ex: joao@email.com"
                                        bind:value={email}
                                        class="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder:text-slate-600 text-xs font-medium focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div class="space-y-1.5">
                                    <label for="whatsapp" class="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp / Celular (Opcional)</label>
                                    <input
                                        id="whatsapp"
                                        type="text"
                                        placeholder="Ex: (11) 99999-9999"
                                        bind:value={whatsapp}
                                        class="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder:text-slate-600 text-xs font-medium focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                {#if formError}
                                    <p class="text-xs text-rose-400 font-bold">{formError}</p>
                                {/if}

                                <div class="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        class="w-full inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-slate-950 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer font-bold"
                                    >
                                        {#if isSubmitting}
                                            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processando...
                                        {:else}
                                            <Download class="w-4 h-4" />
                                            Liberar & Iniciar Download
                                        {/if}
                                    </button>
                                </div>
                            </form>
                        {:else}
                            <div class="py-4 space-y-4 text-center">
                                <p class="text-sm text-slate-300 leading-relaxed font-semibold">
                                    O instalador <code class="text-emerald-400 font-mono text-xs">TraderLogPro_Setup.exe</code> foi enviado para o seu navegador.
                                </p>
                                <p class="text-xs text-slate-400">
                                    Se o download não iniciou automaticamente, 
                                    <button onclick={() => {
                                        const link = document.createElement("a");
                                        link.href = downloadUrl;
                                        link.download = "TraderLogPro_Setup.exe";
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }} class="text-emerald-400 underline font-bold bg-transparent border-none p-0 cursor-pointer">
                                        clique aqui para tentar novamente
                                    </button>.
                                </p>
                            </div>
                        {/if}

                        <div class="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950/35 w-fit mx-auto px-4 py-2.5 rounded-xl border border-white/5 shadow-inner mt-6">
                            <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span><strong class="text-emerald-400 font-black tracking-normal">{counterDisplay}</strong> traders já baixaram e estão testando</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Title: Instructions -->
            <div class="text-center space-y-3">
                <h3 class="font-outfit text-2xl font-black text-white uppercase tracking-tight">COMO INSTALAR O TRADERLOG PRO</h3>
                <p class="text-slate-400 text-sm max-w-xl mx-auto">Siga estes 4 passos simples para rodar o software de forma segura no seu computador.</p>
            </div>

            <!-- Step by Step Grid -->
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Step 1 -->
                <div class="p-6 rounded-3xl bg-slate-900/30 border border-white/5 flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Passo 01</span>
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Download class="w-4 h-4" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-outfit text-base font-black text-white uppercase">Baixe o Arquivo</h4>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Salve o instalador <code class="text-emerald-400 font-mono text-[10px]">TraderLogPro_Setup.exe</code> na sua pasta de preferência (geralmente downloads).
                        </p>
                    </div>
                </div>

                <!-- Step 2 -->
                <div class="p-6 rounded-3xl bg-slate-900/30 border border-white/5 flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] font-black uppercase tracking-widest text-amber-500">Passo 02 (Importante)</span>
                        <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <ShieldCheck class="w-4 h-4" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-outfit text-base font-black text-white uppercase">Aviso do SmartScreen</h4>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Como o instalador é novo e compilado de forma local (Tauri), o Windows SmartScreen pode alertar como "Aplicativo não reconhecido".
                        </p>
                        <div class="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-1.5">
                            <div class="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                <Info class="w-3.5 h-3.5" />
                                Como resolver:
                            </div>
                            <p class="text-[10px] text-slate-300 leading-normal">
                                1. Na janela azul do Windows, clique em <strong>"Mais informações"</strong> (More info).<br/>
                                2. Clique no botão <strong>"Executar assim mesmo"</strong> (Run anyway) que surgirá. O software é 100% livre de vírus.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Step 3 -->
                <div class="p-6 rounded-3xl bg-slate-900/30 border border-white/5 flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Passo 03</span>
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Play class="w-4 h-4" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-outfit text-base font-black text-white uppercase">Siga a Instalação</h4>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Basta avançar nas telas do instalador de forma convencional. Em poucos segundos, o atalho do aplicativo será criado na sua Área de Trabalho.
                        </p>
                    </div>
                </div>

                <!-- Step 4 -->
                <div class="p-6 rounded-3xl bg-slate-900/30 border border-white/5 flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Passo 04</span>
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <ArrowRightLeft class="w-4 h-4" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-outfit text-base font-black text-white uppercase">Sincronize seus Dados</h4>
                        <p class="text-xs text-slate-400 leading-relaxed">
                            Ao abrir o TraderLog Pro pela primeira vez, configure a sua conta de trading B3 e ative a conexão RTD ou integre com o Profit para ver seus dados sincronizarem em tempo real.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Guarantee and Security Badges -->
            <div class="p-6 rounded-3xl bg-slate-900/20 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div class="space-y-1">
                    <h5 class="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center sm:justify-start gap-2">
                        <ShieldCheck class="w-4 h-4 text-emerald-400" />
                        Privacidade Garantida
                    </h5>
                    <p class="text-[11px] text-slate-400 leading-relaxed">
                        Nossos instaladores são gerados nativamente a partir do código Rust. Criptografia local total.
                    </p>
                </div>
                <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Versão de Avaliação (Beta) · 100% Seguro
                </div>
            </div>
        </main>

        <!-- Footer -->
        <Footer />
    </div>
</div>

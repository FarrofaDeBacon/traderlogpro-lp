<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Logo from "$lib/components/shared/Logo.svelte";
    import Hero from "$lib/components/landing/Hero.svelte";
    import Comparison from "$lib/components/landing/Comparison.svelte";
    import Benefits from "$lib/components/landing/Benefits.svelte";
    import ActionDark from "$lib/components/landing/ActionDark.svelte";
    import GithubAudit from "$lib/components/landing/GithubAudit.svelte";
    import Offer from "$lib/components/landing/Offer.svelte";
    import FAQ from "$lib/components/landing/FAQ.svelte";
    import Footer from "$lib/components/landing/Footer.svelte";

    let visible = $state(false);

    onMount(() => {
        const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;
        if (isTauri) {
            goto("/dashboard");
        } else {
            visible = true;
        }
    });
</script>

<svelte:head>
    <title>TraderLogPro | O Diário de Trade Definitivo</title>
    <meta name="description" content="A velocidade e privacidade de um software desktop. Sincronize seu MT5 offline e de forma segura. Código aberto no GitHub." />
</svelte:head>

<div class="relative min-h-screen bg-slate-950 font-inter selection:bg-emerald-500/20 selection:text-emerald-700">

    <!-- Ambient Background Gradients -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div class="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/3 blur-[120px] rounded-full"></div>
    </div>

    <!-- Content Wrapper -->
    <div class="relative z-10 flex flex-col min-h-screen">
        <!-- Header / Navigation -->
        <header class="relative z-50 border-b border-white/5 bg-slate-950/75 backdrop-blur-xl sticky top-0">
            <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <a href="#" class="flex items-center gap-2 group">
                    <Logo showText={true} width="200px" height="36px" />
                </a>
                
                <nav class="hidden md:flex items-center gap-8">
                    <a href="#comparison" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Diferenciais</a>
                    <a href="#modules" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Módulos</a>
                    <a href="#github" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Open Source</a>
                    <a href="#pricing" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Planos</a>
                    <a href="#faq" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">FAQ</a>
                </nav>

                <a href="#pricing" class="relative group px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-outfit text-xs font-black uppercase tracking-widest overflow-hidden transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/10">
                    Obter Licença
                </a>
            </div>
        </header>

        <Hero {visible} />
        <Comparison />
        <Benefits />
        <ActionDark />
        <GithubAudit />
        <Offer />
        <FAQ />
        <Footer />
    </div>
</div>

<style>
    :global(.animate-bounce-slow) {
        animation: bounce-slow 4s infinite ease-in-out;
    }

    @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-16px); }
    }
</style>

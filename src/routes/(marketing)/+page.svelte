<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
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

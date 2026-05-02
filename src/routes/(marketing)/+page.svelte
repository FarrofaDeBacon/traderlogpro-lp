<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Hero from "$lib/components/landing/Hero.svelte";
    import Problem from "$lib/components/landing/Problem.svelte";
    import Solution from "$lib/components/landing/Solution.svelte";
    import Action from "$lib/components/landing/Action.svelte";
    import Benefits from "$lib/components/landing/Benefits.svelte";
    import HowItWorks from "$lib/components/landing/HowItWorks.svelte";
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
    <meta name="description" content="Pare de perder dinheiro por falta de controle nas suas operações. O diário de trade que transforma seus erros em consistência." />
</svelte:head>

<div class="relative min-h-screen bg-slate-50 text-slate-800 font-inter selection:bg-emerald-500/20 selection:text-emerald-700">

    <!-- Ambient Background Gradients -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div class="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
    </div>

    <!-- Content Wrapper -->
    <div class="relative z-10 flex flex-col min-h-screen">
        <Hero {visible} />
        <Problem />
        <Solution />
        <Action />
        <Benefits />
        <HowItWorks />
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

<script lang="ts">
    import "../../app.css";
    let { children } = $props();
</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-50 font-inter selection:bg-emerald-500/30 selection:text-emerald-400">
    <!-- Ambient Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div class="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
        {@render children()}
    </div>
</div>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }
    
    :global(body) {
        background-color: #0b0f19;
    }

    .font-inter { font-family: 'Inter', sans-serif; }
    .font-outfit { font-family: 'Outfit', sans-serif; }
</style>

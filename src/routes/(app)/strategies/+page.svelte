<script lang="ts">
    import { assetTypesStore } from "$lib/stores/asset-types.svelte";
    import { currenciesStore } from "$lib/stores/currencies.svelte";
    import { accountsStore } from "$lib/stores/accounts.svelte";
    import { tradesStore } from "$lib/stores/trades.svelte";
    import { userProfileStore } from "$lib/stores/user-profile.svelte.ts";
    import { workspaceStore } from "$lib/stores/workspace.svelte";
    import { t } from "svelte-i18n";
    import StrategyPerformanceCard from "$lib/components/strategies/StrategyPerformanceCard.svelte";
    import { Input } from "$lib/components/ui/input";
    import { Search, Filter, Plus, Layers, SlidersHorizontal, LayoutGrid, List } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Select from "$lib/components/ui/select";
    import { Separator } from "$lib/components/ui/separator";
    import { cn } from "$lib/utils";

    let searchTerm = $state("");
    let selectedType = $state("all");
    let viewMode = $state<"grid" | "list">("grid");

    // Filter Logic
    let filteredStrategies = $derived(
        workspaceStore.strategies.filter((s) => {
            const matchesSearch = s.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            const matchesType =
                selectedType === "all" ||
                s.asset_types.some((typeStr) => {
                    if (typeStr === selectedType) return true;
                    const selectedTypeName = assetTypesStore.assetTypes.find(
                        (at) => at.id === selectedType,
                    )?.name;
                    if (selectedTypeName === typeStr) return true;
                    return false;
                });

            return matchesSearch && matchesType;
        }),
    );
</script>

<div class="min-h-screen bg-background/50 flex flex-col">
    <!-- Institutional Header -->
    <header class="sticky top-0 z-30 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div class="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-6">
            <div class="flex items-center gap-4 shrink-0">
                <div class="p-2.5 bg-primary/10 rounded-xl">
                    <Layers class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 class="text-xs font-black uppercase tracking-[0.3em] text-foreground leading-none mb-1">
                        {$t("strategies.strategyList.title")}
                    </h1>
                    <p class="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        {filteredStrategies.length} {$t("nav.strategies")}
                    </p>
                </div>
            </div>

            <!-- Pill Search & Filters -->
            <div class="flex-1 flex items-center gap-3 max-w-2xl">
                <div class="relative flex-1 group">
                    <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        bind:value={searchTerm}
                        placeholder={$t("strategies.strategyList.searchPlaceholder")}
                        class="w-full h-10 pl-11 pr-4 bg-muted/5 border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none transition-all placeholder:text-muted-foreground/20"
                    />
                </div>

                <Select.Root type="single" bind:value={selectedType}>
                    <Select.Trigger class="w-[180px] h-10 bg-muted/5 border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest">
                        <Filter class="w-3.5 h-3.5 mr-2 text-primary" />
                        <span>
                            {assetTypesStore.assetTypes.find(t => t.id === selectedType)?.name || $t("trades.placeholders.all_types")}
                        </span>
                    </Select.Trigger>
                    <Select.Content class="bg-background/95 backdrop-blur-2xl border-white/10 rounded-2xl">
                        <Select.Item value="all" class="text-[9px] uppercase font-black tracking-widest">{$t("trades.placeholders.all_types")}</Select.Item>
                        {#each assetTypesStore.assetTypes as type}
                            <Select.Item value={type.id} class="text-[9px] uppercase font-black tracking-widest">{type.name}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <div class="flex items-center gap-3 shrink-0">
                <div class="flex p-1 bg-muted/5 border border-white/5 rounded-full">
                    <button 
                        class={cn("p-1.5 rounded-full transition-all", viewMode === "grid" ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" : "text-muted-foreground/40 hover:text-foreground")}
                        onclick={() => viewMode = "grid"}
                    >
                        <LayoutGrid class="w-3.5 h-3.5" />
                    </button>
                    <button 
                        class={cn("p-1.5 rounded-full transition-all", viewMode === "list" ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" : "text-muted-foreground/40 hover:text-foreground")}
                        onclick={() => viewMode = "list"}
                    >
                        <List class="w-3.5 h-3.5" />
                    </button>
                </div>
                <Button href="/settings/strategies" class="h-10 px-6 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Plus class="w-4 h-4 mr-2" />
                    {$t("strategies.strategyList.notFound.action")}
                </Button>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-[1600px] mx-auto w-full p-6 md:p-10">
        {#if filteredStrategies.length > 0}
            <div
                class={cn(
                    "grid gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700",
                    viewMode === "grid" 
                        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                        : "grid-cols-1"
                )}
            >
                {#each filteredStrategies as strategy (strategy.id)}
                    <StrategyPerformanceCard
                        {strategy}
                        {viewMode}
                        stats={tradesStore.getStrategyStats(
                            strategy.id,
                            accountsStore.accounts,
                            currenciesStore.currencies,
                            userProfileStore.userProfile,
                            "main",
                        )}
                    />
                {/each}
            </div>
        {:else}
            <div class="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-muted/5 animate-in zoom-in-95 duration-1000">
                <div class="p-8 bg-primary/5 rounded-[2rem] mb-8 relative">
                    <Search class="w-12 h-12 text-primary opacity-20" />
                    <div class="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping opacity-20"></div>
                </div>
                <h3 class="text-xs font-black uppercase tracking-[0.4em] text-foreground mb-3">
                    {$t("strategies.strategyList.notFound.title")}
                </h3>
                <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 max-w-sm text-center leading-loose">
                    {$t("strategies.strategyList.notFound.description")}
                </p>
                <Button variant="link" class="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-all" href="/settings/strategies">
                    {searchTerm ? $t("common.clear") : $t("strategies.strategyList.notFound.action")}
                </Button>
            </div>
        {/if}
    </main>
</div>

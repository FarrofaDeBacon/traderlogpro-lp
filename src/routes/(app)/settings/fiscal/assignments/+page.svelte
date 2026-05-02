<!-- Elite Terminal UI v2.1 -->
<script lang="ts">
    import { assetTypesStore } from "$lib/stores/asset-types.svelte";
    import { marketsStore } from "$lib/stores/markets.svelte";
    import { Tag, ExternalLink, Info, Plus, Search, ChevronRight } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { t } from "svelte-i18n";
    import { goto } from "$app/navigation";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { SystemListItem } from "$lib/components/ui/system";
    import { cn } from "$lib/utils";

    let searchTerm = $state("");
    let assetTypes = $derived(
        assetTypesStore.assetTypes.filter(at => 
            (at.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (at.code || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    $effect(() => {
        settingsHeaderStore.setActions(headerActions);
        return () => settingsHeaderStore.clearActions();
    });
</script>

{#snippet headerActions()}
    <div class="flex items-center gap-4">
        <div class="relative hidden md:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input 
                type="text" 
                bind:value={searchTerm}
                placeholder={$t("fiscal.settings.assignments.searchPlaceholder") || "BUSCAR ATRIBUIÇÕES..."}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground"
            />
        </div>
        <Button
            onclick={() => goto("/settings/asset-types")}
            class="rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("fiscal.settings.assignments.goToAssetTypes")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-8 animate-in fade-in duration-700">
    <div class="flex flex-col gap-3">
        {#each assetTypes as at}
            <SystemListItem raw={true} class="hover:border-primary/20 transition-all cursor-pointer group" onclick={() => goto("/settings/asset-types")}>
                <div class="relative flex items-center gap-6 shrink-0 text-left">
                    <div class="p-1 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-border dark:border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                        <Tag class="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
                    </div>
                    <div class="flex flex-col gap-1 min-w-[200px]">
                             <div class="flex items-center gap-2">
                                 <h4 class="font-bold text-sm tracking-tight text-foreground uppercase">{(at.name || "").toUpperCase()}</h4>
                                 <div class="h-4 w-[1px] bg-muted/10 mx-1"></div>
                                 <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                     {$t("fiscal.settings.assignments.table.code")}: {at.code}
                                 </span>
                             </div>
                    </div>
                </div>

                <div class="relative flex items-center gap-6">
                    <div class="hidden md:flex flex-col items-end gap-1 px-6 h-10 justify-center border-r border-border pr-8">
                        <span class="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] leading-none">{$t("fiscal.settings.assignments.table.fiscalProfile")}</span>
                        <span class="font-bold text-xs text-foreground tracking-tight leading-none uppercase">
                            {#if at.tax_profile_id}
                                {financialConfigStore.taxProfiles.find((p) => p.id === at.tax_profile_id)?.name || $t("fiscal.settings.assignments.table.unknownProfile")}
                            {:else}
                                <span class="text-muted-foreground/30 font-medium italic">{$t("fiscal.settings.assignments.table.defaultExempt")}</span>
                            {/if}
                        </span>
                    </div>
                    <div class="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                        <div class="p-2 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/20 transition-colors">
                            <ExternalLink class="w-4 h-4 text-primary" />
                        </div>
                    </div>
                    <ChevronRight class="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors hidden md:block" />
                </div>
            </SystemListItem>
        {:else}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl relative overflow-hidden group/empty">
                <div class="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover/empty:opacity-100 transition-opacity duration-1000"></div>
                <Tag class="w-20 h-20 opacity-5 mb-8 animate-pulse relative z-10" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30 relative z-10">{$t("fiscal.settings.assignments.table.empty")}</span>
                <Button 
                    variant="link" 
                    class="mt-8 text-[11px] font-black uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-all relative z-10 hover:scale-105 active:scale-95" 
                    onclick={() => goto("/settings/asset-types")}
                >
                    <Plus class="w-4 h-4 mr-2" />
                    {$t("fiscal.settings.assignments.goToAssetTypes")}
                </Button>
            </div>
        {/each}
    </div>

    <!-- Tip Box -->
    <div class="p-6 rounded-[2rem] bg-primary/[0.02] border border-primary/10 dark:border-primary/5 flex items-start gap-4 shadow-sm animate-in slide-in-from-bottom-4 duration-1000 delay-300">
        <div class="p-2.5 bg-primary/10 rounded-full mt-0.5">
            <Info class="w-4 h-4 text-primary" />
        </div>
        <div class="space-y-1">
            <h5 class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{$t("fiscal.settings.assignments.tip.title")}</h5>
            <p class="text-[11px] font-medium text-muted-foreground/80 leading-relaxed max-w-2xl italic">
                {$t("fiscal.settings.assignments.tip.text")}
            </p>
        </div>
    </div>
</div>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 6px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(255, 255, 255, 0.1); }
</style>

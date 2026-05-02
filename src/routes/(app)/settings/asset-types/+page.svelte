<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { assetTypesStore } from "$lib/stores/asset-types.svelte";
    import { marketsStore } from "$lib/stores/markets.svelte";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { appStore } from "$lib/stores/app.svelte";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { SystemCard, SystemSelect, SystemInput, SystemListItem } from "$lib/components/ui/system";
    import { Badge } from "$lib/components/ui/badge";
    import Skeleton from "$lib/components/ui/skeleton.svelte";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { Plus, Pencil, Trash2, ShieldCheck, Layers, Activity, Globe, Building2, CandlestickChart, Landmark, Bitcoin, ChevronDown, ChevronRight, Search } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import { cn } from "$lib/utils";
    import { keyboardList, keyboardForm } from "$lib/actions/keyboard-nav";
    import { toast } from "svelte-sonner";
    import { t } from "svelte-i18n";
    import { Switch } from "$lib/components/ui/switch";
    import { Label } from "$lib/components/ui/label";
    import type { AssetType } from "$lib/types";

    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);
    let expandedGroups = $state<Record<string, boolean>>({});
    let showFinancialRules = $state(false);

    function toggleGroup(group: string) {
        const isCurrentlyExpanded = expandedGroups[group];
        expandedGroups = {};
        if (!isCurrentlyExpanded) expandedGroups[group] = true;
    }

    $effect(() => {
        const keys = Object.keys(groupedTypes);
        if (keys.length > 0 && Object.keys(expandedGroups).length === 0) {
            expandedGroups[keys[0]] = true;
        }
    });

    let formData = $state<Omit<AssetType, "id">>({
        code: "",
        name: "",
        market_id: "",
        default_fee_id: "",
        tax_profile_id: "",
        unit_label: "",
        result_type: "currency",
        has_sectors: false,
    });

    function getIconForType(code: string = "") {
        const c = code.toUpperCase();
        if (c.includes("FUT")) return CandlestickChart;
        if (c.includes("STK") || c.includes("AÇÃO") || c.includes("ACOES")) return Landmark;
        if (c.includes("CRYPTO") || c.includes("CRIPTO") || c.includes("BTC")) return Bitcoin;
        if (c.includes("FOREX") || c.includes("FX")) return Globe;
        if (c.includes("FII")) return Building2;
        return Layers;
    }

    function openNew() {
        editingId = null;
        formData = { code: "", name: "", market_id: "", default_fee_id: "", tax_profile_id: "", unit_label: "", result_type: "currency", has_sectors: false };
        showFinancialRules = false;
        isDialogOpen = true;
    }

    function openEdit(item: AssetType) {
        editingId = item.id;
        formData = { code: item.code || "", name: item.name || "", market_id: item.market_id || "", default_fee_id: item.default_fee_id || "", tax_profile_id: item.tax_profile_id || "", unit_label: item.unit_label || "", result_type: item.result_type || "currency", has_sectors: item.has_sectors || false };
        showFinancialRules = !!(item.default_fee_id || item.tax_profile_id);
        isDialogOpen = true;
    }

    async function save() {
        if (editingId) await assetTypesStore.updateAssetType(editingId, $state.snapshot(formData));
        else await assetTypesStore.addAssetType($state.snapshot(formData));
        isDialogOpen = false;
        toast.success($t("common.saveSuccess"));
    }

    function requestDelete(id: string) { deleteId = id; isDeleteOpen = true; }

    async function confirmDelete() {
        if (deleteId) {
            const result = await assetTypesStore.deleteAssetType(deleteId);
            if (result.success) {
                toast.success($t("common.deleteSuccess"));
            } else {
                toast.error($t(result.error || "common.error"));
            }
            deleteId = null; isDeleteOpen = false;
        }
    }

    let assetTypes = $derived(
        assetTypesStore.assetTypes.filter(at => at.name.toLowerCase().includes(searchTerm.toLowerCase()) || at.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    let groupedTypes = $derived(
        assetTypes.reduce((acc, type) => {
            const marketName = marketsStore.getMarketName(type.market_id) || $t("settings.assetTypes.noMarket");
            if (!acc[marketName]) acc[marketName] = [];
            acc[marketName].push(type);
            return acc;
        }, {} as Record<string, AssetType[]>)
    );

    $effect(() => {
        if (!showFinancialRules && !editingId) {
            formData.default_fee_id = "";
            formData.tax_profile_id = "";
        }
    });

    $effect(() => {
        settingsHeaderStore.setActions(headerActions);
        return () => settingsHeaderStore.clearActions();
    });
</script>

{#snippet headerActions()}
    <div class="flex items-center gap-4 text-foreground">
        <div class="relative hidden md:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input 
                type="text" 
                bind:value={searchTerm}
                placeholder={$t("settings.assetTypes.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-full text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground"
            />
        </div>
        <Button onclick={openNew} class="rounded-full px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus class="w-4 h-4 mr-2" />
            {$t("settings.assetTypes.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">
    <div class="grid gap-10 pt-8" use:keyboardList>
        {#if appStore.isLoadingData && Object.keys(groupedTypes).length === 0}
            <div class="space-y-6">
                <Skeleton class="h-10 w-64 rounded-xl bg-white/5" />
                <div class="flex flex-col gap-3">
                    {#each Array(3) as _}
                        <Skeleton class="h-20 rounded-2xl bg-white/5" />
                    {/each}
                </div>
            </div>
        {:else if Object.keys(groupedTypes).length > 0}
            {#each Object.entries(groupedTypes) as [marketName, items]}
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button 
                        type="button" 
                        class="flex items-center gap-3 px-2 group w-full text-left outline-none" 
                        onclick={() => toggleGroup(marketName)}
                    >
                        <div class="p-1.5 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                            <Globe class="w-3.5 h-3.5 text-primary" />
                        </div>
                        <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">{marketName}</h4>
                        <div class="h-[1px] flex-1 bg-muted/10 mx-2"></div>
                        {#if expandedGroups[marketName]}
                            <ChevronDown class="w-4 h-4 text-muted-foreground/40" />
                        {:else}
                            <ChevronRight class="w-4 h-4 text-muted-foreground/40" />
                        {/if}
                    </button>

                    {#if expandedGroups[marketName]}
                        <div transition:slide={{ duration: 200 }} class="flex flex-col gap-3">
                            {#each items as type}
                                {@const Icon = getIconForType(type.code)}
                                <SystemListItem raw={true} onclick={() => openEdit(type)}>
                                    <div class="relative flex items-center gap-6 shrink-0">
                                        <div class="p-1 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors w-10 h-10 flex items-center justify-center border border-border/50">
                                            <Icon class="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div class="flex flex-col gap-0.5 min-w-[160px]">
                                            <div class="flex items-center gap-2">
                                                <h4 class="font-bold text-sm tracking-tight text-foreground uppercase">{(type.name || "").toUpperCase()}</h4>
                                                <div class="h-4 w-[1px] bg-muted/10 mx-1"></div>
                                                <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{type.code}</span>
                                            </div>
                                            <div class="flex items-center gap-4 text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest leading-none">
                                                <div class="flex items-center gap-1.5">
                                                    <span class={cn(type.default_fee_id ? "text-primary" : "text-white/20")}>{financialConfigStore.fees.find(f => f.id === type.default_fee_id)?.name || $t("settings.assetTypes.placeholders.globalDefault")}</span>
                                                    <span class="text-[8px] opacity-30 tracking-tighter">{$t("fees.messages.trades_count").toUpperCase()}</span>
                                                </div>
                                                <div class="h-2 w-[1px] bg-muted/10 mx-1"></div>
                                                <div class="flex items-center gap-1.5">
                                                    <span class={cn(type.tax_profile_id ? "text-emerald-500" : "text-white/20")}>{financialConfigStore.taxProfiles.find(p => p.id === type.tax_profile_id)?.name || $t("settings.assetTypes.placeholders.globalDefault")}</span>
                                                    <span class="text-[8px] opacity-30 tracking-tighter">{$t("settings.nav.sections.fiscal").toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="relative flex items-center gap-6">
                                        <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                            <Button variant="ghost" size="sm" class="h-8 rounded-xl px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border transition-all" onclick={(e) => { e.stopPropagation(); requestDelete(type.id); }}>
                                                <Trash2 class="w-4 h-4" />
                                            </Button>
                                            <div class="p-2 bg-muted/20 dark:bg-white/5 rounded-xl md:flex hidden group-hover:bg-primary/20 transition-colors">
                                                <Pencil class="w-3.5 h-3.5 text-primary" />
                                            </div>
                                        </div>
                                        <ChevronRight class="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors hidden md:block" />
                                    </div>
                                </SystemListItem>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        {:else}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Layers class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50">{$t("settings.assetTypes.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                    {searchTerm ? $t("common.clear").toUpperCase() : $t("settings.assetTypes.createFirst")}
                </Button>
            </div>
        {/if}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[500px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-xl"><Layers class="w-5 h-5 text-primary" /></div>
                    {editingId ? $t("settings.assetTypes.edit") : $t("settings.assetTypes.new")}
                </DialogTitle>
            </DialogHeader>
        </div>

        <div class="px-8 py-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" use:keyboardForm>
            <div class="grid grid-cols-2 gap-4">
                <SystemInput label={$t("settings.assetTypes.fields.code")} bind:value={formData.code} placeholder="Ex: STK" />
                <SystemInput label={$t("settings.assetTypes.fields.name")} bind:value={formData.name} placeholder="Ex: Ações" />
            </div>

            <SystemSelect 
                label={$t("settings.assetTypes.fields.market")}
                bind:value={formData.market_id}
                options={marketsStore.markets.map(m => ({ value: m.id, label: `${m.name} (${m.code})` }))}
                placeholder={$t("settings.assetTypes.placeholders.selectMarket")}
            />

            <div class="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border">
                <div class="flex flex-col gap-1">
                    <Label class="text-[10px] font-bold uppercase tracking-widest">{$t("settings.assetTypes.fields.financialRules")}</Label>
                    <span class="text-[9px] opacity-40 font-medium uppercase">{$t("settings.assetTypes.fields.financialRulesDesc")}</span>
                </div>
                <Switch bind:checked={showFinancialRules} />
            </div>

            <div class="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border">
                <div class="flex flex-col gap-1">
                    <Label class="text-[10px] font-bold uppercase tracking-widest">{$t("settings.assetTypes.fields.hasSectors")}</Label>
                    <span class="text-[9px] opacity-40 font-medium uppercase">{$t("settings.assetTypes.fields.hasSectorsDesc")}</span>
                </div>
                <Switch bind:checked={formData.has_sectors} />
            </div>
            
            {#if showFinancialRules}
                <div transition:slide class="grid grid-cols-2 gap-4 pt-2">
                    <SystemSelect label={$t("settings.assetTypes.fields.defaultFees")} bind:value={formData.default_fee_id} options={financialConfigStore.fees.map(f => ({ value: f.id, label: f.name }))} placeholder={$t("settings.assetTypes.placeholders.globalDefault")} />
                    <SystemSelect label={$t("settings.assetTypes.fields.taxProfile")} bind:value={formData.tax_profile_id} options={financialConfigStore.taxProfiles.map(p => ({ value: p.id, label: p.name }))} placeholder={$t("settings.assetTypes.placeholders.globalDefault")} />
                </div>
            {/if}

            <div class="grid grid-cols-2 gap-4 pb-4">
                <SystemInput label={$t("settings.assetTypes.fields.unitLabel")} bind:value={formData.unit_label} placeholder="Ex: un, lot" />
                <SystemSelect label={$t("settings.assetTypes.fields.resultType")} bind:value={formData.result_type} options={[{ value: "currency", label: $t("settings.assetTypes.options.monetary") }, { value: "points", label: $t("settings.assetTypes.options.points") }]} />
            </div>
        </div>

        <DialogFooter class="p-8 bg-muted/5 border-t border-border flex flex-row items-center justify-end gap-3">
            <Button variant="outline" class="h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]" onclick={() => (isDialogOpen = false)}>{$t("common.cancel")}</Button>
            <Button class="h-11 flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" onclick={save}>{editingId ? $t("common.saveChanges") : $t("common.create")}</Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 6px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(255, 255, 255, 0.1); }
</style>

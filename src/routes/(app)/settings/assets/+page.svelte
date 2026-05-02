<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { assetTypesStore } from "$lib/stores/asset-types.svelte";
    import { assetsStore } from "$lib/stores/assets.svelte";
    import { sectorsStore } from "$lib/stores/sectors.svelte";
    import { Plus, Pencil, Trash2, Search, PieChart, CandlestickChart, Landmark, Bitcoin, Globe, Layers, Activity, Building2, FileSpreadsheet, Link, ChevronDown, ChevronRight, ShieldCheck, ShieldAlert, Factory, LineChart, Cpu, ShoppingCart, Shovel, HeartPulse, Droplets, Zap, Wallet, Palette, Smile } from "lucide-svelte";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { SystemCard, SystemSelect, SystemInput, SystemListItem } from "$lib/components/ui/system";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { appStore } from "$lib/stores/app.svelte";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { workspaceStore } from "$lib/stores/workspace.svelte";
    import { rtdStore } from "$lib/stores/rtd.svelte";
    import { keyboardList } from "$lib/actions/keyboard-nav";
    import type { Asset } from "$lib/types";
    import { t } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import RTDImportDialog from "$lib/components/settings/RTDImportDialog.svelte";
    import Skeleton from "$lib/components/ui/skeleton.svelte";
    import { toast } from "svelte-sonner";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { slide } from "svelte/transition";
    import { cn } from "$lib/utils";

    let isDialogOpen = $state(false);
    let isImportOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");
    let expandedTypes = $state<Record<string, boolean>>({});
    let expandedSectors = $state<Record<string, boolean>>({});
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    function toggleType(typeId: string) { 
        const isCurrentlyExpanded = expandedTypes[typeId];
        expandedTypes = {};
        if (!isCurrentlyExpanded) expandedTypes[typeId] = true;
    }
    function toggleSector(typeId: string, sectorId: string) {
        const key = `${typeId}::${sectorId}`;
        const isCurrentlyExpanded = expandedSectors[key];
        expandedSectors = {};
        if (!isCurrentlyExpanded) expandedSectors[key] = true;
    }

    let selectedIds = $state<Set<string>>(new Set());
    let bulkAssetTypeId = $state("");
    let bulkSectorId = $state("");

    function toggleSelection(id: string) {
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
        selectedIds = new Set(selectedIds);
    }

    function toggleAllInGroup(assets: Asset[]) {
        const allSelected = assets.every(a => selectedIds.has(a.id));
        if (allSelected) {
            assets.forEach(a => selectedIds.delete(a.id));
        } else {
            assets.forEach(a => selectedIds.add(a.id));
        }
        selectedIds = new Set(selectedIds);
    }

    async function applyBulkUpdate() {
        if (selectedIds.size === 0) return;
        
        if (bulkAssetTypeId) {
            await assetsStore.bulkUpdateAssetType(Array.from(selectedIds), bulkAssetTypeId);
        }
        
        if (bulkSectorId) {
            await assetsStore.bulkUpdateSector(Array.from(selectedIds), bulkSectorId);
        }
        
        toast.success($t("common.saveSuccess"));
        selectedIds = new Set();
        bulkAssetTypeId = "";
        bulkSectorId = "";
    }

    let formData = $state<Omit<Asset, "id">>({
        symbol: "",
        name: "",
        asset_type_id: "",
        point_value: 1,
        contract_size: 1,
        default_fee_id: "",
        tax_profile_id: "",
        sector_id: "",
        subsector_id: "",
        is_root: false,
        root_id: "none",
    });

    let selectedMacroSector = $state("");

    let availableMacros = $derived([...new Set(sectorsStore.sectors.map(s => s.macro_sector))].filter(Boolean));
    let availableSectors = $derived(selectedMacroSector ? sectorsStore.sectors.filter(s => s.macro_sector === selectedMacroSector) : []);
    let availableSegments = $derived(formData.sector_id ? sectorsStore.getSubsectorsBySector(formData.sector_id) : []);

    function getAssetTypeStyle(code: string = "") {
        const c = code.toUpperCase();
        if (c.includes("FUT")) return { icon: CandlestickChart, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/10" };
        if (c.includes("STK") || c.includes("AÇÃO") || c.includes("ACOES")) return { icon: Landmark, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/10" };
        if (c.includes("CRYPTO") || c.includes("CRIPTO") || c.includes("BTC")) return { icon: Bitcoin, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/10" };
        if (c.includes("FOREX") || c.includes("FX")) return { icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/10" };
        if (c.includes("FII")) return { icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/10" };
        return { icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" };
    }

    let groupedAssets = $derived.by(() => {
        const groups: Record<string, any> = {};
        const allAssets = [...assetsStore.assets]
            .filter(a => (a.symbol || "").toLowerCase().includes(searchTerm.toLowerCase()) || ((a.name || "").toLowerCase().includes(searchTerm.toLowerCase())))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));

        for (const asset of allAssets) {
            const typeId = asset.asset_type_id || "unclassified";
            const type = assetTypesStore.assetTypes.find(t => t.id === typeId);
            const style = getAssetTypeStyle(type?.code || "");
            
            if (!groups[typeId]) {
                groups[typeId] = { 
                    name: type?.name || $t("settings.assetTypes.noMarket"), 
                    icon: style.icon, 
                    color: style.color.replace('text-', ''), 
                    has_sectors: type?.has_sectors ?? true,
                    sectors: {} 
                };
            }
            
            // Se o tipo não usa setores, ignoramos o sector_id do ativo e usamos "none"
            const useSectors = type?.has_sectors ?? true;
            const sectorId = useSectors ? (asset.sector_id || "unclassified") : "none";
            const sector = sectorsStore.sectors.find(s => s.id === sectorId);
            
            if (!groups[typeId].sectors[sectorId]) {
                groups[typeId].sectors[sectorId] = { 
                    name: sector?.name || (sectorId === "none" ? "" : $t("common.others")), 
                    icon: sectorsStore.getSectorIcon(sectorId), 
                    color: sectorsStore.getSectorColor(sectorId), 
                    subsectors: {} 
                };
            }

            const subId = asset.subsector_id || "none";
            const sub = sectorsStore.subsectors.find(s => s.id === subId);

            if (!groups[typeId].sectors[sectorId].subsectors[subId]) groups[typeId].sectors[sectorId].subsectors[subId] = { name: sub?.name || $t("common.all"), assets: [] };
            
            groups[typeId].sectors[sectorId].subsectors[subId].assets.push(asset);
        }
        return groups;
    });

    let hasInitializedExpansion = $state(false);

    $effect(() => {
        if (hasInitializedExpansion) return;
        
        const typeKeys = Object.keys(groupedAssets);
        if (typeKeys.length > 0) {
            const firstType = typeKeys[0];
            expandedTypes[firstType] = true;
            
            const sectorKeys = Object.keys(groupedAssets[firstType].sectors);
            if (sectorKeys.length > 0) {
                expandedSectors[`${firstType}::${sectorKeys[0]}`] = true;
            }
            hasInitializedExpansion = true;
        }
    });


    function openNew() {
        editingId = null;
        selectedMacroSector = "";
        formData = { symbol: "", name: "", asset_type_id: "", point_value: 1, contract_size: 1, default_fee_id: "", tax_profile_id: "", sector_id: "", subsector_id: "", is_root: false, root_id: "none" };
        isDialogOpen = true;
    }

    function openEdit(item: Asset) {
        editingId = item.id;
        const currentSector = sectorsStore.sectors.find(s => s.id === item.sector_id);
        selectedMacroSector = currentSector?.macro_sector || "";
        
        formData = { symbol: item.symbol || "", name: item.name || "", asset_type_id: item.asset_type_id || "", point_value: item.point_value ?? 1, contract_size: item.contract_size ?? 1, default_fee_id: item.default_fee_id || "", tax_profile_id: item.tax_profile_id || "", sector_id: item.sector_id || "", subsector_id: item.subsector_id || "", is_root: item.is_root || false, root_id: item.root_id || "none" };
        isDialogOpen = true;
    }

    async function save() {
        const dataToSave = { ...formData, root_id: formData.root_id === "none" ? undefined : formData.root_id } as Omit<Asset, "id">;
        if (editingId) await assetsStore.updateAsset(editingId, dataToSave);
        else await assetsStore.addAsset(dataToSave);
        isDialogOpen = false;
    }

    function requestDelete(id: string) { deleteId = id; isDeleteOpen = true; }

    async function confirmDelete() {
        if (deleteId) {
            const result = await assetsStore.deleteAsset(deleteId);
            if (result.success) {
                toast.success($t("common.deleteSuccess"));
            } else {
                toast.error($t(result.error || "common.error"));
            }
            deleteId = null; 
        } else if (selectedIds.size > 0) {
            const report = await assetsStore.bulkDeleteAssets(Array.from(selectedIds));
            if (report.skipped > 0) {
                toast.warning($t("common.bulkDeletePartial", { values: { deleted: report.deleted, skipped: report.skipped } }));
            } else if (report.deleted > 0) {
                toast.success($t("common.bulkDeleteSuccess"));
            }
            selectedIds = new Set();
        }
        isDeleteOpen = false;
    }

    function requestBulkDelete() {
        deleteId = null;
        isDeleteOpen = true;
    }

    let rootAssets = $derived(assetsStore.assets.filter((a) => a.is_root && a.id !== editingId));

    $effect(() => {
        settingsHeaderStore.setActions(headerActions);
        return () => settingsHeaderStore.clearActions();
    });
</script>



{#snippet headerActions()}
    <div class="flex items-center gap-4">
        <div class="relative hidden md:block">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
            <Input bind:value={searchTerm} placeholder={$t("assets.searchPlaceholder")} class="pl-10 h-12 bg-card/50 border-border/40 focus:border-primary/50 transition-all rounded-xl shadow-inner w-64" />
        </div>
        <Button variant="outline" onclick={() => (isImportOpen = true)} class="h-9 px-6 font-bold border-border hover:bg-muted/10 transition-all rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground">
            <FileSpreadsheet class="w-4 h-4 text-emerald-500" />
            {$t("assets.buttons.syncRTD")}
        </Button>
        <Button onclick={openNew} class="rounded-full px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus class="w-4 h-4 mr-2" />
            {$t("assets.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">
    <RTDImportDialog bind:open={isImportOpen} />
    <div class="grid gap-6 pt-4" use:keyboardList>
        {#if appStore.isLoadingData && Object.keys(groupedAssets).length === 0}
            <Skeleton class="h-10 w-64 rounded-xl bg-white/5" />
        {:else if Object.keys(groupedAssets).length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-card/40 backdrop-blur-xl text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Layers class="w-20 h-20 opacity-10 mb-8" />
                <span class="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60 mb-8">{$t("assets.empty")}</span>
                <button 
                    onclick={openNew}
                    class="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-all hover:scale-105 active:scale-95"
                >
                    {searchTerm ? $t("common.clear") : $t("assets.form.createFirst")}
                </button>
            </div>
        {:else if Object.keys(groupedAssets).length > 0}
            {#each Object.entries(groupedAssets) as [typeId, typeGroup]}
                {@const tStyle = getAssetTypeStyle(assetTypesStore.assetTypes.find(t => t.id === typeId)?.code)}
                <div class="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div class="flex items-center gap-3 px-2 group w-full text-left outline-none">
                        <Checkbox 
                            checked={Object.values(typeGroup.sectors).every((s: any) => Object.values(s.subsectors).every((sub: any) => sub.assets.every((a: any) => selectedIds.has(a.id))))}
                            onCheckedChange={() => {
                                const allAssets = Object.values(typeGroup.sectors).flatMap((s: any) => Object.values(s.subsectors).flatMap((sub: any) => sub.assets));
                                toggleAllInGroup(allAssets);
                            }}
                            class="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <button 
                            type="button" 
                            class="flex items-center gap-3 flex-1 text-left outline-none" 
                            onclick={() => toggleType(typeId)}
                        >
                            <div class={cn("p-1.5 rounded-md transition-colors", tStyle.bg, tStyle.color)}>
                                <svelte:component this={typeGroup.icon} class="w-3.5 h-3.5" />
                            </div>
                            <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">{typeGroup.name}</h4>
                            <div class="h-[1px] flex-1 bg-muted/10 mx-2"></div>
                            {#if expandedTypes[typeId]}
                                <ChevronDown class="w-4 h-4 text-muted-foreground/40" />
                            {:else}
                                <ChevronRight class="w-4 h-4 text-muted-foreground/40" />
                            {/if}
                        </button>
                    </div>

                    {#if expandedTypes[typeId]}
                        <div transition:slide={{ duration: 400 }} class="space-y-4 pb-4">
                            {#each Object.entries(typeGroup.sectors) as [sectorId, sector]}
                                {#if typeGroup.has_sectors && sectorId !== 'none'}
                                    <div class="space-y-2">
                                        <button 
                                            type="button" 
                                            class="flex items-center gap-3 px-2 py-2 group/sector w-full text-left outline-none" 
                                            onclick={() => toggleSector(typeId, sectorId)}
                                        >
                                            <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 group-hover/sector:bg-primary/50 transition-colors"></div>
                                            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                                                {sectorId === 'unclassified' ? $t("common.others") : sector.name}
                                            </span>
                                            <div class="h-[1px] flex-1 bg-muted/5 mx-2"></div>
                                            {#if expandedSectors[`${typeId}::${sectorId}`]}
                                                <ChevronDown class="w-3.5 h-3.5 text-muted-foreground/30" />
                                            {:else}
                                                <ChevronRight class="w-3.5 h-3.5 text-muted-foreground/30" />
                                            {/if}
                                        </button>

                                        {#if expandedSectors[`${typeId}::${sectorId}`]}
                                            <div transition:slide={{ duration: 300 }} class={cn("space-y-3 pb-4", sectorId !== 'unclassified' && "pt-1")}>
                                                {#each Object.entries(sector.subsectors) as [subId, subGroup]}
                                                    <div class="space-y-2">
                                                        {#each subGroup.assets as asset}
                                                            {@const tStyle = getAssetTypeStyle(assetTypesStore.assetTypes.find(t => t.id === asset.asset_type_id)?.code)}
                                                            <SystemListItem raw={true} onclick={() => openEdit(asset)}>
                                                                <div class="flex items-center gap-4 flex-1">
                                                                    <div onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="button" tabindex={0} class="pl-2">
                                                                        <Checkbox 
                                                                            checked={selectedIds.has(asset.id)} 
                                                                            onCheckedChange={() => toggleSelection(asset.id)}
                                                                            class="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                        />
                                                                    </div>
                                                                    <div class="relative flex items-center gap-6 shrink-0">
                                                                        <div class="p-1 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors w-10 h-10 flex items-center justify-center border border-border/50">
                                                                            <svelte:component this={tStyle.icon} class="w-5 h-5" />
                                                                        </div>
                                                                        <div class="flex flex-col gap-0.5">
                                                                            <div class="flex items-center gap-2">
                                                                                <h4 class="font-bold text-sm tracking-tight text-foreground uppercase">{(asset.symbol || "").toUpperCase()}</h4>
                                                                                {#if asset.is_root}
                                                                                    <Badge variant="outline" class="w-fit text-[8px] h-3.5 font-black py-0 bg-emerald-500/10 text-emerald-500 border-none uppercase tracking-tighter">{$t("assets.labels.root")}</Badge>
                                                                                {/if}
                                                                                
                                                                                {#if rtdStore.quotes[(asset.symbol || "").toUpperCase()]}
                                                                                    <div class="flex items-center gap-1.5 ml-2 animate-in fade-in duration-500">
                                                                                        <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                                        <span class="text-[11px] font-mono font-bold text-emerald-500">
                                                                                            {rtdStore.quotes[(asset.symbol || "").toUpperCase()].last.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                        </span>
                                                                                    </div>
                                                                                {/if}
                                                                            </div>
                                                                            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{(asset.name || "").toUpperCase()}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div class="relative flex items-center gap-6">
                                                                    <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                                                        <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:border-destructive/50 border border-transparent transition-all rounded-xl" onclick={(e) => { e.stopPropagation(); requestDelete(asset.id); }}>
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
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {:else}
                                    <!-- Visual Direto para Índices/Futuros (Sem Setores) -->
                                    <div class="space-y-3 pt-1 pb-4">
                                        {#each Object.values(sector.subsectors) as subGroup}
                                            {#each subGroup.assets as asset}
                                                {@const tStyle = getAssetTypeStyle(assetTypesStore.assetTypes.find(t => t.id === asset.asset_type_id)?.code)}
                                                <SystemListItem raw={true} onclick={() => openEdit(asset)}>
                                                    <div class="flex items-center gap-4 flex-1">
                                                        <div onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="button" tabindex={0} class="pl-2">
                                                            <Checkbox 
                                                                checked={selectedIds.has(asset.id)} 
                                                                onCheckedChange={() => toggleSelection(asset.id)}
                                                                class="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                        </div>
                                                        <div class="relative flex items-center gap-6 shrink-0">
                                                            <div class="p-1 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors w-10 h-10 flex items-center justify-center border border-border/50">
                                                                <svelte:component this={tStyle.icon} class="w-5 h-5" />
                                                            </div>
                                                            <div class="flex flex-col gap-0.5">
                                                                <div class="flex items-center gap-2">
                                                                    <h4 class="font-bold text-sm tracking-tight text-foreground uppercase">{(asset.symbol || "").toUpperCase()}</h4>
                                                                    {#if asset.is_root}
                                                                        <Badge variant="outline" class="w-fit text-[8px] h-3.5 font-black py-0 bg-emerald-500/10 text-emerald-500 border-none uppercase tracking-tighter">{$t("assets.labels.root")}</Badge>
                                                                    {/if}
                                                                    
                                                                    {#if rtdStore.quotes[(asset.symbol || "").toUpperCase()]}
                                                                        <div class="flex items-center gap-1.5 ml-2 animate-in fade-in duration-500">
                                                                            <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                            <span class="text-[11px] font-mono font-bold text-emerald-500">
                                                                                {rtdStore.quotes[(asset.symbol || "").toUpperCase()].last.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                    {/if}
                                                                </div>
                                                                <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{(asset.name || "").toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="relative flex items-center gap-6">
                                                        <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                                            <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:border-destructive/50 border border-transparent transition-all rounded-xl" onclick={(e) => { e.stopPropagation(); requestDelete(asset.id); }}>
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
                                        {/each}
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>

    {#if selectedIds.size > 0}
        <div 
            transition:slide={{ axis: 'y' }} 
            class="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-card/80 backdrop-blur-xl border border-primary/20 rounded-[2rem] px-8 py-4 shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10"
        >
            <div class="flex flex-col">
                <span class="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                    {selectedIds.size} {$t("common.selected")}
                </span>
                <span class="text-[11px] font-bold text-foreground/70 uppercase tracking-widest leading-none">
                    {$t("assets.bulk.actions")}
                </span>
            </div>

            <div class="h-8 w-[1px] bg-border/40"></div>

            <div class="flex items-center gap-4">
                <div class="w-48">
                    <SystemSelect 
                        label={$t("assets.bulk.changeType").toUpperCase()} 
                        bind:value={bulkAssetTypeId} 
                        options={assetTypesStore.assetTypes.map(t => ({ value: t.id, label: t.name || t.code }))} 
                        placeholder={$t("common.selectEllipsis")}
                    />
                </div>
                <div class="w-48">
                    <SystemSelect 
                        label={$t("assets.bulk.changeSector").toUpperCase()} 
                        bind:value={bulkSectorId} 
                        options={sectorsStore.sectors.map(s => ({ value: s.id, label: s.name }))} 
                        placeholder={$t("common.selectEllipsis")}
                    />
                </div>
                <Button 
                    onclick={applyBulkUpdate} 
                    disabled={!bulkAssetTypeId && !bulkSectorId}
                    class="h-10 rounded-xl px-8 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {$t("common.apply")}
                </Button>
            </div>

            <Button 
                variant="ghost" 
                onclick={requestBulkDelete} 
                class="h-10 w-10 rounded-full hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
            >
                <Trash2 class="w-4 h-4" />
            </Button>
        </div>
    {/if}
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[600px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-1.5 rounded-xl bg-primary/10">
                        <CandlestickChart class="w-5 h-5 text-primary" />
                    </div>
                    {editingId ? $t("assets.edit") : $t("assets.new")}
                </DialogTitle>
            </DialogHeader>
        </div>

        <div class="px-8 py-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-2 gap-4">
                <SystemInput label={$t("assets.form.symbol")} bind:value={formData.symbol} placeholder={$t("assets.form.symbolPlaceholder")} class="h-12 uppercase font-bold" />
                <SystemInput label={$t("assets.form.name")} bind:value={formData.name} placeholder={$t("assets.form.namePlaceholder")} class="h-12 font-bold" />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <SystemInput label={$t("assets.form.pointValue")} type="number" bind:value={formData.point_value} class="h-12 font-bold px-4" />
                <SystemInput label={$t("assets.form.contractSize")} type="number" bind:value={formData.contract_size} class="h-12 font-bold px-4" />
            </div>
            <div class="space-y-6">
                <div class="flex items-center space-x-3 pt-2">
                    <Checkbox id="is_root" bind:checked={formData.is_root} onCheckedChange={(v) => { if (v) formData.root_id = "none"; }} />
                    <label for="is_root" class="text-[11px] uppercase font-bold tracking-widest text-foreground/70 cursor-pointer">{$t("assets.form.isRoot")}</label>
                </div>
                
                <div class="space-y-4">
                    {#if !formData.is_root}
                        <SystemSelect label={$t("assets.form.rootAsset")} bind:value={formData.root_id} options={(rootAssets || []).map(r => ({ value: r.id, label: r.symbol }))} placeholder={$t("assets.labels.none")} />
                    {/if}
                        <SystemSelect label={$t("settings.nav.assetTypes").toUpperCase()} bind:value={formData.asset_type_id} options={(assetTypesStore.assetTypes || []).map(t => ({ value: t.id, label: t.name || t.code }))} />
                    
                    {#if assetTypesStore.assetTypes.find(t => t.id === formData.asset_type_id)?.has_sectors}
                        <div class="space-y-6">
                            <Separator />
                            <div class="space-y-1">
                                <Button class="h-11 w-full rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" onclick={save}>{editingId ? $t("common.saveChanges") : $t("common.create")}</Button>
                                <p class="text-[9px] text-muted-foreground/50 uppercase tracking-widest">{$t("settings.nav.descriptions.sectors")}</p>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <SystemSelect 
                                    label={$t("sectors.form.level1")} 
                                    bind:value={selectedMacroSector} 
                                    options={(availableMacros || []).map(m => ({ value: m, label: m }))} 
                                    placeholder={$t("sectors.form.macroSectorPlaceholder")} 
                                />
                                <SystemSelect 
                                    label={$t("sectors.form.level2")} 
                                    bind:value={formData.sector_id} 
                                    options={(availableSectors || []).map(s => ({ value: s.id, label: s.name }))} 
                                    placeholder={$t("sectors.form.namePlaceholder")}
                                    disabled={!selectedMacroSector}
                                />
                            </div>
                            <SystemSelect 
                                label={$t("sectors.form.level3")} 
                                bind:value={formData.subsector_id} 
                                options={(availableSegments || []).map(ss => ({ value: ss.id, label: ss.name }))} 
                                placeholder={$t("sectors.subsectors.namePlaceholder")}
                                disabled={!formData.sector_id}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <DialogFooter class="p-8 bg-muted/5 border-t border-border flex flex-row items-center justify-end gap-3">
            <Button variant="ghost" onclick={() => isDialogOpen = false} class="rounded-full px-6 h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">{$t("assets.form.cancel")}</Button>
            <Button onclick={save} class="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">{$t("assets.form.saveChanges")}</Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<style>
    :global([role="button"]:focus-visible) {
        outline: none !important;
        border-color: var(--color-emerald-500) !important;
        background-color: var(--color-emerald-500/5) !important;
        box-shadow: 0 0 0 2px var(--color-emerald-500/20) !important;
    }
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 6px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(255, 255, 255, 0.1); }
</style>

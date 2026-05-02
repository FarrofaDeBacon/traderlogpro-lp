<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { sectorsStore } from "$lib/stores/sectors.svelte";
    import { Switch } from "$lib/components/ui/switch";
    import { marketsStore } from "$lib/stores/markets.svelte";
    import { Plus, Pencil, Trash2, Layers, Building2, ChevronRight, ChevronDown, X, Search, Fingerprint, Factory, LineChart, Cpu, ShoppingCart, Shovel, HeartPulse, Droplets, Zap, Wallet, Landmark, Palette, Smile, Globe } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { t } from "svelte-i18n";
    import { SystemInput, SystemSelect, SystemListItem } from "$lib/components/ui/system";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { toast } from "svelte-sonner";
    import type { Sector, Subsector } from "$lib/types";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { cn } from "$lib/utils";
    import { keyboardList, keyboardForm } from "$lib/actions/keyboard-nav";
    import { onMount } from "svelte";

    onMount(() => { 
        sectorsStore.loadData(); 
    });

    let selectedMacroForSegment = $state("");
    let selectedMarketId = $state<string>("");
    
    // Auto-select first market if available
    $effect(() => {
        if (!selectedMarketId && marketsStore.markets.length > 0) {
            selectedMarketId = marketsStore.markets[0].id;
        }
    });

    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");
    let isSubsectorDialogOpen = $state(false);
    let editingSubsectorId = $state<string | null>(null);
    let parentSectorId = $state<string | null>(null);
    let expandedSectors = $state<Record<string, boolean>>({});
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);
    let deleteType = $state<"sector" | "subsector">("sector");
    let isProcessing = $state(false);
    let newSubsectorName = $state("");

    let filteredItems = $derived(
        sectorsStore.sectors
            .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name))
    );

    let groupedByMacro = $derived.by(() => {
        const groups: Record<string, Sector[]> = {};
        for (const item of filteredItems) {
            const macro = item.macro_sector || $t("sectors.macroSectorDefault");
            if (!groups[macro]) groups[macro] = [];
            groups[macro].push(item);
        }
        return groups;
    });

    let expandedMacros = $state<Record<string, boolean>>({});

    function toggleMacro(macro: string) {
        const isCurrentlyExpanded = expandedMacros[macro];
        expandedMacros = {}; 
        if (!isCurrentlyExpanded) expandedMacros[macro] = true;
    }

    $effect(() => {
        const keys = Object.keys(groupedByMacro);
        if (keys.length > 0 && Object.keys(expandedMacros).length === 0) {
            expandedMacros[keys[0]] = true;
        }
    });

    let formData = $state<Omit<Sector, "id">>({ 
        name: "", 
        market_id: "", 
        macro_sector: "", 
        icon: "Building2", 
        color: "emerald", 
        description: "" 
    });
    let subsectorFormData = $state<Omit<Subsector, "id">>({ 
        name: "", 
        market_id: "", 
        sector_id: "", 
        segment: "" 
    });

    function resetForm() {
        formData = { 
            name: "", 
            market_id: selectedMarketId, 
            macro_sector: "", 
            icon: "Building2", 
            color: "emerald", 
            description: "" 
        };
        subsectorFormData = {
            name: "",
            market_id: selectedMarketId,
            sector_id: "",
            segment: ""
        };
        editingId = null;
        editingSubsectorId = null;
        newSubsectorName = "";
        selectedMacroForSegment = "";
    }

    async function addSubsectorInside() {
        if (!newSubsectorName.trim() || !editingId) return;
        try {
            await sectorsStore.saveSubsector({ name: newSubsectorName, sector_id: editingId, segment: "" });
            newSubsectorName = "";
            toast.success($t("sectors.form.toastSubsectorAdded"));
        } catch (e) { toast.error(String(e)); }
    }

    let creationLevel = $state<"1" | "2" | "3">("2");

    function openNew() { 
        resetForm(); 
        creationLevel = "2"; 
        isDialogOpen = true; 
    }

    function openEdit(sector: Sector) {
        editingId = sector.id;
        formData = { 
            name: sector.name, 
            market_id: sector.market_id,
            macro_sector: sector.macro_sector || "", 
            icon: sector.icon || "Building2", 
            color: sector.color || "emerald", 
            description: sector.description || "" 
        };
        creationLevel = "2";
        isDialogOpen = true;
    }

    function openEditSubsector(ss: Subsector) {
        editingSubsectorId = ss.id;
        const parentSector = sectorsStore.sectors.find(s => s.id === ss.sector_id);
        selectedMacroForSegment = parentSector?.macro_sector || "";
        
        subsectorFormData = { 
            name: ss.name, 
            market_id: ss.market_id,
            sector_id: ss.sector_id, 
            segment: ss.segment || "" 
        };
        creationLevel = "3";
        isDialogOpen = true;
    }

    async function handleSave() {
        isProcessing = true;
        try {
            const mid = creationLevel === "3" ? subsectorFormData.market_id : formData.market_id;
            
            if (creationLevel === "1") {
                await sectorsStore.saveSector({ 
                    ...$state.snapshot(formData),
                    name: $t("sectors.macroSectorDefault"), 
                    macro_sector: formData.name, 
                    market_id: mid 
                });
            } else if (creationLevel === "2") {
                await sectorsStore.saveSector({ id: editingId || undefined, ...$state.snapshot(formData) });
            } else if (creationLevel === "3") {
                await sectorsStore.saveSubsector({ id: editingSubsectorId || undefined, ...$state.snapshot(subsectorFormData) });
            }
            toast.success($t("common.saveSuccess"));
            isDialogOpen = false;
            resetForm();
        } catch (e) { 
            toast.error(String(e)); 
        } finally { 
            isProcessing = false; 
        }
    }

    let economicSectors = $derived([...new Set(sectorsStore.sectors.map(s => s.macro_sector).filter(Boolean))]);
    function openNewSubsector(sectorId: string) {
        const sector = sectorsStore.sectors.find(s => s.id === sectorId);
        selectedMacroForSegment = sector?.macro_sector || "";
        subsectorFormData = { 
            name: "", 
            market_id: sector?.market_id || selectedMarketId,
            sector_id: sectorId, 
            segment: "" 
        };
        formData.market_id = sector?.market_id || selectedMarketId;
        formData.macro_sector = sector?.macro_sector || "";
        creationLevel = "3";
        editingSubsectorId = null;
        isDialogOpen = true;
    }



    function requestDelete(id: string, type: "sector" | "subsector" = "sector") {
        deleteId = id; deleteType = type; isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (!deleteId || isProcessing) return;
        isProcessing = true;
        try {
            if (deleteType === "sector") await sectorsStore.deleteSector(deleteId);
            else await sectorsStore.deleteSubsector(deleteId);
            toast.success($t("common.deleteSuccess"));
            isDeleteOpen = false;
        } catch (e) { toast.error(String(e)); } finally { isProcessing = false; }
    }

    function toggleSector(id: string) { expandedSectors[id] = !expandedSectors[id]; }

    $effect(() => {
        settingsHeaderStore.setActions(headerActions);
        return () => settingsHeaderStore.clearActions();
    });
</script>

{#snippet headerActions()}
    <div class="flex items-center gap-4">
        <div class="relative hidden md:block">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
            <input 
                type="text" 
                bind:value={searchTerm}
                placeholder={$t("sectors.searchPlaceholder")}
                class="h-9 pl-11 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground placeholder:text-muted-foreground/40"
            />
        </div>
        <Button onclick={openNew} class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus class="w-4 h-4 mr-2" />
            {$t("sectors.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">
    <div class="grid gap-4 pt-4" use:keyboardList>
        {#if filteredItems.length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Layers class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50">{$t("sectors.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                    {searchTerm ? $t("common.clear") : $t("sectors.form.createFirst")}
                </Button>
            </div>
        {:else}
            <div class="flex flex-col gap-10">
                {#each Object.entries(groupedByMacro) as [macro, sectors]}
                    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <button 
                            type="button" 
                            class="flex items-center gap-3 px-2 group w-full text-left outline-none" 
                            onclick={() => toggleMacro(macro)}
                        >
                            <div class="p-1.5 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                                <Layers class="w-3.5 h-3.5 text-primary" />
                            </div>
                            <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">{macro}</h4>
                            <div class="h-[1px] flex-1 bg-muted/10 mx-2"></div>
                            {#if expandedMacros[macro]}
                                <ChevronDown class="w-4 h-4 text-muted-foreground/40" />
                            {:else}
                                <ChevronRight class="w-4 h-4 text-muted-foreground/40" />
                            {/if}
                        </button>

                        {#if expandedMacros[macro]}
                            <div transition:slide={{ duration: 200 }} class="flex flex-col gap-4">
                                {#each sectors as sector (sector.id)}
                                    {@const subsectors = sectorsStore.getSubsectorsBySector(sector.id)}
                                    <div class="space-y-2">
                                        <SystemListItem 
                                            raw={true}
                                            onclick={() => { openEdit(sector); if (!expandedSectors[sector.id]) toggleSector(sector.id); }}
                                            class={cn("cursor-pointer", expandedSectors[sector.id] && "border-primary/30 bg-muted/5")}
                                        >
                                             <div class="relative flex items-center gap-4">
                                                <div class="p-1.5 rounded-xl border border-primary/10 bg-primary/10 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none transition-colors">
                                                    <Building2 class="w-5 h-5 text-primary" />
                                                </div>
                                                <div class="flex flex-col gap-0.5">
                                                    <div class="flex items-center gap-3">
                                                        <h4 class="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">{sector.name}</h4>
                                                    </div>
                                                    <span class="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">{$t("sectors.segmentsCount", { count: subsectors.length })}</span>
                                                </div>
                                            </div>
                                            <div class="relative flex items-center gap-4">
                                                <div class="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                                    <div role="button" tabindex="0" class="ghost h-9 w-9 rounded-xl flex items-center justify-center hover:bg-rose-500/10 text-muted-foreground/60 hover:text-rose-500 transition-colors cursor-pointer" onclick={(e) => { e.stopPropagation(); requestDelete(sector.id, "sector"); }} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()}>
                                                        <Trash2 class="w-4 h-4" />
                                                    </div>
                                                    <div role="button" tabindex="0" class="ghost p-2 bg-muted/20 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer" onclick={(e) => { e.stopPropagation(); openEdit(sector); }} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()}>
                                                        <Pencil class="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                    <div role="button" tabindex="0" class="ghost p-2 bg-muted/20 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer" onclick={(e) => { e.stopPropagation(); openNewSubsector(sector.id); }} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()}>
                                                        <Plus class="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                </div>
                                                <div 
                                                    role="button" 
                                                    tabindex="0" 
                                                    class={cn("transition-transform duration-300 cursor-pointer p-2 hover:bg-primary/10 rounded-xl", expandedSectors[sector.id] && "rotate-90")} 
                                                    onclick={(e) => { e.stopPropagation(); toggleSector(sector.id); }}
                                                    onkeydown={(e) => e.key === 'Enter' && (e.stopPropagation() || toggleSector(sector.id))}
                                                >
                                                    <ChevronRight class="w-5 h-5 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                                                </div>
                                            </div>
                                        </SystemListItem>
                                        {#if expandedSectors[sector.id]}
                                            <div transition:slide class="pl-10 pr-4 py-2 space-y-2">
                                                {#each subsectors as ss}
                                                    <div class="relative flex items-center justify-between p-4 ml-8 rounded-xl border border-primary/5 bg-primary/[0.03] hover:bg-primary/[0.06] transition-all group/ss shadow-sm cursor-pointer" onclick={(e) => { e.stopPropagation(); openEditSubsector(ss); }} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && openEditSubsector(ss)}>
                                                        <!-- Visual Connector -->
                                                        <div class="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-primary/20"></div>
                                                        
                                                        <div class="flex items-center gap-3">
                                                            <div class="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/ss:bg-primary transition-colors"></div>
                                                            <div class="flex flex-col gap-0.5">
                                                                <span class="text-[10px] font-black text-foreground uppercase tracking-[0.2em] leading-none">{ss.name}</span>
                                                                {#if ss.segment}
                                                                    <span class="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">{ss.segment}</span>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="flex items-center gap-2 opacity-100 md:opacity-0 group-hover/ss:opacity-100 transition-all duration-300">
                                                            <div role="button" tabindex="0" class="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-rose-500/10 text-muted-foreground/60 hover:text-rose-500 transition-colors cursor-pointer" onclick={() => requestDelete(ss.id, "subsector")} onkeydown={(e) => e.key === 'Enter'}>
                                                                <Trash2 class="w-3.5 h-3.5" />
                                                            </div>
                                                            <div role="button" tabindex="0" class="p-1.5 bg-muted/20 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer" onclick={() => openEditSubsector(ss)} onkeydown={(e) => e.key === 'Enter'}>
                                                                <Pencil class="w-3 h-3 text-primary" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl ring-1 ring-border sm:max-w-[650px]">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2.5 bg-primary/10 rounded-xl border border-primary/20"><Building2 class="w-5 h-5 text-primary" /></div>
                    {editingId || editingSubsectorId ? $t("sectors.edit") : $t("sectors.new")}
                </DialogTitle>
            </DialogHeader>
        </div>
        <div class="px-10 py-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar" use:keyboardForm>
            <!-- Mercado Selection -->
            <div class="space-y-3">
                <span class="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 block">{$t("sectors.form.market")}</span>
                {#if creationLevel === "3"}
                    <SystemSelect 
                        placeholder={$t("sectors.form.marketPlaceholder")}
                        bind:value={subsectorFormData.market_id}
                        options={marketsStore.markets.map(m => ({ value: m.id, label: m.name }))}
                    />
                {:else}
                    <SystemSelect 
                        placeholder={$t("sectors.form.marketPlaceholder")}
                        bind:value={formData.market_id}
                        options={marketsStore.markets.map(m => ({ value: m.id, label: m.name }))}
                    />
                {/if}
            </div>

            <!-- Seleção de Nível via Cards Institucionais -->
            <div class="space-y-4">
                <span class="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 block">{$t("sectors.form.level")}</span>
                
                <!-- Nível 1: Setor Econômico -->
                <div class={cn("p-6 rounded-[2.5rem] border transition-all duration-500", creationLevel === "1" ? "bg-primary/[0.03] border-primary/30 shadow-2xl shadow-primary/5" : "bg-muted/5 border-border hover:border-primary/10")}>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class={cn("p-3 rounded-2xl border transition-colors", creationLevel === "1" ? "bg-primary/10 border-primary/20" : "bg-muted/10 border-border")}>
                                <Factory class={cn("w-5 h-5", creationLevel === "1" ? "text-primary" : "text-muted-foreground/40")} />
                            </div>
                            <div class="space-y-1">
                                <h4 class="text-xs font-bold uppercase tracking-widest text-foreground">{$t("sectors.form.level1")}</h4>
                                <p class="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">{$t("sectors.form.level1Desc")}</p>
                            </div>
                        </div>
                        <Switch checked={creationLevel === "1"} onCheckedChange={() => { if (creationLevel !== "1") { creationLevel = "1"; resetForm(); } }} />
                    </div>
                    {#if creationLevel === "1"}
                        <div class="mt-6 pt-6 border-t border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500">
                            <SystemInput label={$t("sectors.form.level1")} bind:value={formData.name} placeholder={$t("sectors.form.macroSectorPlaceholder")} />
                        </div>
                    {/if}
                </div>

                <!-- Nível 2: Subsetor -->
                <div class={cn("p-6 rounded-[2.5rem] border transition-all duration-500", creationLevel === "2" ? "bg-primary/[0.03] border-primary/30 shadow-2xl shadow-primary/5" : "bg-muted/5 border-border hover:border-primary/10")}>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class={cn("p-3 rounded-2xl border transition-colors", creationLevel === "2" ? "bg-primary/10 border-primary/20" : "bg-muted/10 border-border")}>
                                <Layers class={cn("w-5 h-5", creationLevel === "2" ? "text-primary" : "text-muted-foreground/40")} />
                            </div>
                            <div class="space-y-1">
                                <h4 class="text-xs font-bold uppercase tracking-widest text-foreground">{$t("sectors.form.level2")}</h4>
                                <p class="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">{$t("sectors.form.level2Desc")}</p>
                            </div>
                        </div>
                        <Switch checked={creationLevel === "2"} onCheckedChange={() => { if (creationLevel !== "2") { creationLevel = "2"; resetForm(); } }} />
                    </div>
                    {#if creationLevel === "2"}
                        <div class="mt-6 pt-6 border-t border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                            <SystemSelect 
                                label={$t("sectors.form.parentLevel1")} 
                                bind:value={formData.macro_sector} 
                                placeholder={$t("sectors.form.macroSectorPlaceholder")}
                                options={[...new Set(sectorsStore.sectors.filter(s => s.market_id === formData.market_id).map(s => s.macro_sector))].filter(Boolean).map(m => ({ value: m, label: m }))}
                                allowCustom
                            />
                            <SystemInput label={$t("sectors.form.level2")} bind:value={formData.name} placeholder={$t("sectors.form.namePlaceholder")} />
                        </div>
                    {/if}
                </div>

                <!-- Nível 3: Segmento -->
                <div class={cn("p-6 rounded-[2.5rem] border transition-all duration-500", creationLevel === "3" ? "bg-primary/[0.03] border-primary/30 shadow-2xl shadow-primary/5" : "bg-muted/5 border-border hover:border-primary/10")}>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class={cn("p-3 rounded-2xl border transition-colors", creationLevel === "3" ? "bg-primary/10 border-primary/20" : "bg-muted/10 border-border")}>
                                <Fingerprint class={cn("w-5 h-5", creationLevel === "3" ? "text-primary" : "text-muted-foreground/40")} />
                            </div>
                            <div class="space-y-1">
                                <h4 class="text-xs font-bold uppercase tracking-widest text-foreground">{$t("sectors.form.level3")}</h4>
                                <p class="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">{$t("sectors.form.level3Desc")}</p>
                            </div>
                        </div>
                        <Switch checked={creationLevel === "3"} onCheckedChange={() => { if (creationLevel !== "3") { creationLevel = "3"; resetForm(); } }} />
                    </div>
                    {#if creationLevel === "3"}
                        <div class="mt-6 pt-6 border-t border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                            <!-- Passo 1: Setor Econômico -->
                            <SystemSelect 
                                label={$t("sectors.form.parentLevel1")} 
                                bind:value={selectedMacroForSegment} 
                                placeholder={$t("sectors.form.macroSectorPlaceholder")}
                                options={[...new Set(sectorsStore.sectors.filter(s => s.market_id === subsectorFormData.market_id).map(s => s.macro_sector))].filter(Boolean).map(m => ({ value: m, label: m }))}
                            />

                            <!-- Passo 2: Subsetor -->
                            <SystemSelect 
                                label={$t("sectors.form.parentLevel2")} 
                                bind:value={subsectorFormData.sector_id} 
                                placeholder={$t("sectors.form.namePlaceholder")}
                                options={sectorsStore.sectors.filter(s => s.market_id === subsectorFormData.market_id && s.macro_sector === selectedMacroForSegment).map(s => ({ value: s.id, label: s.name }))}
                                disabled={!selectedMacroForSegment}
                            />

                            <!-- Passo 3: Nome do Segmento -->
                            <SystemInput label={$t("sectors.form.level3")} bind:value={subsectorFormData.name} placeholder={$t("sectors.subsectors.namePlaceholder")} />
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        <DialogFooter class="px-10 py-8 border-t border-border bg-muted/5 rounded-b-[2.5rem] flex flex-row items-center justify-end gap-3 mt-auto">
            <Button variant="ghost" onclick={() => (isDialogOpen = false)} class="rounded-xl px-8 h-12 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">{$t("sectors.form.cancel")}</Button>
            <Button onclick={handleSave} disabled={isProcessing} class="rounded-xl px-12 h-12 text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">{$t("sectors.form.save")}</Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 6px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(255, 255, 255, 0.1); }
</style>

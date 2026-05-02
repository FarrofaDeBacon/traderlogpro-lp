<script lang="ts">
  import { marketsStore } from "$lib/stores/markets.svelte";
  import { assetsStore } from "$lib/stores/assets.svelte";
  import { timeframesStore } from "$lib/stores/timeframes.svelte";
  import { indicatorsStore } from "$lib/stores/indicators.svelte";
  import { assetTypesStore } from "$lib/stores/asset-types.svelte";
    import {
        Plus,
        Pencil,
        Trash2,
        Target,
        X,
        UploadCloud,
        ImageIcon,
        Eye,
        Globe,
        Search,
        ChevronDown,
        ChevronRight,
        Activity
    } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import { Button } from "$lib/components/ui/button";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { Switch } from "$lib/components/ui/switch";
    import { SystemInput, SystemSelect, SystemListItem } from "$lib/components/ui/system";
    import type { Strategy } from "$lib/types";
    import { workspaceStore } from "$lib/stores/workspace.svelte";
    import { Badge } from "$lib/components/ui/badge";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { t } from "svelte-i18n";
    import { cn } from "$lib/utils";
    import { keyboardList, keyboardForm } from "$lib/actions/keyboard-nav";

    // --- State ---
    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);
    let expandedGroups = $state<Record<string, boolean>>({});

    // Initial Empty State
    const emptyForm = {
        name: "",
        description: "",
        market_ids: [] as string[],
        timeframes: [] as string[],
        asset_types: [] as string[],
        indicators: [] as string[],
        specific_assets: [] as string[],
        entry_criteria: "",
        exit_criteria: "",
        management_criteria: "",
        has_partial: false,
        partial_description: "",
        images: [] as { path: string; description: string }[],
    };

    let formData = $state<Omit<Strategy, "id">>({ ...emptyForm });

    // Temp inputs for adding tags
    let tempTimeframe = $state("");
    let tempIndicator = $state("");
    let tempAssetType = $state("");
    let tempSpecificAsset = $state("");

    // --- Actions ---
    function openNew() {
        formData = JSON.parse(JSON.stringify(emptyForm));
        editingId = null;
        isDialogOpen = true;
    }

    function openEdit(strategy: Strategy) {
        editingId = strategy.id;
        formData = JSON.parse(JSON.stringify(strategy));
        isDialogOpen = true;
    }

    function save() {
        if (editingId) {
            workspaceStore.updateStrategy(editingId, formData);
        } else {
            workspaceStore.addStrategy(formData);
        }
        isDialogOpen = false;
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await workspaceStore.deleteStrategy(deleteId);
            if (!result.success) {
                toast.error(result.error || $t("common.deleteError"));
            } else {
                toast.success($t("common.deleteSuccess"));
            }
            deleteId = null;
        }
    }

    // --- Tag Helpers ---
    function addTag(
        field: "timeframes" | "indicators" | "asset_types" | "specific_assets",
        value: string,
    ) {
        if (!value.trim()) return;
        if (!formData[field].includes(value)) {
            formData[field] = [...formData[field], value];
        }
        // Clear appropriate temp input
        if (field === "timeframes") tempTimeframe = "";
        if (field === "indicators") tempIndicator = "";
        if (field === "asset_types") tempAssetType = "";
        if (field === "specific_assets") tempSpecificAsset = "";
    }

    function removeTag(
        field: "timeframes" | "indicators" | "asset_types" | "specific_assets",
        index: number,
    ) {
        formData[field] = formData[field].filter((_, i) => i !== index);
    }

    // --- Image Helper (Mock for now) ---
    function handleImageUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files?.length) return;

        // In a real app, this would be a file upload to backend
        // Here we mock with base64 for local persistence in store
        Array.from(input.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    formData.images = [
                        ...formData.images,
                        { path: e.target.result as string, description: "" },
                    ];
                }
            };
            reader.readAsDataURL(file);
        });
        input.value = "";
    }

    function removeImage(index: number) {
        formData.images = formData.images.filter((_, i) => i !== index);
    }

    // Group Strategies
    let groupedStrategies = $derived.by(() => {
        const groups: Record<string, Strategy[]> = {};
        const filteredStrategies = workspaceStore.strategies.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (s.description || "").toLowerCase().includes(searchTerm.toLowerCase())
        );

        for (const item of filteredStrategies) {
            // Use first asset type as category, or "Geral"
            const category =
                item.asset_types.length > 0 ? item.asset_types[0] : $t("common.all");
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        }
        return groups;
    });

    function getStrategyStyle(category: string) {
        // Use standard asset colors if possible, or generic
        if (category === $t("common.all"))
            return { icon: Target, color: "text-muted-foreground", bg: "bg-muted/10" };
        
        return { icon: Target, color: "text-primary", bg: "bg-primary/10" };
    }

    function toggleGroup(group: string) {
        expandedGroups[group] = !expandedGroups[group];
    }

    $effect(() => {
        settingsHeaderStore.setActions(headerActions);
        return () => settingsHeaderStore.clearActions();
    });

    // Auto-expand first group
    $effect(() => {
        const firstGroup = Object.keys(groupedStrategies)[0];
        if (firstGroup && Object.keys(expandedGroups).length === 0) {
            expandedGroups[firstGroup] = true;
        }
    });
</script>

{#snippet headerActions()}
    <div class="flex items-center gap-4">
        <div class="relative hidden md:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input 
                type="text" 
                bind:value={searchTerm}
                placeholder={$t("strategies.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground"
            />
        </div>
        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("strategies.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">

    <div class="grid gap-10 pt-4" use:keyboardList>
        {#if workspaceStore.strategies.length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Target class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50">{$t("strategies.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                    {$t("strategies.form.createFirst")}
                </Button>
            </div>
        {:else}
            {#each Object.entries(groupedStrategies) as [group, items]}
                {@const style = getStrategyStyle(group)}
                {@const GroupIcon = style.icon}
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button 
                        type="button" 
                        class="flex items-center gap-3 px-2 group w-full text-left outline-none" 
                        onclick={() => toggleGroup(group)}
                    >
                        <div class={cn("p-1.5 rounded-xl transition-colors", style.bg, style.color)}>
                            <GroupIcon class="w-3.5 h-3.5" />
                        </div>
                        <h4 class="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                            {group}
                        </h4>
                        <div class="h-[1px] flex-1 bg-muted/10 mx-2"></div>
                        {#if expandedGroups[group]}
                            <ChevronDown class="w-4 h-4 text-muted-foreground/40" />
                        {:else}
                            <ChevronRight class="w-4 h-4 text-muted-foreground/40" />
                        {/if}
                    </button>

                    {#if expandedGroups[group]}
                        <div transition:slide={{ duration: 200 }} class="flex flex-col gap-3">
                            {#each items as strategy (strategy.id)}
                                <SystemListItem raw={true} onclick={() => openEdit(strategy)}>
                                    <div class="relative flex items-center gap-6 shrink-0">
                                        <div class="p-1 bg-muted/20 rounded-xl group-hover:bg-primary/10 transition-colors border border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                                            <Target class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div class="flex flex-col gap-0.5 min-w-[200px]">
                                            <h4 class="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                                                {strategy.name}
                                            </h4>
                                            {#if strategy.description}
                                                <p class="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest line-clamp-1 max-w-md">
                                                    {strategy.description}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>

                                    <!-- Middle: Context Chips -->
                                    <div class="relative flex gap-2 mr-auto ml-12 flex-wrap">
                                        {#each strategy.timeframes.slice(0, 3) as tf}
                                            <Badge variant="outline" class="text-[8px] h-4 font-black uppercase tracking-tighter rounded-xl border-none bg-primary/10 text-primary px-2">
                                                {tf}
                                            </Badge>
                                        {/each}
                                        {#each strategy.asset_types.slice(0, 2) as at}
                                            <Badge variant="outline" class="text-[8px] h-4 font-black uppercase tracking-tighter rounded-xl border-none bg-indigo-500/10 text-indigo-400 px-2">
                                                {at}
                                            </Badge>
                                        {/each}
                                    </div>

                                    <!-- Right: Actions -->
                                    <div class="relative flex items-center gap-6 ml-auto">
                                        <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60" 
                                                onclick={(e) => { e.stopPropagation(); requestDelete(strategy.id); }}
                                            >
                                                <Trash2 class="w-4 h-4" />
                                            </Button>
                                            <div class="p-2 bg-muted/20 rounded-xl md:flex hidden group-hover:bg-primary/20 transition-colors">
                                                <Pencil class="w-3.5 h-3.5 text-primary" />
                                            </div>
                                        </div>
                                        <ChevronRight class="w-5 h-5 text-muted-foreground/20 group-hover:text-primary/40 transition-colors hidden md:block" />
                                    </div>
                                </SystemListItem>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[900px] h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-[#0a0c10] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div class="px-8 py-6 bg-white/[0.02] border-b border-white/5">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-extrabold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Target class="w-5 h-5 text-primary" />
                    </div>
                    {editingId ? $t("strategies.edit") : $t("strategies.new")}
                </DialogTitle>
                <DialogDescription class="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-[44px]">
                    {$t("strategies.description")}
                </DialogDescription>
            </DialogHeader>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4 grid gap-6" use:keyboardForm>
            <!-- Section 1: General Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SystemInput
                    label={$t("strategies.form.name")}
                    bind:value={formData.name}
                    placeholder={$t("strategies.form.namePlaceholder")}
                />
                <div class="md:col-span-2">
                    <SystemInput
                        label={$t("strategies.form.description")}
                        bind:value={formData.description}
                        placeholder={$t("strategies.form.descriptionPlaceholder")}
                    />
                </div>
            </div>

            <!-- Section 2: Context (Tags) -->
            <div class="p-6 rounded-3xl bg-muted/[0.03] border border-white/5 space-y-6">
                <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                    <Activity class="w-3.5 h-3.5" />
                    {$t("strategies.form.operationalContext")}
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Timeframes -->
                    <div class="space-y-2">
                        <div class="flex items-end gap-2">
                            <div class="flex-1">
                                <SystemSelect 
                                    label={$t("strategies.form.timeframes")}
                                    bind:value={tempTimeframe}
                                    options={timeframesStore.timeframes.map(tf => ({ value: tf.name, label: tf.name }))}
                                    placeholder={$t("common.selectEllipsis")}
                                />
                            </div>
                            <Button onclick={() => addTag("timeframes", tempTimeframe)} variant="outline" class="rounded-xl border-dashed border-white/10 text-[10px] w-10 h-9 p-0 shrink-0">
                                <Plus class="w-4 h-4" />
                            </Button>
                        </div>
                        <div class="flex flex-wrap gap-1.5 min-h-[20px]">
                            {#each formData.timeframes as item, i}
                                <Badge variant="secondary" class="bg-primary/10 hover:bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-xl border border-primary/20 flex items-center gap-1 transition-all">
                                    {item}
                                    <button onclick={() => removeTag("timeframes", i)} class="hover:text-rose-500 transition-colors"><X class="w-2.5 h-2.5" /></button>
                                </Badge>
                            {/each}
                        </div>
                    </div>

                    <!-- Indicators -->
                    <div class="space-y-2">
                        <div class="flex items-end gap-2">
                            <div class="flex-1">
                                <SystemSelect 
                                    label={$t("strategies.form.indicators")}
                                    bind:value={tempIndicator}
                                    options={indicatorsStore.indicators.map(ind => ({ value: ind.name, label: ind.name }))}
                                    placeholder={$t("common.selectEllipsis")}
                                />
                            </div>
                            <Button onclick={() => addTag("indicators", tempIndicator)} variant="outline" class="rounded-xl border-dashed border-white/10 text-[10px] w-10 h-9 p-0 shrink-0">
                                <Plus class="w-4 h-4" />
                            </Button>
                        </div>
                        <div class="flex flex-wrap gap-1.5 min-h-[20px]">
                            {#each formData.indicators as item, i}
                                <Badge variant="secondary" class="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[9px] px-2 py-0.5 rounded-xl border border-amber-500/20 flex items-center gap-1 transition-all">
                                    {item}
                                    <button onclick={() => removeTag("indicators", i)} class="hover:text-rose-500 transition-colors"><X class="w-2.5 h-2.5" /></button>
                                </Badge>
                            {/each}
                        </div>
                    </div>

                    <!-- Asset Types -->
                    <div class="space-y-2">
                        <div class="flex items-end gap-2">
                            <div class="flex-1">
                                <SystemSelect 
                                    label={$t("strategies.form.assetTypes")}
                                    bind:value={tempAssetType}
                                    options={assetTypesStore.assetTypes.map(type => ({ value: type.code, label: type.code }))}
                                    placeholder={$t("common.selectEllipsis")}
                                />
                            </div>
                            <Button onclick={() => addTag("asset_types", tempAssetType)} variant="outline" class="rounded-xl border-dashed border-white/10 text-[10px] w-10 h-9 p-0 shrink-0">
                                <Plus class="w-4 h-4" />
                            </Button>
                        </div>
                        <div class="flex flex-wrap gap-1.5 min-h-[20px]">
                            {#each formData.asset_types as item, i}
                                <Badge variant="secondary" class="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] px-2 py-0.5 rounded-xl border border-indigo-500/20 flex items-center gap-1 transition-all">
                                    {item}
                                    <button onclick={() => removeTag("asset_types", i)} class="hover:text-rose-500 transition-colors"><X class="w-2.5 h-2.5" /></button>
                                </Badge>
                            {/each}
                        </div>
                    </div>

                    <!-- Specific Assets -->
                    <div class="space-y-2">
                        <div class="flex items-end gap-2">
                            <div class="flex-1">
                                <SystemSelect 
                                    label={$t("strategies.form.specificAssets")}
                                    bind:value={tempSpecificAsset}
                                    options={assetsStore.assets.map(asset => ({ value: asset.symbol, label: asset.symbol }))}
                                    placeholder={$t("common.selectEllipsis")}
                                />
                            </div>
                            <Button onclick={() => addTag("specific_assets", tempSpecificAsset)} variant="outline" class="rounded-xl border-dashed border-white/10 text-[10px] w-10 h-9 p-0 shrink-0">
                                <Plus class="w-4 h-4" />
                            </Button>
                        </div>
                        <div class="flex flex-wrap gap-1.5 min-h-[20px]">
                            {#each formData.specific_assets as item, i}
                                <Badge variant="secondary" class="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-xl border border-emerald-500/20 flex items-center gap-1 transition-all">
                                    {item}
                                    <button onclick={() => removeTag("specific_assets", i)} class="hover:text-rose-500 transition-colors"><X class="w-2.5 h-2.5" /></button>
                                </Badge>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 2.5: Markets -->
            <div class="p-5 rounded-2xl bg-muted/[0.03] border border-white/5 space-y-3">
                <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                    <Globe class="w-3.5 h-3.5" />
                    {$t("strategies.form.linkedMarkets")}
                </h4>
                <div class="flex flex-wrap gap-1.5">
                    {#each marketsStore.markets as market}
                        {@const isSelected = formData.market_ids.includes(market.id)}
                        <button
                            type="button"
                            class={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                isSelected
                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-muted/10 text-muted-foreground/40 border-white/5 hover:bg-muted/20 hover:text-foreground/60'
                            )}
                            onclick={() => {
                                if (isSelected) {
                                    formData.market_ids = formData.market_ids.filter(id => id !== market.id);
                                } else {
                                    formData.market_ids = [...formData.market_ids, market.id];
                                }
                            }}
                        >
                            {market.code}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Section 3: Rules -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SystemInput
                    label={$t("strategies.form.entryTriggers")}
                    bind:value={formData.entry_criteria}
                    placeholder={$t("strategies.form.entryPlaceholder")}
                    multiline={true}
                    class="min-h-[160px]"
                />
                <SystemInput
                    label={$t("strategies.form.stopExit")}
                    bind:value={formData.exit_criteria}
                    placeholder={$t("strategies.form.stopPlaceholder")}
                    multiline={true}
                    class="min-h-[160px]"
                />
                <SystemInput
                    label={$t("strategies.form.management")}
                    bind:value={formData.management_criteria}
                    placeholder={$t("strategies.form.managementPlaceholder")}
                    multiline={true}
                    class="min-h-[160px]"
                />
                
                <!-- Partials (Moved here to fill the 2nd column of the 2nd row) -->
                <div class="space-y-4 p-7 rounded-[2.5rem] bg-muted/[0.03] border border-white/5 shadow-inner transition-all hover:bg-muted/[0.05] h-full flex flex-col min-h-[160px]">
                    <div class="flex items-center justify-between mb-4">
                        <label for="partials" class="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 cursor-pointer flex items-center gap-3">
                            <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                            {$t("strategies.form.partials.switch")}
                        </label>
                        <Switch id="partials" bind:checked={formData.has_partial} />
                    </div>
                    <div class="flex-1">
                        {#if formData.has_partial}
                            <div transition:slide class="h-full">
                                <SystemInput
                                    label={$t("strategies.form.partialDetails")}
                                    bind:value={formData.partial_description}
                                    placeholder={$t("strategies.form.partials.placeholder")}
                                    multiline={true}
                                    class="h-full min-h-[80px]"
                                />
                            </div>
                        {:else}
                            <div class="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01] opacity-30 italic p-4">
                                <span class="text-[9px] font-bold uppercase tracking-widest text-center">{$t("strategies.form.partials.hint")}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Section 4: Images (Full width below the 2-column grid) -->
            <div class="grid grid-cols-1 gap-6 pb-20">
                <div class="space-y-4 p-7 rounded-[2.5rem] bg-muted/[0.03] border border-white/5 shadow-inner flex flex-col">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            {$t("strategies.form.visualExamples")}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            id="img-upload"
                            onchange={handleImageUpload}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            class="text-[9px] h-7 rounded-xl font-bold uppercase tracking-widest border-white/10 hover:bg-white/5 px-3"
                            onclick={() => document.getElementById("img-upload")?.click()}
                        >
                            <UploadCloud class="w-3 h-3 mr-2" />
                            {$t("strategies.form.addImage")}
                        </Button>
                    </div>

                    <div class="grid grid-cols-4 gap-2">
                        {#each formData.images as img, i}
                            <div
                                class="relative group aspect-video bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl"
                            >
                                <img
                                    src={img.path}
                                    alt="Preview"
                                    class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <button
                                    class="absolute top-1.5 right-1.5 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-lg"
                                    onclick={() => removeImage(i)}
                                >
                                    <X class="w-3 h-3" />
                                </button>
                                <div class="absolute bottom-0 w-full translate-y-full group-hover:translate-y-0 transition-transform">
                                    <input
                                        bind:value={img.description}
                                        class="w-full text-[9px] bg-black/90 text-white border-0 px-2 py-1.5 focus:outline-none font-bold uppercase tracking-wider"
                                        placeholder={$t("strategies.form.imageCaption")}
                                    />
                                </div>
                            </div>
                        {/each}
                        {#if formData.images.length === 0}
                            <div
                                class="col-span-4 flex flex-col items-center justify-center h-24 border border-dashed border-white/5 rounded-xl bg-white/[0.02] text-muted-foreground/30"
                            >
                                <ImageIcon class="w-6 h-6 mb-2 opacity-20" />
                                <span class="text-[9px] font-black uppercase tracking-widest">{$t("strategies.form.tips.noImages")}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter class="p-8 bg-white/[0.02] border-t border-white/5 flex flex-row items-center justify-end gap-3 mt-auto">
            <Button variant="ghost" onclick={() => isDialogOpen = false} class="rounded-xl px-6 h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {$t("strategies.form.cancel")}
            </Button>
            <Button onclick={save} class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                {$t("strategies.form.save")}
            </Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<script lang="ts">
  import { chartTypesStore } from "$lib/stores/chart-types.svelte";
    import {
        Plus,
        Pencil,
        Trash2,
        BarChart3,
        Search,
        Clock,
        LayoutGrid,
        Layers,
    } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { appStore } from "$lib/stores/app.svelte";
import type { ChartType } from "$lib/types";
    import ChartTypeForm from "$lib/components/settings/ChartTypeForm.svelte";
    import { t } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { SystemListItem } from "$lib/components/ui/system";
    import { cn } from "$lib/utils";
    import { slide } from "svelte/transition";
    import { ChevronDown, ChevronRight } from "lucide-svelte";

    let isDialogOpen = $state(false);
    let editingItem = $state<ChartType | undefined>(undefined);

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    let searchTerm = $state("");
    let expandedGroups = $state<Record<string, boolean>>({});

    let filteredItems = $derived(
        chartTypesStore.chartTypes
            .filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.base_type?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name))
    );

    function toggleGroup(group: string) {
        expandedGroups[group] = !expandedGroups[group];
    }

    // Group indicators by category
    let groupedChartTypes = $derived.by(() => {
        const groups: Record<string, ChartType[]> = {};
        for (const item of filteredItems) {
            // Group by base_type or default "Geral"
            const key = item.base_type || "Outros";
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        }
        return groups;
    });

    function getChartTypeStyle(baseType: string) {
        const t = baseType.toLowerCase();
        if (
            t.includes("time") ||
            t.includes("temporal") ||
            t.includes("min") ||
            t.includes("hora")
        )
            return {
                icon: Clock,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
            };
        if (t.includes("renko") || t.includes("range") || t.includes("pontos"))
            return {
                icon: LayoutGrid,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
            };

        return {
            icon: BarChart3,
            color: "text-muted-foreground",
            bg: "bg-muted",
        };
    }

    function openNew() {
        editingItem = undefined;
        isDialogOpen = true;
    }

    function openEdit(item: ChartType) {
        editingItem = item;
        isDialogOpen = true;
    }

    function save(data: Omit<ChartType, "id">) {
        if (editingItem) {
            chartTypesStore.updateChartType(editingItem.id, data);
        } else {
            chartTypesStore.addChartType(data);
        }
        isDialogOpen = false;
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await chartTypesStore.deleteChartType(deleteId);
            if (!result.success) {
                toast.error(result.error || "Erro ao excluir");
            } else {
                toast.success("Tipo de gráfico excluído com sucesso");
            }
            deleteId = null;
        }
    }

    $effect(() => {
        settingsHeaderStore.setActions(headerActions);
        return () => settingsHeaderStore.clearActions();
    });

    // Auto-expand first group
    $effect(() => {
        const firstGroup = Object.keys(groupedChartTypes)[0];
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
                placeholder={$t("chartTypes.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80"
            />
        </div>

        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("chartTypes.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">
    <div class="grid gap-10 pt-4">
        {#if filteredItems.length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <BarChart3 class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50">{$t("chartTypes.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={() => { if (searchTerm) searchTerm = ""; else openNew(); }}>
                    {searchTerm ? "REDEFINIR FILTROS" : $t("chartTypes.form.createFirst")}
                </Button>
            </div>
        {:else}
            {#each Object.entries(groupedChartTypes) as [group, items]}
                {@const style = getChartTypeStyle(group)}
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
                            {$t(`chartTypes.types.${group}`) || group}
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
                            {#each items as item (item.id)}
                                <SystemListItem 
                                    raw={true} 
                                    onclick={() => openEdit(item)}
                                >
                                    <div class="relative flex items-center gap-6 shrink-0">
                                        <div class="p-1 bg-muted/20 rounded-xl group-hover:bg-primary/10 transition-colors border border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                                            <BarChart3 class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div class="flex flex-col gap-0.5 min-w-[160px]">
                                            <h4 class="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                                                {item.name}
                                            </h4>
                                            <span class="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] leading-none">
                                                {item.base_type} {item.parameter ? `(${item.parameter})` : ""}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="relative flex items-center gap-6 ml-auto">
                                        <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60" 
                                                onclick={(e) => { e.stopPropagation(); requestDelete(item.id); }}
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

<Dialog.Root bind:open={isDialogOpen}>
    <Dialog.Content class="sm:max-w-[500px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <Dialog.Header class="space-y-1">
                <Dialog.Title class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-xl">
                        <BarChart3 class="w-5 h-5 text-primary" />
                    </div>
                    {editingItem ? $t("chartTypes.edit") : $t("chartTypes.new")}
                </Dialog.Title>
            </Dialog.Header>
        </div>

        <div class="px-8 py-2 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <ChartTypeForm
                initialData={editingItem}
                onSave={save}
                onCancel={() => (isDialogOpen = false)}
            />
        </div>
    </Dialog.Content>
</Dialog.Root>

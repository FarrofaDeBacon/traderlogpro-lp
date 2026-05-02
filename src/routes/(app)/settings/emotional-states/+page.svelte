<script lang="ts">
    import { Plus, Pencil, Trash2, HeartPulse, ChevronDown, ChevronRight, Search, Activity } from "lucide-svelte";
    import { t } from "svelte-i18n";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { slide } from "svelte/transition";
    import type { EmotionalState } from "$lib/types";
    import { workspaceStore } from "$lib/stores/workspace.svelte";
    import EmotionalStateForm from "$lib/components/settings/EmotionalStateForm.svelte";
    import { Badge } from "$lib/components/ui/badge";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { cn } from "$lib/utils";
    import { SystemListItem } from "$lib/components/ui/system";

    let isDialogOpen = $state(false);
    let editingItem = $state<EmotionalState | undefined>(undefined);
    let searchTerm = $state("");
    let expandedGroups = $state<Record<string, boolean>>({
        "Positive": true,
        "Negative": true,
        "Neutral": false
    });

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    // Sort & Filter
    let filteredStates = $derived(
        workspaceStore.emotionalStates
            .filter(s => 
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.description || "").toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name))
    );

    // Group by Impact
    let groupedStates = $derived.by(() => {
        const groups: Record<string, EmotionalState[]> = {
            Positive: [],
            Negative: [],
            Neutral: [],
        };

        for (const item of filteredStates) {
            if (groups[item.impact]) {
                groups[item.impact].push(item);
            } else {
                groups["Neutral"].push(item);
            }
        }
        return groups;
    });

    function getImpactStyle(impact: string) {
        switch (impact) {
            case "Positive":
                return { label: $t("emotionalStates.groups.Positive"), color: "text-emerald-400", bg: "bg-emerald-400/10" };
            case "Negative":
                return { label: $t("emotionalStates.groups.Negative"), color: "text-rose-500", bg: "bg-rose-500/10" };
            default:
                return { label: $t("emotionalStates.groups.Neutral"), color: "text-muted-foreground", bg: "bg-muted/20" };
        }
    }

    function openNew() {
        editingItem = undefined;
        isDialogOpen = true;
    }

    function openEdit(item: EmotionalState) {
        editingItem = item;
        isDialogOpen = true;
    }

    function toggleGroup(group: string) {
        expandedGroups[group] = !expandedGroups[group];
    }

    function save(data: Omit<EmotionalState, "id">) {
        if (editingItem) {
            workspaceStore.updateEmotionalState(editingItem.id, data);
        } else {
            workspaceStore.addEmotionalState(data);
        }
        isDialogOpen = false;
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await workspaceStore.deleteEmotionalState(deleteId);
            if (!result.success) {
                toast.error(result.error || $t("emotionalStates.messages.delete_error"));
            } else {
                toast.success($t("emotionalStates.messages.delete_success"));
            }
            deleteId = null;
        }
    }

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
                placeholder={$t("emotionalStates.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground"
            />
        </div>
        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("emotionalStates.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">

    <div class="grid gap-10 pt-4">
        {#each Object.entries(groupedStates) as [impact, items]}
            {#if items.length > 0}
                {@const style = getImpactStyle(impact)}
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <!-- Section Header -->
                    <button 
                        type="button" 
                        class="flex items-center gap-3 px-2 group w-full text-left outline-none" 
                        onclick={() => toggleGroup(impact)}
                    >
                        <div class={cn("p-1.5 rounded-xl transition-colors", style.bg, style.color)}>
                            <HeartPulse class="w-3.5 h-3.5" />
                        </div>
                        <h4 class="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                            {style.label}
                        </h4>
                        <div class="h-[1px] flex-1 bg-muted/10 mx-2"></div>
                        {#if expandedGroups[impact]}
                            <ChevronDown class="w-4 h-4 text-muted-foreground/40" />
                        {:else}
                            <ChevronRight class="w-4 h-4 text-muted-foreground/40" />
                        {/if}
                    </button>

                    {#if expandedGroups[impact]}
                        <div transition:slide={{ duration: 200 }} class="flex flex-col gap-3">
                            {#each items as item (item.id)}
                                <SystemListItem raw={true} onclick={() => openEdit(item)}>
                                    <div class="relative flex items-center gap-6 shrink-0">
                                        <div class="p-1 bg-muted/20 rounded-xl group-hover:bg-primary/10 transition-colors border border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                                            <HeartPulse class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div class="flex flex-col gap-0.5 min-w-[200px]">
                                            <div class="flex items-center gap-3">
                                                <h4 class="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                                                    {item.name}
                                                </h4>
                                                <Badge variant="outline" class="w-fit text-[8px] h-3.5 font-black py-0 bg-primary/10 text-primary border-none uppercase tracking-tighter">
                                                    {item.weight || 0} PTS
                                                </Badge>
                                            </div>
                                            {#if item.description}
                                                <p class="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest line-clamp-1 max-w-md">
                                                    {item.description}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>

                                    <!-- Right: Actions -->
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
            {/if}
        {/each}

        {#if workspaceStore.emotionalStates.length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <HeartPulse class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50">{$t("emotionalStates.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                    {$t("emotionalStates.form.createFirst")}
                </Button>
            </div>
        {/if}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<Dialog.Root bind:open={isDialogOpen}>
    <Dialog.Content class="sm:max-w-[600px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <Dialog.Header class="space-y-1">
                <Dialog.Title class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <HeartPulse class="w-5 h-5 text-primary" />
                    </div>
                    {editingItem ? $t("emotionalStates.edit") : $t("emotionalStates.new")}
                </Dialog.Title>
            </Dialog.Header>
        </div>

        <div class="px-8 py-2 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <EmotionalStateForm
                initialData={editingItem}
                onSave={save}
                onCancel={() => (isDialogOpen = false)}
            />
        </div>
    </Dialog.Content>
</Dialog.Root>

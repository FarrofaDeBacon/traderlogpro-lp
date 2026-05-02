<script lang="ts">
  import { timeframesStore } from "$lib/stores/timeframes.svelte";
    import { Plus, Pencil, Trash2, Clock, Search, ChevronRight } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { SystemListItem } from "$lib/components/ui/system";
    import { appStore } from "$lib/stores/app.svelte";
import type { Timeframe } from "$lib/types";
    import TimeframeForm from "$lib/components/settings/TimeframeForm.svelte";
    import { t } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";

    let isDialogOpen = $state(false);
    let editingItem = $state<Timeframe | undefined>(undefined);
    let searchTerm = $state("");

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    let filteredItems = $derived(
        timeframesStore.timeframes
            .filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
    );

    function openNew() {
        editingItem = undefined;
        isDialogOpen = true;
    }

    function openEdit(item: Timeframe) {
        editingItem = item;
        isDialogOpen = true;
    }

    function save(data: Omit<Timeframe, "id">) {
        if (editingItem) {
            timeframesStore.updateTimeframe(editingItem.id, data);
        } else {
            timeframesStore.addTimeframe(data);
        }
        isDialogOpen = false;
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await timeframesStore.deleteTimeframe(deleteId);
            if (!result.success) {
                toast.error(result.error || "Erro ao excluir");
            } else {
                toast.success("Timeframe excluído com sucesso");
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
                placeholder={$t("timeframes.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80"
            />
        </div>

        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("timeframes.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">

    <div class="flex flex-col gap-3 pt-4">
        {#each filteredItems as item}
            <SystemListItem raw={true} onclick={() => openEdit(item)}>
                <div class="relative flex items-center gap-6 shrink-0">
                    <div class="p-1 bg-muted/20 rounded-xl group-hover:bg-primary/10 transition-colors border border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                        <Clock class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div class="flex flex-col gap-0.5 min-w-[160px]">
                        <h4 class="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                            {(item.name || "").toUpperCase()}
                        </h4>
                        <span class="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] leading-none">
                             {item.value} MINUTES
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

        {#if filteredItems.length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Clock class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50">{$t("timeframes.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={() => { if (searchTerm) searchTerm = ""; else openNew(); }}>
                    {searchTerm ? "REDEFINIR FILTROS" : $t("timeframes.form.createFirst")}
                </Button>
            </div>
        {/if}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<Dialog.Root bind:open={isDialogOpen}>
    <Dialog.Content class="sm:max-w-[450px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <Dialog.Header class="space-y-1">
                <Dialog.Title class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-xl">
                        <Clock class="w-5 h-5 text-primary" />
                    </div>
                    {editingItem ? $t("timeframes.edit") : $t("timeframes.new")}
                </Dialog.Title>
            </Dialog.Header>
        </div>

        <div class="px-8 py-2 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <TimeframeForm
                initialData={editingItem}
                onSave={save}
                onCancel={() => (isDialogOpen = false)}
            />
        </div>
    </Dialog.Content>
</Dialog.Root>

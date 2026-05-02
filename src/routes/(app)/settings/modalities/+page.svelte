<script lang="ts">
    import { modalitiesStore } from "$lib/stores/modalities.svelte";
    import { Plus, Pencil, Trash2, Workflow, Search, ChevronRight } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { modalitiesStore as modStore } from "$lib/stores/modalities.svelte";
    import { t } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { SystemInput, SystemListItem } from "$lib/components/ui/system";
    import { toast } from "svelte-sonner";
    import { cn } from "$lib/utils";
    import { slide } from "svelte/transition";

    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");
    let formModality = $state<Omit<Modality, "id">>({
        name: "",
        description: "",
    });

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    let filteredItems = $derived(
        modalitiesStore.modalities
            .filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (item.description || "").toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
    );

    function openNew() {
        editingId = null;
        formModality = { name: "", description: "" };
        isDialogOpen = true;
    }

    function openEdit(item: Modality) {
        editingId = item.id;
        formModality = { ...item };
        isDialogOpen = true;
    }

    function save() {
        if (editingId) {
            modalitiesStore.updateModality(editingId, formModality);
        } else {
            modalitiesStore.addModality(formModality);
        }
        isDialogOpen = false;
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await modalitiesStore.deleteModality(deleteId);
            if (!result.success) {
                toast.error(result.error || $t("common.error"));
            } else {
                toast.success($t("common.deleteSuccess"));
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
                placeholder={$t("modalities.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80"
            />
        </div>
        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("modalities.new")}
        </Button>
    </div>
{/snippet}

<div class="grid gap-10 pt-4">
    {#if filteredItems.length === 0}
        <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-white/5 bg-secondary/[0.02] text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
            <Workflow class="w-20 h-20 opacity-5 animate-pulse mb-8" />
            <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30">{$t("modalities.empty")}</span>
            <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                {searchTerm ? $t("common.clear") : $t("modalities.form.createFirst")}
            </Button>
        </div>
    {:else}
        <div class="flex flex-col gap-3">
            {#each filteredItems as item}
                <SystemListItem raw={true} onclick={() => openEdit(item)}>
                    <div class="flex items-center gap-6 flex-1 min-w-0">
                        <div class="p-1 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-border dark:border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                            <Workflow class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                            <h4 class="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors uppercase truncate">{item.name}</h4>
                            <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 truncate">
                                {item.description || $t("modalities.form.noDescription")}
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/20" 
                                onclick={(e) => { e.stopPropagation(); requestDelete(item.id!); }}
                            >
                                <Trash2 class="w-4 h-4" />
                            </Button>
                            <div class="p-2 bg-primary/10 rounded-xl md:flex hidden group-hover:bg-primary/20 transition-colors">
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

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<Dialog.Root bind:open={isDialogOpen}>
    <Dialog.Content class="sm:max-w-[425px] p-0 bg-white dark:bg-[#0a0c10] border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        <Dialog.Header class="p-8 pb-4 bg-muted/5 border-b border-border">
            <Dialog.Title class="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
                <div class="p-2 bg-primary/10 rounded-xl text-primary border border-primary/10">
                    <Workflow class="w-5 h-5" />
                </div>
                {editingId
                    ? $t("modalities.edit")
                    : $t("modalities.new")}
            </Dialog.Title>
            <Dialog.Description class="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-[44px]">
                {$t("modalities.description")}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-6 px-8 py-8">
            <SystemInput 
                label={$t("modalities.form.name") + "*"}
                bind:value={formModality.name}
                placeholder={$t("modalities.form.namePlaceholder")}
            />
            
            <div class="flex flex-col gap-2 w-full">
                <label class="text-[9px] font-black uppercase tracking-[var(--letter-spacing-institutional)] text-muted-foreground/60 px-1 ml-1">
                    {$t("modalities.form.description")}
                </label>
                <textarea
                    bind:value={formModality.description}
                    placeholder={$t("modalities.form.descriptionPlaceholder")}
                    class="flex min-h-[100px] w-full rounded-[2rem] border border-white/5 bg-muted/10 px-5 py-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:bg-muted/20 hover:bg-muted/15 resize-none"
                ></textarea>
            </div>
        </div>

        <Dialog.Footer class="px-8 py-6 bg-muted/5 border-t border-border flex flex-row justify-end gap-3">
            <Button variant="ghost" onclick={() => isDialogOpen = false} class="text-muted-foreground hover:text-foreground hover:bg-transparent uppercase text-[10px] font-bold tracking-widest">
                {$t("common.cancel")}
            </Button>
            <Button onclick={save} class="rounded-xl px-10 h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px]">
                {$t("modalities.form.save")}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

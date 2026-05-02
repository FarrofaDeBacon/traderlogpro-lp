<script lang="ts">
    import { modalitiesStore } from "$lib/stores/modalities.svelte";
    import { Scale, Plus, Pencil, Trash2, Search, Link2, ChevronRight } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { t } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { SystemInput, SystemSelect, SystemListItem } from "$lib/components/ui/system";
    import { cn } from "$lib/utils";

    let searchTerm = $state("");
    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let formData = $state({
        name: "",
        description: ""
    });

    let selectedModality = $state<string | null>(null);
    let selectedRule = $state<string | null>(null);
    let entryList = $state<{modality_id: string, tax_rule_id: string}[]>([]);
    let isSubmitting = $state(false);

    // Default modality on open
    $effect(() => {
        if (isDialogOpen && !selectedModality && modalitiesStore.modalities.length > 0) {
            selectedModality = modalitiesStore.modalities[0].id;
        }
    });

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    function addEntry() {
        if (!selectedModality || !selectedRule) {
            toast.error($t("fiscal.settings.profiles.form.selectionRequired"));
            return;
        }
        const exists = entryList.some(e => e.modality_id === selectedModality && e.tax_rule_id === selectedRule);
        if (exists) {
            toast.error($t("fiscal.settings.profiles.form.linkExists"));
            return;
        }
        entryList = [...entryList, { modality_id: selectedModality, tax_rule_id: selectedRule }];
        selectedRule = null;
    }

    function removeEntry(index: number) {
        entryList = entryList.filter((_, i) => i !== index);
    }

    function openNew() {
        editingId = null;
        formData = { name: "", description: "" };
        entryList = [];
        isDialogOpen = true;
    }

    function openEdit(profile: any) {
        editingId = profile.id;
        formData = {
            name: profile.name,
            description: profile.description || "",
        };
        const entries = financialConfigStore.getEntriesForProfile(profile.id);
        entryList = entries.map(e => ({
            modality_id: e.modality_id,
            tax_rule_id: e.tax_rule_id
        }));
        isDialogOpen = true;
    }

    async function save() {
        if (!formData.name) {
            toast.error($t("fiscal.settings.profiles.error.nameRequired"));
            return;
        }
        if (isSubmitting) return;
        isSubmitting = true;
        try {
            let targetProfileId = editingId;
            const data = $state.snapshot(formData);
            if (editingId) {
                await financialConfigStore.updateTaxProfile(editingId, data);
            } else {
                targetProfileId = await financialConfigStore.addTaxProfile(data);
            }

            if (editingId) {
                const existing = financialConfigStore.getEntriesForProfile(editingId);
                for (const e of existing) {
                    await financialConfigStore.deleteTaxProfileEntry(e.id);
                }
            }

            for (const entry of entryList) {
                await financialConfigStore.addTaxProfileEntry({
                    tax_profile_id: targetProfileId!,
                    modality_id: entry.modality_id,
                    tax_rule_id: entry.tax_rule_id,
                });
            }

            toast.success(editingId ? $t("fiscal.settings.profiles.success.update") : $t("fiscal.settings.profiles.success.create"));
            isDialogOpen = false;
        } catch (e) {
            toast.error($t("fiscal.settings.profiles.error.saveError"));
        } finally {
            isSubmitting = false;
        }
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await financialConfigStore.deleteTaxProfile(deleteId);
            if (result.success) {
                toast.success($t("common.deleteSuccess"));
            } else {
                toast.error(result.error);
            }
            deleteId = null;
            isDeleteOpen = false;
        }
    }

    const filteredProfiles = $derived(
        financialConfigStore.taxProfiles.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                placeholder={$t("fiscal.settings.rules.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground"
            />
        </div>
        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("fiscal.settings.profiles.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-4 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-8 animate-in fade-in duration-500">
    {#each filteredProfiles as profile}
        <SystemListItem 
            raw={true}
            onclick={() => openEdit(profile)}
        >
            <div class="relative flex items-center gap-6 shrink-0 text-left">
                <div class="p-1 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-border dark:border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                    <Scale class="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
                </div>
                <div class="flex flex-col gap-0.5 min-w-[160px]">
                    <div class="flex items-center gap-2">
                        <h4 class="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                            {profile.name}
                        </h4>
                        {#if profile.description}
                            <div class="h-4 w-[1px] bg-muted/10 mx-1"></div>
                            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                {profile.description}
                            </span>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="relative flex items-center gap-6">
                <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                    <Button variant="ghost" size="icon" class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60 transition-colors" onclick={(e) => { e.stopPropagation(); requestDelete(profile.id); }}>
                        <Trash2 class="w-4 h-4" />
                    </Button>
                    <div class="p-2 bg-muted/20 dark:bg-white/5 rounded-xl md:flex hidden group-hover:bg-primary/20 transition-colors">
                        <Pencil class="w-3.5 h-3.5 text-primary" />
                    </div>
                </div>
                <ChevronRight class="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors hidden md:block" />
            </div>
        </SystemListItem>
    {:else}
        <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000">
            <Scale class="w-20 h-20 opacity-5 mb-8 animate-pulse" />
            <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30">{$t("fiscal.settings.profiles.empty")}</span>
            <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                {$t("fiscal.settings.profiles.form.createFirst") || "CONFIGURAR PRIMEIRO PERFIL"}
            </Button>
        </div>
    {/each}
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[550px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl ring-1 ring-border">
        <DialogHeader class="px-8 py-6 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <DialogTitle class="text-[14px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-xl">
                    <Scale class="w-5 h-5 text-primary" />
                </div>
                {editingId ? $t("fiscal.settings.profiles.form.titleEdit") : $t("fiscal.settings.profiles.form.titleNew")}
            </DialogTitle>
            <DialogDescription class="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-[44px]">
                {$t("fiscal.settings.profiles.description")}
            </DialogDescription>
        </DialogHeader>

        <div class="px-8 py-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-2 gap-4">
                <SystemInput 
                    label={$t("fiscal.settings.profiles.form.name") + "*"}
                    bind:value={formData.name}
                    placeholder={$t("fiscal.settings.profiles.form.namePlaceholder")}
                />
                <SystemInput 
                    label={$t("fiscal.settings.profiles.form.descriptionLabel")}
                    bind:value={formData.description}
                    placeholder={$t("fiscal.settings.profiles.form.descriptionPlaceholder")}
                />
            </div>

            <div class="space-y-6">
                <div class="flex items-center gap-3 px-1 border-b border-border pb-2">
                    <Link2 class="w-3.5 h-3.5 text-primary/40" />
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">{$t("fiscal.settings.profiles.form.linkBuilder")}</span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <SystemSelect 
                        label={$t("fiscal.settings.profiles.form.modality")}
                        bind:value={selectedModality}
                        options={modalitiesStore.modalities.map(m => ({ value: m.id, label: m.name }))}
                        placeholder={$t("fiscal.settings.profiles.form.select")}
                    />
                    <SystemSelect 
                        label={$t("fiscal.settings.profiles.form.rule")}
                        bind:value={selectedRule}
                        options={financialConfigStore.taxRules.map(r => ({ value: r.id, label: r.name }))}
                        placeholder={$t("fiscal.settings.profiles.form.select")}
                    />
                </div>

                <Button 
                    onclick={addEntry}
                    variant="outline"
                    class="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                    <Plus class="w-4 h-4 mr-2" />
                    {$t("fiscal.settings.profiles.form.addModalityHint")}
                </Button>

                <div class="flex items-center justify-between px-1 pt-4">
                    <span class="text-[9px] uppercase font-black tracking-widest text-muted-foreground/30 leading-none">{$t("fiscal.settings.profiles.form.activeLinks")}</span>
                    <div class="h-[1px] flex-1 bg-muted/10 ml-4"></div>
                </div>

                <div class="flex flex-col gap-3">
                    {#each entryList as entry, idx}
                        <div class="group flex items-center justify-between p-4 rounded-2xl border bg-card/40 border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                            <div class="flex items-center gap-4 text-left">
                                <div class="p-2 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-border w-10 h-10 flex items-center justify-center shrink-0 leading-none">
                                    <Link2 class="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                                </div>
                                <div class="flex items-center gap-4">
                                    <h4 class="font-bold text-sm tracking-tight text-foreground uppercase">
                                        {modalitiesStore.modalities.find(m => m.id === entry.modality_id)?.name}
                                    </h4>
                                    <div class="h-4 w-[1px] bg-muted/10 mx-1"></div>
                                    <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                        {financialConfigStore.taxRules.find(r => r.id === entry.tax_rule_id)?.name}
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" class="h-9 w-9 rounded-xl hover:bg-destructive hover:text-white transition-colors" onclick={() => removeEntry(idx)}>
                                <Trash2 class="w-4 h-4" />
                            </Button>
                        </div>
                    {:else}
                        <div class="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground transition-all">
                            <span class="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 text-center leading-relaxed">{@html $t("fiscal.settings.profiles.form.emptyLinks")}</span>
                        </div>
                    {/each}
                </div>
            </div>
            
            <div class="pb-6"></div>
        </div>

        <DialogFooter class="px-8 py-6 border-t border-border bg-muted/5 rounded-b-[2.5rem] gap-3">
            <Button variant="ghost" onclick={() => (isDialogOpen = false)} class="rounded-xl px-8 h-9 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {$t("common.cancel")}
            </Button>
            <Button 
                onclick={save} 
                disabled={isSubmitting} 
                class="rounded-xl px-12 h-9 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
            >
                {#if isSubmitting}
                    <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                {/if}
                {editingId ? $t("fiscal.settings.profiles.form.update") : $t("fiscal.settings.profiles.form.save")}
            </Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 6px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
    .dark :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(0, 0, 0, 0.1); }
    .dark :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(255, 255, 255, 0.1); }
</style>

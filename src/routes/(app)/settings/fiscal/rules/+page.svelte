<script lang="ts">
    import { Plus, Pencil, Trash2, Scale, Info, ShieldAlert, ChevronRight } from "lucide-svelte";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Switch } from "$lib/components/ui/switch";
    import { SystemInput, SystemSelect, SystemListItem } from "$lib/components/ui/system";
    import { appStore } from "$lib/stores/app.svelte";
    import type { TaxRule } from "$lib/types";
    import { cn } from "$lib/utils";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { modalitiesStore } from "$lib/stores/modalities.svelte";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { t, locale } from "svelte-i18n";
    import { toast } from "svelte-sonner";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { Badge } from "$lib/components/ui/badge";

    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    let formData = $state<Omit<TaxRule, "id">>({
        name: "",
        trade_type: "DayTrade",
        tax_rate: 0,
        withholding_rate: 0,
        exemption_threshold: 0,
        basis: "NetProfit",
        cumulative_losses: true,
        revenue_code: "",
        withholding_basis: "Profit",
    });

    // Ensure state snapshot for Tauri initialization
    function getCleanFormData() {
        return {
            name: "",
            trade_type: "DayTrade",
            tax_rate: 15,
            withholding_rate: 0.005,
            exemption_threshold: 0,
            basis: "NetProfit",
            cumulative_losses: true,
            revenue_code: "",
            withholding_basis: "Profit"
        };
    }

    // --- RULES LOGIC ---

    function resetForm() {
        formData = {
            name: "",
            trade_type: "DayTrade",
            tax_rate: 15,
            withholding_rate: 0.005,
            exemption_threshold: 0,
            basis: "NetProfit",
            cumulative_losses: true,
            revenue_code: "",
            withholding_basis: "Profit",
        };
        editingId = null;
    }

    function openNew() {
        resetForm();
        isDialogOpen = true;
    }

    function openEdit(rule: TaxRule) {
        editingId = rule.id;
        formData = { ...$state.snapshot(rule) };
        isDialogOpen = true;
    }

    let isSubmittingRule = $state(false);

    async function saveRule() {
        if (!formData.name) {
            toast.error($t("fiscal.settings.rules.form.nameRequired"));
            return;
        }

        if (isSubmittingRule) return;
        isSubmittingRule = true;

        try {
            const data = $state.snapshot(formData);
            if (editingId) {
                await financialConfigStore.updateTaxRule(editingId, data);
            } else {
                await financialConfigStore.addTaxRule(data);
            }
            // FECHAR modal
            isDialogOpen = false;
            toast.success($t("fiscal.settings.rules.form.successSave"));
        } catch (e) {
            console.error("Erro ao salvar regra:", e);
            toast.error($t("fiscal.settings.rules.form.errorSave"));
        } finally {
            isSubmittingRule = false;
        }
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await financialConfigStore.deleteTaxRule(deleteId);

            if (!result.success) {
                toast.error(result.error || $t("common.error"));
            } else {
                toast.success($t("common.deleteSuccess"));
            }
            isDeleteOpen = false;
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
        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("fiscal.settings.rules.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">

    <div class="flex flex-col gap-3 pt-4">
        {#each financialConfigStore.taxRules as rule}
            <SystemListItem
                raw={true}
                onclick={() => openEdit(rule)}
            >
                <div class="relative flex items-center gap-6 shrink-0">
                    <div class="p-1 bg-primary/10 rounded-xl text-primary border border-primary/10 group-hover:bg-primary/20 transition-colors w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                        <Scale class="w-5 h-5" />
                    </div>
                    <div class="flex-1 min-w-[160px]">
                        <div class="flex items-center gap-3">
                            <h4 class="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors uppercase truncate">
                                {rule.name}
                            </h4>
                            <Badge variant="outline" class="text-[8px] font-black uppercase tracking-tighter bg-primary/10 border-none text-primary">
                                {modalitiesStore.modalities.find(m => m.id === rule.trade_type)?.name || rule.trade_type}
                            </Badge>
                        </div>
                        <div class="flex items-center gap-6 mt-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                            <div class="flex items-center gap-2">
                                <span class="text-foreground/60">{rule.tax_rate}%</span>
                                <span>{$t("fiscal.settings.rules.form.rate")}</span>
                            </div>
                            <div class="h-2 w-[1px] bg-muted/10"></div>
                            <div class="flex items-center gap-2">
                                <span class="text-foreground/60">{rule.withholding_rate}%</span>
                                <span>{$t("fiscal.settings.rules.form.withholding")}</span>
                            </div>
                            <div class="h-2 w-[1px] bg-muted/10"></div>
                            <div class="flex items-center gap-2">
                                <span class={cn(rule.cumulative_losses ? "text-primary" : "text-rose-500/60")}>
                                    {rule.cumulative_losses ? $t("common.yes") : $t("common.no")}
                                </span>
                                <span>{$t("fiscal.settings.rules.form.cumulative")}</span>
                            </div>
                            {#if rule.exemption_threshold > 0}
                                <div class="h-2 w-[1px] bg-muted/10"></div>
                                <div class="flex items-center gap-2 text-primary">
                                    <span>{$t("common.currency")} {rule.exemption_threshold.toLocaleString($locale || "pt-BR")}</span>
                                    <span class="text-[8px]">{$t("fiscal.settings.rules.form.exemption")}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="relative flex items-center gap-6">
                    <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                        {#if rule.revenue_code}
                            <Badge variant="outline" class="text-[9px] font-mono font-bold border-border bg-muted/10 text-muted-foreground mr-2">{rule.revenue_code}</Badge>
                        {/if}
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60"
                            onclick={(e) => { e.stopPropagation(); requestDelete(rule.id); }}
                        >
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
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Scale class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30">{$t("fiscal.settings.rules.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                    {$t("fiscal.settings.rules.form.createFirst")}
                </Button>
            </div>
        {/each}
    </div>
</div>

<!-- Rule Dialog -->
<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[550px] bg-white dark:bg-[#0a0c10] border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <div class="p-8 pb-4 bg-muted/5 border-b border-border">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-base font-bold text-foreground flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-xl text-primary border border-primary/10">
                        <Scale class="w-5 h-5" />
                    </div>
                    {editingId ? $t("fiscal.settings.rules.form.titleEdit") : $t("fiscal.settings.rules.form.titleNew")}
                </DialogTitle>
                <DialogDescription class="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-[44px]">
                    {$t("fiscal.settings.rules.description")}
                </DialogDescription>
            </DialogHeader>
        </div>

        <div class="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <!-- Basic Info -->
            <div class="space-y-6">
                <SystemInput 
                    label={$t("fiscal.settings.rules.form.name") + "*"}
                    bind:value={formData.name}
                    placeholder={$t("fiscal.settings.rules.form.namePlaceholder")}
                />

                <div class="grid grid-cols-2 gap-4">
                    <SystemSelect 
                        label={$t("fiscal.settings.rules.form.basis")}
                        bind:value={formData.basis}
                        options={[
                            { value: "NetProfit", label: $t("fiscal.settings.rules.form.basisOptions.netProfit") },
                            { value: "GrossProfit", label: $t("fiscal.settings.rules.form.basisOptions.saleAmount") }
                        ]}
                    />
                    <SystemSelect 
                        label={$t("fiscal.settings.rules.form.modality")}
                        bind:value={formData.trade_type}
                        options={modalitiesStore.modalities.map(m => ({ value: m.id, label: m.name }))}
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <SystemInput 
                        type="number"
                        label={$t("fiscal.settings.rules.form.rate")}
                        bind:value={formData.tax_rate}
                        step="0.1"
                    />
                    <SystemInput 
                        type="number"
                        label={$t("fiscal.settings.rules.form.withholding")}
                        bind:value={formData.withholding_rate}
                        step="0.001"
                    />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <SystemInput 
                    type="number"
                    label={$t("fiscal.settings.rules.form.exemption")}
                    bind:value={formData.exemption_threshold}
                    placeholder="{$t('common.currency')} 0,00"
                />
                <SystemInput 
                    label={$t("fiscal.settings.rules.form.revenueCode")}
                    bind:value={formData.revenue_code}
                    placeholder={$t("fiscal.settings.rules.form.revenueCodePlaceholder")}
                />
            </div>

            <div class="space-y-4">
                <div class="flex items-center justify-between p-5 rounded-2xl bg-muted/5 border border-border">
                    <div class="space-y-0.5">
                        <span class="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">{$t("fiscal.settings.rules.form.cumulative")}</span>
                        <p class="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{$t("fiscal.settings.rules.form.cumulativeHint")}</p>
                    </div>
                    <Switch bind:checked={formData.cumulative_losses} />
                </div>
            </div>
            
            <div class="pb-10"></div>
        </div>

        <DialogFooter class="px-8 py-6 bg-muted/5 border-t border-border flex flex-row justify-end gap-3 rounded-b-[2.5rem]">
            <Button variant="ghost" onclick={() => isDialogOpen = false} class="text-muted-foreground hover:text-foreground hover:bg-transparent uppercase text-[10px] font-bold tracking-widest">
                {$t("common.cancel")}
            </Button>
            <Button onclick={saveRule} class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                {isSubmittingRule ? $t("fiscal.settings.profiles.form.saving") : $t("fiscal.settings.rules.form.save")}
            </Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<style>
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 20px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
</style>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />


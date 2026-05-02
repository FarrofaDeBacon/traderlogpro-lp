<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { accountsStore } from "$lib/stores/accounts.svelte";
    import { currenciesStore } from "$lib/stores/currencies.svelte";
    import { Plus, Pencil, Trash2, Receipt, Calculator, Building2, Activity, Globe, ShieldAlert, Search, ChevronDown, ChevronRight, TrendingUp, Wallet } from "lucide-svelte";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { modalitiesStore } from "$lib/stores/modalities.svelte";
    import { SystemCard, SystemSelect, SystemInput, SystemListItem } from "$lib/components/ui/system";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { t, locale } from "svelte-i18n";
    import type { FeeProfile, FeeProfileEntry } from "$lib/types";
    import { slide } from "svelte/transition";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import { cn } from "$lib/utils";
    import { keyboardList, keyboardForm } from "$lib/actions/keyboard-nav";

    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);
    let expandedGroups = $state<Record<string, boolean>>({});
    let activeModalityId = $state<string>("");
    let entriesMap = $state<Record<string, Partial<FeeProfileEntry>>>({});
    let formData = $state<Omit<FeeProfile, "id">>({
        name: "",
        broker: "",
        notes: "",
    });

    function toggleGroup(group: string) {
        expandedGroups[group] = !expandedGroups[group];
    }

    $effect(() => {
        if (modalitiesStore.modalities.length > 0) {
            if (!activeModalityId) activeModalityId = modalitiesStore.modalities[0].id!;
            
            // Inicializa entriesMap para todas as modalidades se estiver vazio
            modalitiesStore.modalities.forEach(m => {
                if (!entriesMap[m.id!]) {
                    entriesMap[m.id!] = { 
                        modality_id: m.id, 
                        fixed_fee: 0, 
                        percentage_fee: 0, 
                        exchange_fee: 0, 
                        iss: 0, 
                        currency_spread: 0
                    };
                }
            });
        }
    });

    function getEntry(modalityId: string): Partial<FeeProfileEntry> {
        if (!entriesMap[modalityId]) {
            return {
                modality_id: modalityId,
                fixed_fee: 0,
                percentage_fee: 0,
                exchange_fee: 0,
                iss: 0,
                currency_spread: 0,
                withholding_tax: 0,
                income_tax_rate: 0,
            };
        }
        return entriesMap[modalityId];
    }

    let currentEntry = $derived(getEntry(activeModalityId));

    let groupedFees = $derived.by(() => {
        const groups: Record<string, FeeProfile[]> = {};
        const filteredFees = financialConfigStore.fees.filter(f => {
            const account = accountsStore.accounts.find(a => a.id === f.account_id);
            const resolvedBroker = account?.broker || f.broker || "";
            
            return f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   resolvedBroker.toLowerCase().includes(searchTerm.toLowerCase());
        });

        for (const fee of filteredFees) {
            const account = accountsStore.accounts.find(a => a.id === fee.account_id);
            const broker = account?.broker || fee.broker || $t("common.all");
            if (!groups[broker]) groups[broker] = [];
            groups[broker].push(fee);
        }
        return groups;
    });

    function getBrokerStyle(name: string) {
        const n = name.toLowerCase();
        if (n.includes("binance")) return { color: "text-amber-500", bg: "bg-amber-500/10" };
        if (n.includes("xp")) return { color: "text-blue-500", bg: "bg-blue-500/10" };
        if (n.includes("profit") || n.includes("nelogica")) return { color: "text-green-500", bg: "bg-green-500/10" };
        return { color: "text-muted-foreground", bg: "bg-muted" };
    }

    let simValue = $state(10000);

    function resetForm() {
        formData = { name: "", broker: "", notes: "" };
        entriesMap = {};
        modalitiesStore.modalities.forEach(m => {
            entriesMap[m.id!] = { modality_id: m.id, fixed_fee: 0, percentage_fee: 0, exchange_fee: 0, iss: 0, currency_spread: 0, withholding_tax: 0, income_tax_rate: 0 };
        });
        if (modalitiesStore.modalities.length > 0) activeModalityId = modalitiesStore.modalities[0].id!;
        editingId = null;
    }

    function openNew() { resetForm(); isDialogOpen = true; }

    function openEdit(profile: FeeProfile) {
        editingId = profile.id;
        formData = { name: profile.name, broker: profile.broker, notes: profile.notes, account_id: profile.account_id };
        const entries = financialConfigStore.getEntriesForFeeProfile(profile.id);
        entriesMap = {};
        modalitiesStore.modalities.forEach(m => {
            const entry = entries.find(e => e.modality_id === m.id);
            entriesMap[m.id!] = entry ? { ...entry } : { modality_id: m.id, fixed_fee: 0, percentage_fee: 0, exchange_fee: 0, iss: 0, currency_spread: 0, withholding_tax: 0, income_tax_rate: 0 };
        });
        if (modalitiesStore.modalities.length > 0) activeModalityId = modalitiesStore.modalities[0].id!;
        isDialogOpen = true;
    }

    async function save() {
        const payload = { ...formData };
        let profileId = editingId;
        if (editingId) financialConfigStore.updateFeeProfile(editingId, payload);
        else profileId = await financialConfigStore.addFeeProfile(payload) as unknown as string;
        for (const modId of Object.keys(entriesMap)) {
            const entry = entriesMap[modId];
            if (profileId) await financialConfigStore.saveFeeProfileEntry({ ...entry, fee_profile_id: profileId } as FeeProfileEntry);
        }
        isDialogOpen = false;
    }

    function requestDelete(id: string) { deleteId = id; isDeleteOpen = true; }

    async function confirmDelete() {
        if (deleteId) {
            const result = await financialConfigStore.deleteFeeProfile(deleteId);
            if (!result.success) toast.error(result.error || $t("common.error"));
            else toast.success($t("common.deleteSuccess"));
            deleteId = null; isDeleteOpen = false;
        }
    }

    function calc(val: number, pct: number) { return (val * pct) / 100; }

    let currentCurrencySymbol = $derived.by(() => {
        const account = accountsStore.accounts.find(a => a.id === formData.account_id);
        return currenciesStore.getCurrencySymbol(account?.currency || "BRL");
    });

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
                placeholder={$t("fees.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground"
            />
        </div>
        <Button onclick={openNew} class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Plus class="w-4 h-4 mr-2" />
            {$t("fees.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">
    <div class="grid gap-10 pt-4" use:keyboardList>
        {#if Object.keys(groupedFees).length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Receipt class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30">{$t("fees.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                    {searchTerm ? $t("common.clear") : $t("fees.form.createFirst")}
                </Button>
            </div>
        {:else}
            {#each Object.entries(groupedFees) as [brokerName, profiles]}
                {@const style = getBrokerStyle(brokerName)}
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button type="button" class="flex items-center gap-3 px-2 group w-full text-left outline-none" onclick={() => toggleGroup(brokerName)}>
                        <div class={cn("p-1.5 rounded-xl transition-colors group-hover:bg-primary/20", style.bg.replace("bg-muted", "bg-primary/10"))}>
                            <Building2 class={cn("w-3.5 h-3.5", style.color.includes("muted") ? "text-primary" : style.color)} />
                        </div>
                        <div class="flex flex-col">
                            <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">{brokerName}</h4>
                        </div>
                        <div class="h-[1px] flex-1 bg-muted/10 mx-2"></div>
                        {#if expandedGroups[brokerName]}<ChevronDown class="w-4 h-4 text-muted-foreground/40" />{:else}<ChevronRight class="w-4 h-4 text-muted-foreground/40" />{/if}
                    </button>

                    {#if expandedGroups[brokerName] || Object.keys(groupedFees).length === 1}
                        <div transition:slide={{ duration: 200 }} class="flex flex-col gap-3">
                            {#each profiles as profile}
                                <SystemListItem
                                    raw={true}
                                    onclick={() => openEdit(profile)}
                                >
                                    <div class="relative flex items-center gap-6 shrink-0">
                                        <div class="p-1 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-border dark:border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                                            <Receipt class="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div class="flex flex-col gap-0.5 min-w-[160px]">
                                            <h4 class="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">{profile.name}</h4>
                                            {#if profile.account_id}
                                                {@const account = accountsStore.accounts.find(a => a.id === profile.account_id)}
                                                <span class="text-[9px] font-bold text-primary/60 uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                                                    <Wallet class="w-2.5 h-2.5" />
                                                    {account?.broker || $t("fees.form.unknownAccount")} • {account?.nickname || ''}
                                                </span>
                                            {:else}
                                                <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">{profile.broker || $t("fees.form.noBroker")}</span>
                                            {/if}
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
    <DialogContent class="sm:max-w-[750px] bg-white dark:bg-[#0a0c10] border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl ring-1 ring-border">
        <div class="p-6 pb-4 bg-muted/5 border-b border-border">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-xl"><Receipt class="w-5 h-5 text-primary" /></div>
                    {editingId ? $t("fees.edit") : $t("fees.new")}
                </DialogTitle>
                <DialogDescription class="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-[44px]">
                    {$t("fees.description")}
                </DialogDescription>
            </DialogHeader>
        </div>

        <div class="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" use:keyboardForm>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SystemInput label={$t("fees.form.name")} bind:value={formData.name} placeholder={$t("fees.form.namePlaceholder")} class="font-bold tracking-widest" />
                <SystemSelect
                    label={$t("fees.form.account")}
                    bind:value={formData.account_id}
                    options={[{ value: "", label: $t("fees.form.defaultAccount") }, ...accountsStore.accounts.map(a => ({ value: a.id, label: `${a.nickname} (${a.broker})` }))]}
                />
            </div>

            <div class="space-y-4">
                <div class="flex items-center justify-between border-b border-border pb-3">
                    <div class="flex flex-col gap-1">
                        <h4 class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 italic leading-none">{$t("fees.form.operationalCosts")}</h4>
                        <span class="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">{$t("fees.form.modalityConfig")}</span>
                    </div>
                    <div class="flex p-0.5 bg-muted/5 rounded-xl border border-border">
                        {#each modalitiesStore.modalities as mod}
                            <button type="button" class={cn("px-5 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all duration-500", activeModalityId === mod.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "text-muted-foreground/30 hover:text-foreground/50")} onclick={() => activeModalityId = mod.id!}>
                                {mod.name}
                            </button>
                        {/each}
                    </div>
                </div>

                {#if entriesMap[activeModalityId]}
                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-4 duration-700">
                        <SystemInput label={$t("fees.form.fixedFee")} type="number" bind:value={entriesMap[activeModalityId].fixed_fee} prefix={currentCurrencySymbol} class="font-bold tabular-nums tracking-tighter" />
                        <SystemInput label={$t("fees.form.percentageFee")} type="number" bind:value={entriesMap[activeModalityId].percentage_fee} suffix="%" class="font-bold tabular-nums tracking-tighter" />
                        <SystemInput label={$t("fees.form.exchangeFee")} type="number" bind:value={entriesMap[activeModalityId].exchange_fee} suffix="%" class="font-bold tabular-nums tracking-tighter" />
                        <SystemInput label={$t("fees.form.iss")} type="number" bind:value={entriesMap[activeModalityId].iss} suffix="%" class="font-bold tabular-nums tracking-tighter" />
                        <SystemInput label={$t("fees.form.spread")} type="number" bind:value={entriesMap[activeModalityId].currency_spread} suffix="%" class="font-bold tabular-nums tracking-tighter" />
                    </div>
                {:else if modalitiesStore.modalities.length > 0}
                    <div class="flex items-center justify-center py-10 opacity-20">
                        <span class="text-[10px] font-bold uppercase tracking-widest">{$t("fees.form.initializing")}</span>
                    </div>
                {:else}
                    <div class="flex flex-col items-center justify-center py-10 gap-3">
                        <span class="text-[10px] font-bold uppercase tracking-widest opacity-20 text-destructive">{$t("fees.form.noModalities")}</span>
                        <a href="/settings/modalities" class="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline transition-all">
                            {$t("fees.form.createModalityFirst")}
                        </a>
                    </div>
                {/if}
            </div>

            <div class="p-6 rounded-[2rem] bg-emerald-500/[0.02] border border-emerald-500/10 dark:border-emerald-500/5 space-y-5 relative overflow-hidden group/sim">
                <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none"></div>
                <div class="flex items-center justify-between border-b border-emerald-500/10 dark:border-emerald-500/5 pb-3">
                    <div class="flex flex-col gap-1">
                        <span class="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-500/60 leading-none italic">{$t("fees.simulator.title")}</span>
                        <span class="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">{$t("fees.simulator.description")}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-[9px] text-muted-foreground/50 uppercase font-bold tracking-widest leading-none">{$t("fees.simulator.volume")}:</span>
                        <div class="relative group/input">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 dark:text-emerald-500/40">R$</span>
                            <input type="number" class="h-9 w-32 bg-muted/10 border border-emerald-500/20 dark:border-white/5 text-[11px] rounded-xl text-right font-bold tabular-nums tracking-tighter focus:border-emerald-500/30 outline-none pl-8 pr-4 transition-all text-foreground" bind:value={simValue} />
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="space-y-1 px-1 border-l border-border">
                        <span class="text-[8px] uppercase text-muted-foreground/20 font-bold tracking-[0.2em] leading-none block mb-1.5">{$t("fees.simulator.fixed")}</span>
                        <p class="text-sm font-bold text-foreground/80 tabular-nums tracking-tighter">{currentCurrencySymbol} {(currentEntry.fixed_fee || 0).toFixed(2)}</p>
                    </div>
                    <div class="space-y-1 px-1 border-l border-border">
                        <span class="text-[8px] uppercase text-muted-foreground/20 font-bold tracking-[0.2em] leading-none block mb-1.5">{$t("fees.simulator.variable")}</span>
                        <p class="text-sm font-bold text-foreground/80 tabular-nums tracking-tighter">{currentCurrencySymbol} {(calc(simValue, currentEntry.percentage_fee || 0) + calc(simValue, currentEntry.exchange_fee || 0)).toFixed(2)}</p>
                    </div>
                    <div class="space-y-1 px-1 border-l border-border">
                        <span class="text-[8px] uppercase text-muted-foreground/20 font-bold tracking-[0.2em] leading-none block mb-1.5">{$t("fees.simulator.b3")}</span>
                        <p class="text-sm font-bold text-foreground/80 tabular-nums tracking-tighter">{currentCurrencySymbol} {(calc(simValue, currentEntry.exchange_fee || 0)).toFixed(2)}</p>
                    </div>
                    <div class="space-y-1 px-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col justify-center items-end py-2 relative overflow-hidden group-hover/sim:border-emerald-500/20 transition-all">
                        <span class="text-[8px] uppercase text-emerald-500 font-bold tracking-[0.3em] leading-none mb-1.5 z-10">{$t("fees.simulator.total")}</span>
                        <p class="text-xl font-bold text-emerald-400 tabular-nums tracking-tighter leading-none z-10">
                            {currentCurrencySymbol} {(
                                (currentEntry.fixed_fee || 0) +
                                calc(simValue, currentEntry.percentage_fee || 0) +
                                calc(simValue, currentEntry.exchange_fee || 0) +
                                calc(simValue + (currentEntry.fixed_fee || 0), currentEntry.iss || 0) +
                                calc(simValue, currentEntry.currency_spread || 0)
                            ).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <div class="space-y-2 pb-4">
                <SystemInput label={$t("fees.form.notes")} bind:value={formData.notes} placeholder={$t("fees.form.notesPlaceholder")} multiline={true} class="text-xs" />
            </div>
        </div>

        <DialogFooter class="p-6 bg-muted/5 border-t border-border flex flex-row items-center justify-end gap-3">
            <Button variant="ghost" onclick={() => isDialogOpen = false} class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {$t("common.cancel")}
            </Button>
            <Button onclick={save} class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-10 h-9 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                {$t("fees.form.save")}
            </Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 6px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(255, 255, 255, 0.1); }
</style>

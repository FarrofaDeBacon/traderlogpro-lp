<script lang="ts">
    import { currenciesStore } from "$lib/stores/currencies.svelte";
    import { Plus, Pencil, Trash2, Coins, Search, RefreshCw, TrendingUp, Fingerprint, ChevronRight, ChevronDown, Globe } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { SystemInput, SystemListItem } from "$lib/components/ui/system";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { t, locale } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import { Badge } from "$lib/components/ui/badge";
    import { slide } from "svelte/transition";
    import { cn } from "$lib/utils";
    import type { Currency } from "$lib/types";

    let isDialogOpen = $state(false);
    let isSyncing = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    let filteredItems = $derived(
        currenciesStore.currencies
            .filter(c => 
                c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.code.localeCompare(b.code))
    );

    let expandedGroups = $state<Record<string, boolean>>({
        "Base": true,
        "Estrangeira": false
    });

    function toggleGroup(group: string) {
        const isCurrentlyExpanded = expandedGroups[group];
        expandedGroups = { "Base": false, "Estrangeira": false };
        if (!isCurrentlyExpanded) expandedGroups[group] = true;
    }

    let groupedCurrencies = $derived.by(() => {
        const groups: Record<string, Currency[]> = {
            "Base": [],
            "Estrangeira": []
        };
        for (const c of filteredItems) {
            if (c.code === 'BRL') {
                groups["Base"].push(c);
            } else {
                groups["Estrangeira"].push(c);
            }
        }
        return groups;
    });

    let formData = $state<Omit<Currency, "id">>({
        code: "",
        symbol: "",
        name: "",
        exchange_rate: 1.0,
    });

    function resetForm() {
        formData = { code: "", symbol: "", name: "", exchange_rate: 1.0 };
        editingId = null;
    }

    function openNew() {
        resetForm();
        isDialogOpen = true;
    }

    function openEdit(currency: Currency) {
        editingId = currency.id;
        formData = { ...$state.snapshot(currency) };
        isDialogOpen = true;
    }

    async function saveCurrency() {
        if (!formData.code || !formData.name) {
            toast.error($t("common.error"));
            return;
        }

        try {
            if (editingId) {
                await currenciesStore.updateCurrency(editingId, formData);
            } else {
                await currenciesStore.addCurrency(formData);
            }
            toast.success($t("common.saveSuccess"));
            isDialogOpen = false;
        } catch (e) {
            toast.error(String(e));
        }
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId) {
            const result = await currenciesStore.deleteCurrency(deleteId);
            if (!result.success) {
                toast.error(result.error || $t("common.error"));
            } else {
                toast.success($t("common.deleteSuccess"));
            }
            deleteId = null;
        }
    }

    async function handleSync() {
        if (isSyncing) return;
        isSyncing = true;
        try {
            const result = await currenciesStore.syncExchangeRates();
            if (result?.success) {
                toast.success(`Sincronizado! ${result.count} moedas atualizadas.`);
            } else {
                toast.error(result?.error || "Erro ao sincronizar moedas.");
            }
        } catch (e) {
            toast.error(String(e));
        } finally {
            isSyncing = false;
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
                placeholder={$t("currencies.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80"
            />
        </div>

        <div class="flex items-center gap-2">
            <Button
                variant="ghost"
                class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest border border-white/5 bg-muted/5 hover:bg-muted/10"
                onclick={handleSync}
                disabled={isSyncing}
            >
                <RefreshCw class="w-3 h-3 mr-2 {isSyncing ? 'animate-spin' : ''}" />
                {isSyncing ? $t("common.loading") : $t("common.syncExchange")}
            </Button>

            <Button 
                onclick={openNew} 
                class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
                <Plus class="w-4 h-4 mr-2" />
                {$t("currencies.new")}
            </Button>
        </div>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">


    <div class="grid gap-10 pt-4">
        {#if filteredItems.length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-card/40 backdrop-blur-xl text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Coins class="w-20 h-20 opacity-10 mb-8" />
                <span class="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60 mb-8">{$t("currencies.empty")}</span>
                <button 
                    onclick={() => { if (searchTerm) searchTerm = ""; else openNew(); }}
                    class="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-all hover:scale-105 active:scale-95"
                >
                    {searchTerm ? $t("common.clear") : $t("currencies.form.createFirst")}
                </button>
            </div>
        {:else}
            {#each Object.keys(groupedCurrencies) as group}
                {#if groupedCurrencies[group].length > 0}
                    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <button 
                            type="button" 
                            class="flex items-center gap-3 px-2 group w-full text-left outline-none" 
                            onclick={() => toggleGroup(group)}
                        >
                            <div class={cn(
                                "p-1.5 rounded-xl transition-colors",
                                group === "Base" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                                <Coins class="w-3.5 h-3.5" />
                            </div>
                            <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                                {group === "Base" ? $t("currencies.labels.baseCurrencies") : $t("currencies.labels.foreignCurrencies")}
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
                                {#each groupedCurrencies[group] as currency (currency.id)}
                                    <SystemListItem
                                        raw={true}
                                        onclick={() => openEdit(currency)}
                                        onkeydown={(e) => e.key === 'Enter' && openEdit(currency)}
                                    >
                                        <div class="absolute inset-0 bg-gradient-to-br from-primary/0 to-blue-500/0 dark:group-hover:from-primary/[0.03] dark:group-hover:to-blue-500/[0.03] rounded-3xl transition-all duration-700 pointer-events-none"></div>

                                        <div class="relative flex items-center gap-6 shrink-0">
                                            <div class="p-1.5 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20 border border-border dark:border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                                                <span class="text-xl font-black text-primary/80 group-hover:text-primary transition-colors leading-none tracking-tighter">{currency.symbol}</span>
                                            </div>
                                            <div class="flex flex-col gap-0.5 min-w-[160px]">
                                                <div class="flex items-center gap-2">
                                                    <h4 class="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                                                        {currency.code}
                                                    </h4>
                                                    <Badge variant="outline" class="text-[9px] h-4 font-bold uppercase tracking-tighter rounded-xl border-none px-2 bg-emerald-500/10 text-emerald-500">
                                                        {currency.code === 'BRL' ? 'BASE' : 'CONV'}
                                                    </Badge>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        {currency.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="relative flex flex-col items-end gap-0.5 mr-auto ml-12">
                                            <span class="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] leading-none mb-1">
                                                {$t("currencies.labels.exchangeToBase", { base: 'BRL' })}
                                            </span>
                                            <div class="flex items-center gap-2 tabular-nums font-bold text-xl text-foreground tracking-tighter group-hover:scale-105 transition-transform origin-right duration-500">
                                                <TrendingUp class="w-4 h-4 text-emerald-500/80" />
                                                <span>{currency.exchange_rate.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</span>
                                            </div>
                                        </div>

                                        <div class="relative flex items-center gap-6">
                                            <div class="hidden md:flex flex-col items-end gap-0.5 px-4 h-8 justify-center border-x border-border opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <span class="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">ID</span>
                                                <span class="font-mono text-[9px] text-muted-foreground/30 tracking-tight leading-none uppercase">{currency.id.split(':').at(-1) || currency.id}</span>
                                            </div>

                                            <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60" 
                                                    onclick={(e) => { e.stopPropagation(); requestDelete(currency.id); }}
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
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[450px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-xl"><Coins class="w-5 h-5 text-primary" /></div>
                    {editingId
                        ? $t("currencies.edit")
                        : $t("currencies.new")}
                </DialogTitle>
                <DialogDescription class="text-[10px] font-bold uppercase tracking-widest opacity-30 ml-[44px]">
                    {$t("currencies.form.description")}
                </DialogDescription>
            </DialogHeader>
        </div>

        <div class="px-8 py-8 space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <SystemInput 
                    label={$t("currencies.form.isoCode")}
                    bind:value={formData.code}
                    placeholder={$t("currencies.form.codePlaceholder")}
                    maxlength={3}
                    class="font-bold tracking-widest"
                />
                <SystemInput 
                    label={$t("currencies.form.symbol")}
                    bind:value={formData.symbol}
                    placeholder={$t("currencies.form.symbolPlaceholder")}
                    class="font-bold"
                />
            </div>

            <SystemInput 
                label={$t("currencies.form.name")}
                bind:value={formData.name}
                placeholder={$t("currencies.form.namePlaceholder")}
                class="font-bold tracking-widest"
            />

            <div class="space-y-3">
                <div class="flex items-center justify-between px-1">
                    <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80">{$t("currencies.form.exchangeRate")}</span>
                    <Badge variant="outline" class="text-[8px] h-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 font-bold uppercase tracking-tighter">
                        {$t("currencies.form.brlProportion")}
                    </Badge>
                </div>
                <div class="relative group">
                    <TrendingUp class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="number"
                        bind:value={formData.exchange_rate}
                        step="0.0001"
                        class="h-10 w-full bg-muted/5 border border-border rounded-xl px-12 text-sm font-bold tracking-tight focus:border-primary/40 outline-none transition-all tabular-nums"
                    />
                </div>
                <p class="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest px-1">{$t("currencies.form.exchangeRateHint")}</p>
            </div>
        </div>

        <DialogFooter class="px-8 py-6 border-t border-border bg-muted/5 rounded-b-[2.5rem] flex flex-row items-center justify-end gap-3">
            <Button variant="ghost" onclick={() => (isDialogOpen = false)} class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {$t("common.cancel")}
            </Button>
            <Button onclick={saveCurrency} class="rounded-xl px-10 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:scale-105 transition-all shadow-xl shadow-primary/20">
                {$t("currencies.form.save")}
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

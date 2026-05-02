<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { currenciesStore } from "$lib/stores/currencies.svelte";
    import { Plus, Pencil, Trash2, Globe, MapPin, Clock, Calendar, ChevronDown, ChevronRight, Activity, ShieldCheck, Search, Coins, Layers } from "lucide-svelte";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import { SystemCard, SystemSelect, SystemInput, SystemListItem } from "$lib/components/ui/system";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { appStore } from "$lib/stores/app.svelte";
    import { marketsStore } from "$lib/stores/markets.svelte";
    import type { Market } from "$lib/types";
    import { t } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import Skeleton from "$lib/components/ui/skeleton.svelte";
    import { slide } from "svelte/transition";
    import { cn } from "$lib/utils";

    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");
    let expandedGroups = $state<Record<string, boolean>>({});
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);

    let formMarket = $state<Omit<Market, "id">>({
        code: "",
        name: "",
        timezone: "America/Sao_Paulo",
        currency_id: "currency:brl",
        trading_days: [1, 2, 3, 4, 5],
        trading_sessions: [{ start_time: "09:00", end_time: "18:00" }],
    });

    const weekdays = [
        { value: 0, label: "sun" },
        { value: 1, label: "mon" },
        { value: 2, label: "tue" },
        { value: 3, label: "wed" },
        { value: 4, label: "thu" },
        { value: 5, label: "fri" },
        { value: 6, label: "sat" },
    ];

    function toggleDay(day: number) {
        if (formMarket.trading_days.includes(day)) {
            formMarket.trading_days = formMarket.trading_days.filter((d) => d !== day);
        } else {
            formMarket.trading_days = [...formMarket.trading_days, day].sort();
        }
    }

    function addSession() {
        formMarket.trading_sessions = [...formMarket.trading_sessions, { start_time: "09:00", end_time: "18:00" }];
    }

    function removeSession(index: number) {
        formMarket.trading_sessions = formMarket.trading_sessions.filter((_, i) => i !== index);
    }

    const timezones = [
        { value: "America/Sao_Paulo", label: "Brasília (UTC-3)" },
        { value: "America/New_York", label: "Nova York (US Eastern)" },
        { value: "America/Chicago", label: "Chicago (US Central)" },
        { value: "UTC", label: "UTC (Universal)" },
        { value: "Europe/London", label: "Londres (GMT/BST)" },
        { value: "Asia/Tokyo", label: "Tóquio (JST)" },
    ];

    let filteredMarkets = $derived(
        marketsStore.markets
            .filter(m => m.code.toLowerCase().includes(searchTerm.toLowerCase()) || m.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.code.localeCompare(b.code))
    );

    let groupedMarkets = $derived.by(() => {
        const groups: Record<string, Market[]> = {};
        for (const item of filteredMarkets) {
            const tzLabel = timezones.find((t) => t.value === item.timezone)?.label || item.timezone;
            if (!groups[tzLabel]) groups[tzLabel] = [];
            groups[tzLabel].push(item);
        }
        return groups;
    });

    $effect(() => {
        const keys = Object.keys(groupedMarkets);
        if (keys.length > 0 && Object.keys(expandedGroups).length === 0) {
            keys.forEach(k => expandedGroups[k] = true);
        }
    });

    function openNew() {
        editingId = null;
        formMarket = { 
            code: "", 
            name: "", 
            timezone: "America/Sao_Paulo", 
            currency_id: "currency:brl",
            trading_days: [1, 2, 3, 4, 5], 
            trading_sessions: [{ start_time: "09:00", end_time: "18:00" }] 
        };
        isDialogOpen = true;
    }

    function openEdit(market: Market) {
        editingId = market.id;
        formMarket = { 
            code: market.code || "", 
            name: market.name || "", 
            timezone: market.timezone || "America/Sao_Paulo", 
            currency_id: market.currency_id || "currency:brl",
            trading_days: [...(market.trading_days || [])], 
            trading_sessions: (market.trading_sessions || []).map((s) => ({ ...s })) 
        };
        isDialogOpen = true;
    }

    async function save() {
        if (editingId) marketsStore.updateMarket(editingId, $state.snapshot(formMarket));
        else marketsStore.addMarket($state.snapshot(formMarket));
        toast.success($t("common.saveSuccess"));
        isDialogOpen = false;
    }

    function requestDelete(id: string) { deleteId = id; isDeleteOpen = true; }

    async function confirmDelete() {
        if (deleteId) {
            const result = await marketsStore.deleteMarket(deleteId);
            if (result.success) {
                toast.success($t("common.deleteSuccess"));
            } else {
                toast.error($t(result.error || "common.error"));
            }
            deleteId = null; isDeleteOpen = false;
        }
    }

    function toggleGroup(timezone: string) {
        const isExpanded = expandedGroups[timezone];
        expandedGroups = {};
        if (!isExpanded) expandedGroups[timezone] = true;
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
                placeholder={$t("markets.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80 text-foreground"
            />
        </div>
        <Button onclick={openNew} class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus class="w-4 h-4 mr-2" />
            {$t("markets.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">
    <div class="grid gap-10 pt-8">
        {#if appStore.isLoadingData && Object.keys(groupedMarkets).length === 0}
            <div class="space-y-6">
                <Skeleton class="h-10 w-64 rounded-xl bg-muted/10" />
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each Array(3) as _}
                        <Skeleton class="h-40 rounded-[2rem] bg-muted/10" />
                    {/each}
                </div>
            </div>
        {:else if Object.keys(groupedMarkets).length > 0}
            {#each Object.entries(groupedMarkets) as [timezone, items]}
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <button type="button" class="flex items-center gap-3 px-2 group w-full text-left outline-none" onclick={() => toggleGroup(timezone)}>
                        <div class="p-1.5 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                            <Globe class="w-3.5 h-3.5 text-primary" />
                        </div>
                        <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">{timezone}</h4>
                        <div class="h-[1px] flex-1 bg-muted/10"></div>
                        {#if expandedGroups[timezone]}<ChevronDown class="w-4 h-4 text-muted-foreground/40" />{:else}<ChevronRight class="w-4 h-4 text-muted-foreground/40" />{/if}
                    </button>

                    {#if expandedGroups[timezone]}
                        <div transition:slide={{ duration: 200 }} class="flex flex-col gap-3">
                            {#each items as item}
                                <SystemListItem
                                    raw={true}
                                    onclick={() => openEdit(item)}
                                >
                                    <div class="relative flex items-center gap-6 shrink-0">
                                        <div class="p-1 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-border dark:border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0 leading-none">
                                            <MapPin class="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div class="flex flex-col gap-0.5 min-w-[160px]">
                                            <div class="flex items-center gap-2">
                                                <h4 class="font-bold text-sm tracking-tight text-foreground">{item.code}</h4>
                                                <div class="h-4 w-[1px] bg-muted/20 mx-1"></div>
                                                <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.name}</span>
                                            </div>
                                            <div class="flex items-center gap-4 text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">
                                                <div class="flex items-center gap-1.5">
                                                    <Clock class="w-3 h-3" />
                                                    <span>{#if item.trading_sessions?.length}{item.trading_sessions[0].start_time} — {item.trading_sessions[0].end_time}{:else}{$t('markets.form.not_available')}{/if}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="relative flex items-center gap-6">
                                        <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                            <Button variant="ghost" size="icon" class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60" onclick={(e) => { e.stopPropagation(); requestDelete(item.id); }}><Trash2 class="w-4 h-4" /></Button>
                                            <div class="p-2 bg-muted/20 dark:bg-white/5 rounded-xl md:flex hidden group-hover:bg-primary/20 transition-colors">
                                                <Pencil class="w-3.5 h-3.5 text-primary" onclick={(e) => { e.stopPropagation(); openEdit(item); }} />
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
        {:else}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-card/40 backdrop-blur-xl text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Globe class="w-20 h-20 opacity-10 mb-8" />
                <span class="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60 mb-8">{$t("markets.empty")}</span>
                <button 
                    onclick={openNew}
                    class="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-all hover:scale-105 active:scale-95"
                >
                    {searchTerm ? $t("common.clear") : $t("markets.form.createFirst")}
                </button>
            </div>
        {/if}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<DialogRoot bind:open={isDialogOpen}>
    <DialogContent class="sm:max-w-[500px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-7 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-xl"><MapPin class="w-5 h-5 text-primary" /></div>
                    {editingId ? $t("markets.edit") : $t("markets.new")}
                </DialogTitle>
            </DialogHeader>
        </div>

        <div class="px-8 py-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-2 gap-4 mt-6">
                <SystemInput label={$t("markets.form.code")} bind:value={formMarket.code} placeholder={$t("markets.form.codePlaceholder")} class="font-bold" />
                <SystemInput label={$t("markets.form.fullName")} bind:value={formMarket.name} placeholder={$t("markets.form.fullNamePlaceholder")} class="font-bold" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <SystemSelect label={$t("markets.form.timezone")} bind:value={formMarket.timezone} options={timezones} />
                <SystemSelect 
                    label={$t("markets.form.baseCurrency")} 
                    bind:value={formMarket.currency_id} 
                    options={(currenciesStore.currencies || []).map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))} 
                />
            </div>

            <div class="space-y-3 px-1">
                <span class="text-[11px] uppercase font-extrabold tracking-widest text-muted-foreground/30 block">{$t("markets.form.tradingDays")}</span>
                <div class="flex gap-2">
                    {#each weekdays as day}
                        <Button variant={formMarket.trading_days.includes(day.value) ? "default" : "outline"} size="sm" class={cn("flex-1 h-11 rounded-xl transition-all font-bold text-xs", formMarket.trading_days.includes(day.value) ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/5" : "bg-muted/10 border-border text-muted-foreground/40 hover:text-foreground")} onclick={() => toggleDay(day.value)}>{$t(`common.weekdays.short.${day.label}`).charAt(0).toUpperCase()}</Button>
                    {/each}
                </div>
            </div>

            <div class="space-y-4 pt-2 pb-6">
                <div class="flex items-center justify-between px-1">
                    <span class="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/40">{$t("markets.form.tradingSessions")}</span>
                    <Button variant="ghost" size="sm" onclick={addSession} class="h-8 text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 hover:text-foreground"><Plus class="w-3 h-3 mr-1" />{$t("markets.form.add")}</Button>
                </div>
                {#each formMarket.trading_sessions as session, idx}
                    <div class="p-4 rounded-3xl border border-border bg-muted/5 space-y-4 relative group hover:border-primary/20 transition-colors shadow-inner">
                        <div class="grid grid-cols-2 gap-6">
                            <SystemInput label={$t("markets.form.start")} type="time" bind:value={session.start_time} class="text-center font-bold" />
                            <SystemInput label={$t("markets.form.end")} type="time" bind:value={session.end_time} class="text-center font-bold" />
                        </div>
                        {#if formMarket.trading_sessions.length > 1}
                            <Button variant="ghost" size="icon" class="absolute -top-1 -right-1 h-7 w-7 rounded-xl bg-card border border-border text-muted-foreground/20 hover:text-destructive hover:border-destructive/50 opacity-0 group-hover:opacity-100 transition-all font-bold" onclick={() => removeSession(idx)}><Trash2 class="w-3.5 h-3.5" /></Button>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <DialogFooter class="p-8 bg-muted/5 border-t border-border flex flex-row items-center justify-end gap-3">
            <Button variant="ghost" onclick={() => isDialogOpen = false} class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">{$t("common.cancel")}</Button>
            <Button onclick={save} class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-9 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">{$t("common.save")}</Button>
        </DialogFooter>
    </DialogContent>
</DialogRoot>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 6px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: rgba(255, 255, 255, 0.1); }
</style>

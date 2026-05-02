<script lang="ts">
    import { assetTypesStore } from "$lib/stores/asset-types.svelte";
    import { assetsStore } from "$lib/stores/assets.svelte";
    import { accountsStore } from "$lib/stores/accounts.svelte";
    import { t } from "svelte-i18n";
    import { untrack } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { currenciesStore } from "$lib/stores/currencies.svelte";
    import { tradesStore } from "$lib/stores/trades.svelte";
    import { appStore } from "$lib/stores/app.svelte";
    import { workspaceStore } from "$lib/stores/workspace.svelte";
    import { riskStore } from "$lib/stores/riskStore.svelte";
    import { rtdStore } from "$lib/stores/rtd.svelte";
    import { getLiveIntervention } from "$lib/domain/insights/insights-engine";
    import { toLocalDateStr, toLocalDateTimeStr } from "$lib/domain/risk/risk-utils";
    import { SystemCard } from "$lib/components/ui/system";
    import {
        Zap,
        TrendingUp,
        TrendingDown,
        Loader2,
        AlertCircle,
        Plus,
        RefreshCw,
        CheckCircle2,
        X,
        Maximize2
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import { cn } from "$lib/utils";
    
    let { detached = false, layout = "horizontal" } = $props<{
        detached?: boolean;
        layout?: "horizontal" | "vertical";
    }>();

    let dateInput = $state(toLocalDateTimeStr(new Date()));
    let selectedAccountId = $state("");
    let direction = $state<"Buy" | "Sell">("Buy");
    let resultInput = $state("");
    let quantityInput = $state("1");
    let entryPriceInput = $state("");
    let isSubmitting = $state(false);
    let assetSymbol = $state("");
    let selectedAssetTypeId = $state("");
    let selectedStrategyId = $state("");
    let isLivePriceActive = $state(false);

    // Memory for last used selections
    import { onMount } from "svelte";
    const MEMORY_KEY_ASSET_TYPE = "traderlog_last_asset_type";
    const MEMORY_KEY_ASSET = "traderlog_last_asset";
    const MEMORY_KEY_ACCOUNT = "traderlog_last_account";
    const MEMORY_KEY_STRATEGY = "traderlog_last_strategy";

    onMount(() => {
        const savedType = localStorage.getItem(MEMORY_KEY_ASSET_TYPE);
        const savedAsset = localStorage.getItem(MEMORY_KEY_ASSET);
        const savedAccount = localStorage.getItem(MEMORY_KEY_ACCOUNT);
        const savedStrategy = localStorage.getItem(MEMORY_KEY_STRATEGY);

        if (savedType) selectedAssetTypeId = savedType;
        if (savedAsset) assetSymbol = savedAsset;
        if (savedAccount) selectedAccountId = savedAccount;
        if (savedStrategy) selectedStrategyId = savedStrategy;
    });

    // Watch and save changes to memory
    $effect(() => {
        if (selectedAssetTypeId) localStorage.setItem(MEMORY_KEY_ASSET_TYPE, selectedAssetTypeId);
        if (assetSymbol) localStorage.setItem(MEMORY_KEY_ASSET, assetSymbol);
        if (selectedAccountId) localStorage.setItem(MEMORY_KEY_ACCOUNT, selectedAccountId);
        if (selectedStrategyId) localStorage.setItem(MEMORY_KEY_STRATEGY, selectedStrategyId);
    });

    // Initialize selections from stores if available (fallback)
    $effect(() => {
        if (!selectedAccountId && accountsStore.accounts.length > 0) {
            selectedAccountId = accountsStore.accounts[0].id;
        }
        if (!selectedAssetTypeId && assetTypesStore.assetTypes.length > 0) {
            selectedAssetTypeId = assetTypesStore.assetTypes[0].id;
        }
    });

    // Auto-calculate exit price from entry price + result
    let computedExitPrice = $derived.by(() => {
        const entry = parseFloat(entryPriceInput.replace(",", "."));
        const result = parseFloat(resultInput.replace(",", "."));
        const qty = parseFloat(quantityInput.replace(",", "."));
        if (isNaN(entry) || entry <= 0 || isNaN(result) || isNaN(qty) || qty <= 0) return null;
        const perUnit = result / qty;
        return direction === "Buy" ? entry + perUnit : entry - perUnit;
    });

    let intervention = $derived.by(() => {
        const trades = tradesStore.trades;
        const cockpit = untrack(() => riskStore.riskCockpitState);
        return getLiveIntervention(trades, new Date(), (trade) => parseFloat(trade.result?.toString() || "0"), cockpit);
    });

    let filteredAssets = $derived.by(() => {
        if (!selectedAssetTypeId) return assetsStore.assets;
        const targetId = selectedAssetTypeId.replace(/^asset_type:/, "");
        return assetsStore.assets.filter(a => (a.asset_type_id || "").replace(/^asset_type:/, "") === targetId);
    });

    async function handleQuickSubmit() {
        if (!assetSymbol || !resultInput) {
            toast.error($t("trades.wizard.messages.required_fields"));
            return;
        }
        const rawResult = parseFloat(resultInput.replace(",", "."));
        if (isNaN(rawResult)) {
            toast.error($t("trades.messages.invalid_result"));
            return;
        }
        isSubmitting = true;
        try {
            // Update date to today if not manually set
            if (!dateInput) dateInput = toLocalDateTimeStr(new Date());
            
            const entryPrice = parseFloat(entryPriceInput.replace(",", ".")) || 0;
            const exitPrice = computedExitPrice || 0;
            
            // Auto-detect asset type from symbol or default to first
            const matchedAsset = assetsStore.assets.find(a => a.symbol.toUpperCase() === assetSymbol.toUpperCase());
            const assetTypeId = selectedAssetTypeId || matchedAsset?.asset_type_id || assetTypesStore.assetTypes[0]?.id || "";

            const res = await tradesStore.addTrade({
                date: dateInput,
                asset_symbol: assetSymbol.toUpperCase(),
                asset_type_id: assetTypeId,
                strategy_id: selectedStrategyId || workspaceStore.strategies[0]?.id || "",
                account_id: selectedAccountId || accountsStore.accounts[0]?.id || "",
                result: rawResult,
                quantity: parseFloat(quantityInput.replace(",", ".")) || 1,
                direction: direction,
                entry_price: entryPrice > 0 ? entryPrice : 0,
                exit_price: exitPrice > 0 ? exitPrice : null,
                exit_date: dateInput,
                fee_total: 0,
                notes: "",
                timeframe: "M1",
                volatility: "normal",
                entry_emotional_state_id: null,
                exit_reason: null,
                exit_emotional_state_id: null,
                entry_rationale: "",
                confirmation_signals: "",
                market_context: "",
                relevant_news: "",
                psychology_analysis_during: "",
                followed_plan: true,
                what_worked: "",
                mistakes_improvements: "",
                lessons_learned: "",
                images: [],
                partial_exits: [],
                modality_id: null,
                stop_loss: null,
                take_profit: null,
                intensity: 10
            } as any);
            if (res.success) {
                toast.success(`${assetSymbol.toUpperCase()} ${rawResult >= 0 ? "+" : ""}${rawResult.toFixed(2)}`);
                resultInput = "";
                quantityInput = "1";
                entryPriceInput = "";
                // assetSymbol is kept for memory.
                // tradesStore.addTrade() already calls loadTrades() internally,
                // which updates tradesStore.trades ($state) and triggers reactivity on all pages.
            }
        } catch (e) {
            console.error("[QuickLog] Submission Error:", e);
            toast.error($t("trades.messages.submission_fail"));
        } finally {
            isSubmitting = false;
        }
    }

    function clearFields() {
        resultInput = "";
        quantityInput = "1";
        entryPriceInput = "";
        assetSymbol = "";
    }

    $effect(() => {
        if (isLivePriceActive && assetSymbol) {
            const quote = rtdStore.quotes[assetSymbol.toUpperCase()];
            if (quote && quote.last > 0) {
                untrack(() => {
                    entryPriceInput = quote.last.toString();
                });
            }
        }
    });

    function syncLivePrice() {
        if (!assetSymbol) {
            toast.error($t("trades.wizard.messages.select_asset_first"));
            return;
        }
        const quote = rtdStore.quotes[assetSymbol.toUpperCase()];
        if (quote && quote.last > 0) {
            entryPriceInput = quote.last.toString();
        } else {
            toast.error($t("trades.messages.no_quote_found"));
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !isSubmitting && assetSymbol && resultInput) {
            e.preventDefault();
            handleQuickSubmit();
        }
    }

    const detach = async () => {
        try {
            await invoke("open_detached_quicklog_window");
        } catch (e) {
            console.error("[QuickLog] Failed to detach:", e);
            toast.error($t("common.error"));
        }
    };
</script>

<SystemCard status="success" class={cn("w-full !overflow-visible relative z-10 transition-all bg-white dark:bg-card border border-black/5 dark:border-white/5 shadow-premium", (detached || layout === "vertical") ? "p-4 flex flex-col gap-4" : "py-2 px-4")}>

    {#if detached || layout === "vertical"}
        <!-- VERTICAL LAYOUT FOR DETACHED MODE OR SIDEBAR -->
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border/20 pb-3">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Zap class="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                </div>
                <div class="flex flex-col justify-center">
                    <h3 class="text-[10px] font-black tracking-[0.15em] text-foreground uppercase leading-none">{$t('trades.quicklog.registry_upper')}</h3>
                    <p class="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none mt-1">{$t('trades.quicklog.terminal_upper')}</p>
                </div>
            </div>
            {#if !detached}
                <button
                    onclick={detach}
                    class="flex items-center gap-1.5 h-7 px-3 rounded-full border border-border/30 hover:border-emerald-500/40 bg-muted/5 hover:bg-emerald-500/10 text-muted-foreground/50 hover:text-emerald-500 transition-all text-[8px] font-black uppercase tracking-wider"
                    title={$t("trades.actions.detach")}
                >
                    <Maximize2 class="w-3 h-3 shrink-0" />
                    <span>{$t("trades.actions.detach")}</span>
                </button>
            {/if}
        </div>

        <div class="flex flex-col gap-3">
            <!-- Account & Asset Type -->
            <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.account")}</span>
                    <Select.Root type="single" bind:value={selectedAccountId}>
                        <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-9 text-foreground px-4 shadow-sm text-[11px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                            <span class="truncate">{accountsStore.accounts.find(a => a.id === selectedAccountId)?.nickname ?? '—'}</span>
                        </Select.Trigger>
                        <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                            <div class="max-h-[280px] overflow-y-auto custom-scrollbar">
                                {#each accountsStore.accounts as acc}
                                    <Select.Item value={acc.id} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0" style="background-color: transparent !important;">{acc.nickname}</Select.Item>
                                {/each}
                            </div>
                        </Select.Content>
                    </Select.Root>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("trades.wizard.fields.asset_type")}</span>
                    <Select.Root type="single" bind:value={selectedAssetTypeId}>
                        <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-9 text-foreground px-4 shadow-sm text-[11px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                            <span class="truncate">{assetTypesStore.assetTypes.find(t => t.id === selectedAssetTypeId)?.name ?? '—'}</span>
                        </Select.Trigger>
                        <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                            <div class="max-h-[280px] overflow-y-auto custom-scrollbar">
                                {#each assetTypesStore.assetTypes as type}
                                    <Select.Item value={type.id} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0" style="background-color: transparent !important;">{type.name}</Select.Item>
                                {/each}
                            </div>
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>

            <!-- Asset & Strategy -->
            <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.asset")}</span>
                    <Select.Root type="single" bind:value={assetSymbol}>
                        <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-9 text-foreground px-4 shadow-sm text-[11px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                            <span class="truncate">{assetsStore.assets.find(a => a.symbol === assetSymbol)?.symbol ?? '—'}</span>
                        </Select.Trigger>
                        <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                            <div class="max-h-[280px] overflow-y-auto custom-scrollbar">
                                {#each filteredAssets as asset}
                                    <Select.Item value={asset.symbol} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0 flex items-center justify-between" style="background-color: transparent !important;">
                                        <span>{asset.symbol}</span>
                                        {#if rtdStore.quotes[asset.symbol.toUpperCase()]}
                                            <span class="text-[10px] font-mono text-emerald-500 ml-2">{rtdStore.quotes[asset.symbol.toUpperCase()].last.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        {/if}
                                    </Select.Item>
                                {/each}
                            </div>
                        </Select.Content>
                    </Select.Root>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("trades.wizard.fields.strategy")}</span>
                    <Select.Root type="single" bind:value={selectedStrategyId}>
                        <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-9 text-foreground px-4 shadow-sm text-[11px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                            <span class="truncate text-muted-foreground/50">{workspaceStore.strategies.find(s => s.id === selectedStrategyId)?.name ?? 'Selecionar...'}</span>
                        </Select.Trigger>
                        <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                            <div class="max-h-[280px] overflow-y-auto custom-scrollbar">
                                {#each workspaceStore.strategies as strat}
                                    <Select.Item value={strat.id} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0" style="background-color: transparent !important;">{strat.name}</Select.Item>
                                {/each}
                            </div>
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>

            <!-- Direction -->
            <div class="flex flex-col gap-1">
                <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.table.direction")}</span>
                <div class="h-8 p-0.5 bg-muted/10 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-full flex items-center gap-0.5 shadow-inner overflow-hidden w-full">
                    <button onclick={() => (direction = "Buy")} class="flex-1 h-full rounded-full flex items-center justify-center transition-all duration-300 {direction === 'Buy' ? 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20' : 'text-muted-foreground/40 hover:bg-white/5'}">
                        <span class="text-[9px] uppercase tracking-widest font-black">{$t('trades.quicklog.buy_upper')}</span>
                    </button>
                    <button onclick={() => (direction = "Sell")} class="flex-1 h-full rounded-full flex items-center justify-center transition-all duration-300 {direction === 'Sell' ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20' : 'text-muted-foreground/40 hover:bg-white/5'}">
                        <span class="text-[9px] uppercase tracking-widest font-black">{$t('trades.quicklog.sell_upper')}</span>
                    </button>
                </div>
            </div>

            <!-- Qty & Entry -->
            <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.table.quantity")}</span>
                    <div class="h-8 px-2 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full flex items-center focus-within:border-primary/40 transition-all">
                        <input type="text" bind:value={quantityInput} class="bg-transparent border-none p-0 text-[10px] font-black w-full outline-none text-center tabular-nums text-foreground" />
                    </div>
                </div>
                <div class="flex flex-col gap-1 relative">
                    <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.table.entry")}</span>
                    <div class="h-8 px-2 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full flex items-center focus-within:border-primary/40 transition-all gap-1">
                        <input bind:value={entryPriceInput} placeholder="0.00" class="bg-transparent border-none p-0 text-[10px] font-black w-full outline-none text-center tabular-nums text-foreground" oninput={() => (isLivePriceActive = false)} />
                        <button onclick={() => (isLivePriceActive = !isLivePriceActive)} class={cn("w-7 h-5 rounded-full flex items-center justify-center transition-all shrink-0 text-[7px] font-black uppercase tracking-tighter", isLivePriceActive ? "bg-emerald-500 text-white" : "bg-muted/10 text-muted-foreground/30 hover:text-emerald-500")} title={isLivePriceActive ? "Live ON" : "Sync"}>
                            {isLivePriceActive ? "LIVE" : "SYNC"}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Result -->
            <div class="flex flex-col gap-1">
                <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.result")}</span>
                <div class={cn("h-10 px-2 border rounded-full flex items-center transition-all shadow-inner", resultInput.startsWith("-") ? "bg-rose-500/10 border-rose-500/20" : resultInput && resultInput !== "0" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted/5 dark:bg-white/[0.03] border-black/5 dark:border-white/5")}>
                    <input bind:value={resultInput} placeholder="0.00" class={cn("bg-transparent border-none p-0 text-[14px] font-black w-full outline-none text-center tabular-nums", resultInput.startsWith("-") ? "text-rose-500" : resultInput && resultInput !== "0" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")} onkeydown={handleKeydown} />
                </div>
            </div>

            <!-- Add Button -->
            <Button
                class="w-full h-10 mt-2 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                onclick={handleQuickSubmit}
                disabled={isSubmitting || !assetSymbol || !resultInput}
            >
                {#if isSubmitting}
                    <RefreshCw class="w-4 h-4 animate-spin" />
                {:else}
                    <Plus class="w-4 h-4 mr-2" />
                    {$t('trades.quicklog.add_upper')}
                {/if}
            </Button>
        </div>

    {#if intervention}
        <div class="mt-4 flex items-center gap-2 px-3 py-2 bg-rose-500/5 border-l-2 border-rose-500 rounded-r text-rose-500 animate-in fade-in slide-in-from-top-1">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span class="text-[9px] font-black uppercase tracking-widest leading-tight">{intervention.message}</span>
        </div>
    {/if}

    {:else}
        <!-- HORIZONTAL LAYOUT FOR DASHBOARD (Original 1-row/2-row structure) -->
        <!-- Header row: identity + selects + direction + detach -->
        <div class="flex items-end gap-2 w-full">

            <!-- Identity (compact) -->
            <div class="flex items-center gap-2 shrink-0 border-r border-border/20 pr-3 self-stretch items-center">
                <div class="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Zap class="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                </div>
                <div class="flex flex-col justify-center">
                    <h3 class="text-[8px] font-black tracking-[0.15em] text-foreground uppercase leading-none">{$t('trades.quicklog.registry_upper')}</h3>
                    <p class="text-[6px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none mt-0.5">{$t('trades.quicklog.terminal_upper')}</p>
                </div>
                {#if !detached}
                    <button
                        onclick={detach}
                        class="ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-emerald-500/10 text-muted-foreground/30 hover:text-emerald-500 transition-colors"
                        title={$t("trades.actions.detach")}
                    >
                        <Maximize2 class="w-3 h-3" />
                    </button>
                {/if}
            </div>

        <!-- Account -->
        <div class="flex flex-col gap-1 flex-1 min-w-0">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.account")}</span>
            <Select.Root type="single" bind:value={selectedAccountId}>
                <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-8 text-foreground px-4 shadow-sm text-[10px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                    <span class="truncate">{accountsStore.accounts.find(a => a.id === selectedAccountId)?.nickname ?? '—'}</span>
                </Select.Trigger>
                <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                    <div class="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {#each accountsStore.accounts as acc}
                            <Select.Item value={acc.id} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0" style="background-color: transparent !important;">{acc.nickname}</Select.Item>
                        {/each}
                    </div>
                </Select.Content>
            </Select.Root>
        </div>

        <!-- Asset Type -->
        <div class="flex flex-col gap-1 flex-1 min-w-0">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("trades.wizard.fields.asset_type")}</span>
            <Select.Root type="single" bind:value={selectedAssetTypeId}>
                <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-8 text-foreground px-4 shadow-sm text-[10px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                    <span class="truncate">{assetTypesStore.assetTypes.find(t => t.id === selectedAssetTypeId)?.name ?? '—'}</span>
                </Select.Trigger>
                <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                    <div class="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {#each assetTypesStore.assetTypes as type}
                            <Select.Item value={type.id} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0" style="background-color: transparent !important;">{type.name}</Select.Item>
                        {/each}
                    </div>
                </Select.Content>
            </Select.Root>
        </div>

        <!-- Asset -->
        <div class="flex flex-col gap-1 flex-1 min-w-0">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.asset")}</span>
            <Select.Root type="single" bind:value={assetSymbol}>
                <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-8 text-foreground px-4 shadow-sm text-[10px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                    <span class="truncate">{assetsStore.assets.find(a => a.symbol === assetSymbol)?.symbol ?? '—'}</span>
                </Select.Trigger>
                <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                    <div class="max-h-[220px] overflow-y-auto custom-scrollbar">
                        {#each filteredAssets as asset}
                            <Select.Item value={asset.symbol} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0 flex items-center justify-between" style="background-color: transparent !important;">
                                <span>{asset.symbol}</span>
                                {#if rtdStore.quotes[asset.symbol.toUpperCase()]}
                                    <span class="text-[9px] font-mono text-emerald-500">{rtdStore.quotes[asset.symbol.toUpperCase()].last.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                {/if}
                            </Select.Item>
                        {/each}
                    </div>
                </Select.Content>
            </Select.Root>
        </div>

        <!-- Strategy -->
        <div class="flex flex-col gap-1 flex-1 min-w-0">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("trades.wizard.fields.strategy")}</span>
            <Select.Root type="single" bind:value={selectedStrategyId}>
                <Select.Trigger class="w-full bg-white dark:bg-muted/10 border border-border rounded-full h-8 text-foreground px-4 shadow-sm text-[10px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all">
                    <span class="truncate">{workspaceStore.strategies.find(s => s.id === selectedStrategyId)?.name ?? '—'}</span>
                </Select.Trigger>
                <Select.Content portal={null} class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10" style="opacity: 1 !important;">
                    <div class="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {#each workspaceStore.strategies as strat}
                            <Select.Item value={strat.id} class="text-[11px] font-bold uppercase tracking-wider py-3 px-5 rounded-none cursor-pointer data-[highlighted]:text-primary data-[highlighted]:bg-primary/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0" style="background-color: transparent !important;">{strat.name}</Select.Item>
                        {/each}
                    </div>
                </Select.Content>
            </Select.Root>
        </div>

        <!-- Direction -->
        <div class="flex flex-col gap-1 shrink-0">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.table.direction")}</span>
            <div class="h-8 p-0.5 bg-muted/10 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-full flex items-center gap-0.5 shadow-inner overflow-hidden w-[140px]">
                <button onclick={() => (direction = "Buy")} class="flex-1 h-full rounded-full flex items-center justify-center transition-all duration-300 {direction === 'Buy' ? 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20' : 'text-muted-foreground/40 hover:bg-white/5'}">
                    <span class="text-[9px] uppercase tracking-widest font-black">{$t('trades.quicklog.buy_upper')}</span>
                </button>
                <button onclick={() => (direction = "Sell")} class="flex-1 h-full rounded-full flex items-center justify-center transition-all duration-300 {direction === 'Sell' ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20' : 'text-muted-foreground/40 hover:bg-white/5'}">
                    <span class="text-[9px] uppercase tracking-widest font-black">{$t('trades.quicklog.sell_upper')}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-border/10 my-2"></div>

    <!-- Second row: numeric fields + submit -->
    <div class="flex items-end gap-2 w-full">

        <!-- Date/Time -->
        <div class="flex flex-col gap-1 w-[150px] shrink-0 relative">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.date")}</span>
            <div class="h-8 px-2 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full flex items-center focus-within:border-primary/40 transition-all">
                <input type="datetime-local" bind:value={dateInput} class="inv-input bg-transparent border-none p-0 text-[10px] font-black w-full outline-none tabular-nums text-foreground" />
            </div>
        </div>

        <!-- Qty -->
        <div class="flex flex-col gap-1 w-[70px] shrink-0">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.table.quantity")}</span>
            <div class="h-8 px-2 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full flex items-center focus-within:border-primary/40 transition-all">
                <input type="text" bind:value={quantityInput} class="bg-transparent border-none p-0 text-[10px] font-black w-full outline-none text-center tabular-nums text-foreground" />
            </div>
        </div>

        <!-- Entry -->
        <div class="flex flex-col gap-1 flex-1">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.table.entry")}</span>
            <div class="h-8 px-2 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full flex items-center focus-within:border-primary/40 transition-all gap-1">
                <input bind:value={entryPriceInput} placeholder="0.00" class="bg-transparent border-none p-0 text-[10px] font-black w-full outline-none text-center tabular-nums text-foreground" oninput={() => (isLivePriceActive = false)} />
                <button onclick={() => (isLivePriceActive = !isLivePriceActive)} class={cn("w-7 h-5 rounded-full flex items-center justify-center transition-all shrink-0 text-[7px] font-black uppercase tracking-tighter", isLivePriceActive ? "bg-emerald-500 text-white" : "bg-muted/10 text-muted-foreground/30 hover:text-emerald-500")} title={isLivePriceActive ? "Live ON" : "Sync"}>
                    {isLivePriceActive ? "LIVE" : "SYNC"}
                </button>
            </div>
        </div>

        <!-- Result -->
        <div class="flex flex-col gap-1 flex-1">
            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">{$t("common.result")}</span>
            <div class={cn("h-8 px-2 border rounded-full flex items-center transition-all shadow-inner", resultInput.startsWith("-") ? "bg-rose-500/10 border-rose-500/20" : resultInput && resultInput !== "0" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted/5 dark:bg-white/[0.03] border-black/5 dark:border-white/5")}>
                <input bind:value={resultInput} placeholder="0.00" class={cn("bg-transparent border-none p-0 text-[10px] font-black w-full outline-none text-center tabular-nums", resultInput.startsWith("-") ? "text-rose-500" : resultInput && resultInput !== "0" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")} onkeydown={handleKeydown} />
            </div>
        </div>

        <!-- Add -->
        <Button
            class="h-8 px-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] rounded-full font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20 whitespace-nowrap shrink-0"
            onclick={handleQuickSubmit}
            disabled={isSubmitting || !assetSymbol || !resultInput}
        >
            {#if isSubmitting}
                <RefreshCw class="w-3 h-3 animate-spin" />
            {:else}
                <Plus class="w-3 h-3 mr-1" />
                {$t('trades.quicklog.add_upper')}
            {/if}
        </Button>
    </div>

    {#if intervention}
        <div class="mt-2 flex items-center gap-2 px-3 py-1 bg-rose-500/5 border-l-2 border-rose-500 rounded-r text-rose-500 animate-in fade-in slide-in-from-top-1">
            <AlertCircle class="w-3 h-3 shrink-0" />
            <span class="text-[8px] font-black uppercase tracking-widest">{intervention.message}</span>
        </div>
    {/if}
    {/if}

</SystemCard>
<style>
    .inv-input::-webkit-calendar-picker-indicator {
        filter: invert(1);
        opacity: 0.1;
        cursor: pointer;
        position: absolute;
        right: 0;
        top: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.08); border-radius: 10px; }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); }
</style>

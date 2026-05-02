<script lang="ts">
  import { assetTypesStore } from "$lib/stores/asset-types.svelte";
  import { currenciesStore } from "$lib/stores/currencies.svelte";
  import { accountsStore } from "$lib/stores/accounts.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Card from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
    import { appStore } from "$lib/stores/app.svelte";
    import { workspaceStore } from "$lib/stores/workspace.svelte";
    import { tradesStore } from "$lib/stores/trades.svelte";
    import { userProfileStore } from "$lib/stores/user-profile.svelte.ts";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { rtdStore } from "$lib/stores/rtd.svelte";
    import { gamificationStore } from "$lib/stores/gamification.svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { t, locale, _ } from "svelte-i18n";
    import {
        ChevronDown,
        TrendingUp,
        TrendingDown,
        Calendar as CalendarIcon,
        Search,
        Filter,
        BookOpen,
        Pencil,
        Trash2,
        ArrowRightLeft,
        Eye,
        X,
        CheckCircle2,
        Clock,
        Plus,
        Coins,
        BarChart2,
        Percent,
        Timer,
        ShieldAlert,
        Brain,
        ShieldCheck,
        RefreshCw,
        AlertTriangle,
        Zap,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import HierarchicalList from "$lib/components/shared/HierarchicalList.svelte";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { toast } from "svelte-sonner";
    import {
        cn,
        formatCurrency,
        formatNumber,
        getLocalDatePart,
    } from "$lib/utils";
    import * as Dialog from "$lib/components/ui/dialog";
    import NewTradeWizard from "$lib/components/trades/NewTradeWizard.svelte";
    import TradeDetailView from "$lib/components/trades/TradeDetailView.svelte";
    import * as Select from "$lib/components/ui/select";
    import { Separator } from "$lib/components/ui/separator";
    import { SystemHeader, SystemCard, SystemMetric, SystemAICard } from "$lib/components/ui/system";
    import TradeOutcomePieChart from "$lib/components/trades/TradeOutcomePieChart.svelte";
    import TradeEquityChart from "$lib/components/trades/TradeEquityChart.svelte";
    import { calculateAverageTimeBetweenTrades, formatDuration } from "$lib/utils/gann";
    import { open } from "@tauri-apps/plugin-dialog";
    import { untrack } from "svelte";
    import { format } from "date-fns/format";
    import { filterTradesContext, getTradeViewModel } from "$lib/domain/trades/trade-engine";
    import QuickLog from "$lib/components/trades/QuickLog.svelte";
    import QuickEditTrade from "$lib/components/trades/QuickEditTrade.svelte";
    import { keyboardList, keyboardForm } from "$lib/actions/keyboard-nav";

    let searchQuery = $state("");
    let searchInputRef = $state<HTMLInputElement | null>(null);
    let expandedMonths = $state<Set<string>>(new Set());
    let expandedWeeks = $state<Set<string>>(new Set());
    let expandedDays = $state<Set<string>>(new Set());

    // Filter states
    let filterStatus = $state("all"); // all, open, closed
    let filterAccount = $state("all");
    let filterStrategy = $state("all");
    let filterAssetType = $state("all");
    let filterCurrency = $state("all");
    let showFilters = $state(false);
    let currencyMode = $state<"original" | "main">("original");

    // Dialog/Modal states
    let isDeleteOpen = $state(false);
    let tradeToDelete = $state<string | null>(null);
    let dayToDelete = $state<any>(null);
    let isEditOpen = $state(false);
    let isQuickEditOpen = $state(false);
    let isViewOpen = $state(false);
    let selectedTrade = $state<any>(null);

    // Dynamic Chart Context
    let activeContext = $state<{
        type: "global" | "month" | "week" | "day" | "trade";
        key: string | null;
        label: string;
        data?: any;
    }>({
        type: "global",
        key: null,
        label: $t("common.period.allTime"),
    });

    const allTrades = $derived(tradesStore.trades);

    // Base Filtering logic
    const filteredTrades = $derived.by(() => {
        return filterTradesContext(
            allTrades,
            {
                searchQuery,
                status: filterStatus,
                accountId: filterAccount,
                strategyId: filterStrategy,
                assetTypeId: filterAssetType,
                currency: filterCurrency,
            },
            {
                getStrategyName: (id: string) =>
                    workspaceStore.strategies.find((s) => s.id === id)?.name || "",
                getAccountCurrency: (id: string) =>
                    accountsStore.accounts.find((a) => a.id === id)?.currency || "BRL",
            }
        );
    });

    function getWeekKey(date: Date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split("T")[0];
    }

    const hierarchicalTradesData = $derived.by(() => {
        if (appStore.isLoadingData) return [];

        return getTradeViewModel(
            filteredTrades,
            {
                getAccountCurrency: (id: string) =>
                    accountsStore.accounts.find((a) => a.id === id)?.currency || "BRL",
            },
            {
                formatMonth: (date: Date) =>
                    date.toLocaleDateString($locale || "pt-BR", {
                        month: "long",
                        year: "numeric",
                    }),
                formatWeek: (dateStr: string) =>
                    ($t("trades.list.dashboard.weekOf", {
                        values: {
                            date: new Date(dateStr + "T12:00:00").toLocaleDateString(
                                $locale || "pt-BR",
                                { day: "numeric", month: "short" }
                            )
                        }
                    })).toUpperCase(),
                formatDay: (date: Date) =>
                    date.toLocaleDateString($locale || "pt-BR", {
                        weekday: "long",
                        day: "numeric",
                    }),
            }
        );
    });

    $effect(() => {
        if (hierarchicalTradesData.length > 0) {
            untrack(() => {
                const today = new Date();
                const currentMonthKey = today.toISOString().slice(0, 7);
                const currentWeekKey = getWeekKey(today);

                // Auto-expand current month and week if not already set
                if (expandedMonths.size === 0) {
                    // Try to find current month
                    if (hierarchicalTradesData.some(m => m.key === currentMonthKey)) {
                        expandedMonths.add(currentMonthKey);
                    } else {
                        // Fallback to latest month
                        expandedMonths.add(hierarchicalTradesData[0].key);
                    }
                    
                    // Try to find current week in the expanded month
                    const month = hierarchicalTradesData.find(m => expandedMonths.has(m.key));
                    if (month && month.weeks.length > 0) {
                        const currentWeek = month.weeks.find((w: any) => w.key === currentWeekKey);
                        if (currentWeek) {
                            expandedWeeks.add(currentWeek.key);
                        } else {
                            expandedWeeks.add(month.weeks[0].key);
                        }
                    }
                    
                    expandedMonths = new Set(expandedMonths);
                    expandedWeeks = new Set(expandedWeeks);
                }
            });
        }
    });

    function getDayResult(trades: any[]) {
        if (currencyMode === "main") {
            return trades.reduce(
                (sum, t) =>
                    sum +
                    tradesStore.getConvertedTradeResult(
                        t,
                        accountsStore.accounts,
                        currenciesStore.currencies,
                    ),
                0,
            );
        }
        const summary: Record<string, number> = {};
        trades.forEach((t) => {
            const acc = accountsStore.accounts.find(
                (a) => a.id === t.account_id,
            );
            const curr = acc?.currency || (userProfileStore.userProfile?.main_currency || "BRL");
            summary[curr] = (summary[curr] || 0) + (t.result || 0);
        });
        return summary;
    }

    const kpis = $derived.by(() => {
        const total = filteredTrades.length;
        const mainCurrency = userProfileStore.userProfile?.main_currency || "BRL";

        let profitTotal = 0;
        let winners = 0;
        let winnersProfit = 0;
        let totalLoss = 0;
        let consolidatedTotal = 0;
        const pnlByCurrency: Record<string, number> = {};

        filteredTrades.forEach((t) => {
            const acc = accountsStore.accounts.find(
                (a) => a.id === t.account_id,
            );
            const curr = acc?.currency || "BRL";
            const rawResult = t.result || 0;

            // PnL by currency
            pnlByCurrency[curr] = (pnlByCurrency[curr] || 0) + rawResult;

            // Converted result for consolidated metrics
            const convertedRes = tradesStore.getConvertedTradeResult(
                t,
                accountsStore.accounts,
                currenciesStore.currencies,
            );

            consolidatedTotal += convertedRes;

            const metricResult =
                currencyMode === "main" ? convertedRes : rawResult;

            profitTotal += metricResult;

            if (metricResult > 0) {
                winners++;
                winnersProfit += metricResult;
            } else if (metricResult < 0) {
                totalLoss += Math.abs(metricResult);
            }
        });

        const winRate = total > 0 ? (winners / total) * 100 : 0;
        const profitFactor =
            totalLoss === 0
                ? winnersProfit > 0
                    ? 99.99
                    : 0
                : winnersProfit / totalLoss;

        return {
            total,
            profitTotal,
            pnlByCurrency,
            mainCurrency,
            consolidatedTotal,
            winRate: winRate.toFixed(1),
            winners,
            openCount: allTrades.filter((t) => !t.exit_price).length,
            profitFactor: profitFactor.toFixed(2),
            avgInterval: calculateAverageTimeBetweenTrades(filteredTrades),
        };
    });


    const filteredTradesForChart = $derived.by(() => {
        let baseTrades = [];

        if (activeContext.type === "global") {
            baseTrades = filteredTrades;
        } else if (activeContext.type === "month") {
            const month = hierarchicalTradesData.find(
                (m) => m.key === activeContext.key,
            );
            baseTrades = month?.trades || [];
        } else if (activeContext.type === "week") {
            const week = hierarchicalTradesData
                .flatMap((m) => m.weeks)
                .find((w) => w.key === activeContext.key);
            baseTrades = week?.trades || [];
        } else if (activeContext.type === "day") {
            const day = hierarchicalTradesData
                .flatMap((m) => m.weeks)
                .flatMap((w) => w.days)
                .find((d) => d.key === activeContext.key);
            baseTrades = day?.trades || [];
        } else if (activeContext.type === "trade") {
            baseTrades = activeContext.data ? [activeContext.data] : [];
        } else {
            baseTrades = filteredTrades;
        }

        // CRITICAL: Sort chronologically for accurate Drawdown and Equity Curve calculation
        return [...baseTrades].sort(
            (a, b) =>
                new Date(a.exit_date || a.date).getTime() -
                new Date(b.exit_date || b.date).getTime(),
        );
    });

    const activeContextStats = $derived.by(() => {
        const trades = filteredTradesForChart;
        const total = trades.length;

        if (total === 0) {
            return {
                total: 0,
                pnlEntries: [],
                winRate: "0.0",
                profitFactor: "0.00",
                avgGain: 0,
                avgLoss: 0,
                riskReward: "0.00",
                maxDrawdown: 0,
            };
        }

        let winners = 0;
        let losers = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let cumulativePnl = 0;
        let maxPeak = 0;
        let maxDd = 0;
        const pnlByCurrency: Record<string, number> = {};

        trades.forEach((t: any) => {
            const acc = accountsStore.accounts.find(
                (a) => a.id === t.account_id,
            );
            const curr = acc?.currency || "BRL";
            const res = t.result || 0;

            pnlByCurrency[curr] = (pnlByCurrency[curr] || 0) + res;

            // Use converted result for cross-currency calculations
            const convertedRes = tradesStore.getConvertedTradeResult(
                t,
                accountsStore.accounts,
                currenciesStore.currencies,
            );

            if (convertedRes > 0) {
                winners++;
                grossProfit += convertedRes;
            } else if (convertedRes < 0) {
                losers++;
                grossLoss += Math.abs(convertedRes);
            }

            // Drawdown calculation
            cumulativePnl += convertedRes;
            if (cumulativePnl > maxPeak) maxPeak = cumulativePnl;
            const dd = maxPeak - cumulativePnl;
            if (dd > maxDd) maxDd = dd;
        });

        const pnlEntries = Object.entries(pnlByCurrency).map(([curr, val]) => ({
            curr,
            val: val as number,
        }));

        const winRate = (winners / total) * 100;
        const profitFactor =
            grossLoss === 0
                ? grossProfit > 0
                    ? 99.99
                    : 0
                : grossProfit / grossLoss;
        const avgGain = winners > 0 ? grossProfit / winners : 0;
        const avgLoss = losers > 0 ? grossLoss / losers : 0;
        const rr =
            avgLoss === 0 ? (avgGain > 0 ? 99.99 : 0) : avgGain / avgLoss;

        return {
            total,
            pnlEntries,
            winRate: winRate.toFixed(1),
            profitFactor: profitFactor.toFixed(2),
            avgGain,
            avgLoss,
            riskReward: rr.toFixed(2),
            maxDrawdown: maxDd,
            mainCurrency: userProfileStore.userProfile?.main_currency || "BRL",
        };
    });

    function handleSelectTrade(trade: any) {
        activeContext = {
            type: "trade",
            key: trade.id,
            label: `${trade.asset_symbol} (${format(new Date(trade.date), "dd/MM")})`,
            data: trade,
        };
    }

    function handleEdit(trade: any) {
        selectedTrade = trade;
        isQuickEditOpen = true;
    }

    function handleAdvancedEdit() {
        isQuickEditOpen = false;
        setTimeout(() => { isEditOpen = true; }, 100);
    }

    function handleView(trade: any) {
        selectedTrade = trade;
        isViewOpen = true;
    }

    // Keyboard Shortcuts Logic
    function handleGlobalKeydown(e: KeyboardEvent) {
        // Prevent shortcuts if user is typing in inputs or textareas
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        // CTRL/CMD + N: New Trade
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            selectedTrade = null;
            isEditOpen = true;
        }

        // CTRL/CMD + K: Focus Search
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            setTimeout(() => { if (searchInputRef) searchInputRef.focus(); }, 50);
        }
    }

    let deleteModalDescription = $state("");

    function requestDelete(trade: (typeof tradesStore.trades)[0]) {
        tradeToDelete = trade.id;

        // Check if this trade is part of any system-linked cash transaction (daily closure)
        const normalizedId =
            trade.id.split(":").pop()?.replace(/[⟨⟩`]/g, "") || trade.id;
        const linkedClosure = financialConfigStore.cashTransactions.find(
            (ct) =>
                ct.system_linked &&
                ct.trade_ids?.some(
                    (tid) =>
                        (tid.split(":").pop()?.replace(/[⟨⟩`]/g, "") || tid) ===
                        normalizedId,
                ),
        );

        if (linkedClosure) {
            deleteModalDescription = $t("trades.delete.confirmation_with_closure");
        } else {
            deleteModalDescription = $t("trades.delete.confirmation");
        }

        isDeleteOpen = true;
    }

    function requestDeleteDay(day: any) {
        dayToDelete = day;
        tradeToDelete = null;
        deleteModalDescription = $t("trades.delete.day_confirmation", {
            count: day.trades.length,
            date: day.date
        });
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (tradeToDelete) {
            const result = await tradesStore.removeTrade(tradeToDelete);
            if (result.success) {
                toast.success($t("trades.messages.delete_success"));
                appStore.loadData();
            } else {
                toast.error($t("trades.messages.delete_error"));
            }
        } else if (dayToDelete) {
            const ids = dayToDelete.trades.map((t: any) => t.id);
            const result = await tradesStore.removeTrades(ids);
            if (result.success) {
                toast.success($t("common.deleteSuccess"));
                appStore.loadData();
            } else {
                toast.error($t("common.deleteError"));
            }
        }
        isDeleteOpen = false;
        tradeToDelete = null;
        dayToDelete = null;
    }

    function clearFilters() {
        filterStatus = "all";
        filterAccount = "all";
        filterStrategy = "all";
        filterAssetType = "all";
        filterCurrency = "all";
        searchQuery = "";
    }

    async function handleImportProfit() {
        if (accountsStore.accounts.length === 0) {
            toast.error($t("trades.messages.no_accounts"));
            return;
        }

        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: "CSV",
                    extensions: ["csv"]
                }]
            });

            if (!selected || Array.isArray(selected)) return;

            // Simple account selection for now: pick the first real account or just the first one
            const targetAccount = accountsStore.accounts.find(a => a.account_type === "Real") || accountsStore.accounts[0];

            toast.promise(
                invoke("import_profit_trades", {
                    filePath: selected,
                    accountId: targetAccount.id
                }),
                {
                    loading: $t("trades.messages.importing"),
                    success: (data: any) => {
                        tradesStore.loadTrades();
                        appStore.loadData();
                        return data;
                    },
                    error: (err: any) => `${$t("common.error")}: ${err}`
                }
            );
        } catch (err) {
            console.error("Import failed:", err);
            toast.error($t("trades.list.actions.import_fail"));
        }
    }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="space-y-6 animate-in fade-in duration-500 p-4 md:p-8">
    {#snippet tradeActions()}
        <div class="flex gap-2 items-center">
            <div class="relative hidden sm:block">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input bind:ref={searchInputRef} bind:value={searchQuery} placeholder={$t("trades.filters.search_placeholder")} class="pl-8 h-8 w-[180px] lg:w-[220px] bg-background/50 border-border/50 text-[10px] shadow-none font-medium" />
            </div>
            
            <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                class="h-8 text-[10px] font-bold uppercase tracking-tight"
                onclick={() => (showFilters = !showFilters)}
            >
                <Filter class="w-3.5 h-3.5 mr-2" />
                {$t("trades.filters.title")}
                {#if filterStatus !== "all" || filterAccount !== "all" || filterStrategy !== "all" || filterAssetType !== "all"}
                    <Badge
                        class="ml-2 h-3.5 w-3.5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-[10px]"
                        >!</Badge
                    >
                {/if}
            </Button>

            <Button
                size="sm"
                class="h-8 text-[10px] font-bold uppercase tracking-tight"
                variant="outline"
                onclick={() => {
                    selectedTrade = null;
                    isEditOpen = true;
                }}
            >
                <Plus class="w-3.5 h-3.5 mr-1" />
                {$t("trades.list.actions.new_trade")}
            </Button>
            
            <Button
                size="sm"
                class="h-8 text-[10px] font-bold uppercase tracking-tight"
                variant="outline"
                onclick={handleImportProfit}
            >
                <ArrowRightLeft class="w-3.5 h-3.5 mr-2 opacity-60" />
                {$t("trades.list.actions.import_profit")}
            </Button>
        </div>
    {/snippet}

    <SystemCard status="primary" class="p-3 bg-primary/5">
        <SystemHeader 
            title={$t("trades.title")}
            subtitle={$t("trades.subtitle")}
            icon={ArrowRightLeft}
            variant="page"
            class="mb-0"
            actions={tradeActions}
        />
    </SystemCard>

    <div class="flex flex-col xl:flex-row gap-4 items-start">
        
        <!-- Left Side (Main Trades Content) -->
        <div class="flex-1 flex flex-col min-w-0 space-y-6">
        
        <!-- AI Assistant & Behavioral Radar (Dashboard Style) -->
        <SystemAICard 
            title={$t('dashboard.sections.assistantLabel')}
            status={gamificationStore.proactiveSignals.length > 0 ? "success" : "idle"}
            class="w-full"
        >
            {#snippet content()}
                {#if gamificationStore.proactiveSignals.length > 0}
                    {@const signal = gamificationStore.proactiveSignals[0]}
                    <div class="flex items-center gap-4 py-1">
                        <div class={cn(
                            "w-9 h-9 rounded-full shrink-0 flex items-center justify-center border",
                            signal.type === 'warning' ? "bg-rose-500/20 text-rose-500 border-rose-500/30" : 
                            signal.type === 'reminder' ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : 
                            "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                        )}>
                            {#if signal.type === 'warning'} <ShieldAlert class="w-4 h-4" />
                            {:else if signal.type === 'reminder'} <AlertTriangle class="w-4 h-4" />
                            {:else} <Zap class="w-4 h-4" /> {/if}
                        </div>
                        <div class="min-w-0">
                            <h5 class="text-[10px] font-black uppercase text-foreground/90 leading-tight truncate tracking-widest">
                                {signal.key ? $t(signal.key + '.title', signal.params) : signal.title}
                            </h5>
                            <p class="text-[10px] font-bold text-muted-foreground leading-tight mt-1">
                                {signal.key ? $t(signal.key + '.message', signal.params) : signal.message}
                            </p>
                        </div>
                    </div>
                {:else}
                    <div class="flex items-center gap-3 py-1">
                        <ShieldCheck class="w-5 h-5 text-emerald-500" />
                        <span class="text-[10px] font-black uppercase text-emerald-500/80 tracking-[0.2em]">{$t('dashboard.sections.allClear')}</span>
                    </div>
                {/if}
            {/snippet}

            {#snippet matrix()}
                <div class="flex flex-col gap-3 mt-2 lg:mt-0 lg:border-l lg:border-border/10 lg:pl-6">
                    <SystemHeader 
                        title={$t('dashboard.sections.behavioralRadarLabel')}
                        icon={Brain}
                        variant="compact"
                        class="mb-1 text-indigo-500"
                    />
                    <div class="flex flex-wrap gap-2">
                        <!-- We can use generic insights or specific trade insights here -->
                        <div class="w-full py-2 opacity-40">
                            <span class="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">{$t('dashboard.sections.noAnomalies')}</span>
                        </div>
                    </div>
                </div>
            {/snippet}
        </SystemAICard>

        <!-- KPI Row (Restored Original 5-Card Grid) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
            <SystemCard status={kpis.profitTotal >= 0 ? 'success' : 'danger'} class="p-3">
                <SystemMetric 
                    label={$t("trades.kpi.totalBalance")}
                    value={formatCurrency(kpis.consolidatedTotal, kpis.mainCurrency)}
                    status={kpis.consolidatedTotal >= 0 ? 'success' : 'danger'}
                    weight="black"
                />
            </SystemCard>

            <SystemCard status="info" class="p-3">
                <SystemMetric 
                    label={$t("trades.kpi.winRate")}
                    value={kpis.winRate + "%"}
                    status={Number(kpis.winRate) >= 50 ? 'success' : 'danger'}
                    weight="black"
                    subvalue={$t("trades.kpi.winRateDesc", {
                        winners: kpis.winners, total: kpis.total
                     })}
                />
            </SystemCard>

            <SystemCard status="info" class="p-3">
                <SystemMetric 
                    label={$t("trades.kpi.profitFactor")}
                    value={kpis.profitFactor}
                    status={Number(kpis.profitFactor) >= 1.2 ? 'success' : Number(kpis.profitFactor) >= 1.0 ? 'warning' : 'danger'}
                    weight="black"
                />
            </SystemCard>

            <SystemCard status="warning" class="p-3">
                <SystemMetric 
                    label={$t("trades.kpi.openTrades")}
                    value={kpis.openCount}
                    status={kpis.openCount > 0 ? 'warning' : 'none'}
                    weight="bold"
                />
            </SystemCard>

            <SystemCard status="info" class="p-3">
                <SystemMetric 
                    label={$t("trades.kpi.avgInterval")}
                    value={formatDuration(kpis.avgInterval)}
                    weight="bold"
                />
            </SystemCard>
        </div>

        {#if showFilters}
            <SystemCard class="p-4 overflow-visible! mb-6 relative z-[60]">
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex flex-col gap-1.5 min-w-[140px]">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("trades.filters.status")}</span>
                        <Select.Root type="single" bind:value={filterStatus}>
                            <Select.Trigger class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 dark:text-foreground/70 ring-0 focus:ring-0">
                                <span class="truncate">
                                    {#if filterStatus === "all"}
                                        {$t("common.all")}
                                    {:else if filterStatus === "open"}
                                        {$t("trades.list.table.status_open")}
                                    {:else if filterStatus === "closed"}
                                        {$t("trades.list.table.status_closed")}
                                    {:else}
                                        {filterStatus}
                                    {/if}
                                </span>
                            </Select.Trigger>
                            <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <Select.Item value="all" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{$t("common.all")}</Select.Item>
                                <Select.Item value="open" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{$t("trades.list.table.status_open")}</Select.Item>
                                <Select.Item value="closed" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{$t("trades.list.table.status_closed")}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="flex flex-col gap-1.5 min-w-[140px]">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("trades.filters.account")}</span>
                        <Select.Root type="single" bind:value={filterAccount}>
                            <Select.Trigger class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 dark:text-foreground/70 ring-0 focus:ring-0">
                                <span class="truncate">
                                    {accountsStore.accounts.find(a => a.id === filterAccount)?.nickname || $t("common.all")}
                                </span>
                            </Select.Trigger>
                            <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <Select.Item value="all" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{$t("common.all")}</Select.Item>
                                {#each accountsStore.accounts as acc}
                                    <Select.Item value={acc.id} class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{acc.nickname}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="flex flex-col gap-1.5 min-w-[140px]">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("trades.filters.strategy")}</span>
                        <Select.Root type="single" bind:value={filterStrategy}>
                            <Select.Trigger class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 dark:text-foreground/70 ring-0 focus:ring-0">
                                <span class="truncate">
                                    {workspaceStore.strategies.find(s => s.id === filterStrategy)?.name || $t("common.all")}
                                </span>
                            </Select.Trigger>
                            <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <Select.Item value="all" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{$t("common.all")}</Select.Item>
                                {#each workspaceStore.strategies as strat}
                                    <Select.Item value={strat.id} class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{strat.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="flex flex-col gap-1.5 min-w-[140px]">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("trades.filters.assetType")}</span>
                        <Select.Root type="single" bind:value={filterAssetType}>
                            <Select.Trigger class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 dark:text-foreground/70 ring-0 focus:ring-0">
                                <span class="truncate">
                                    {assetTypesStore.assetTypes.find(at => at.id === filterAssetType)?.name || $t("common.all")}
                                </span>
                            </Select.Trigger>
                            <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <Select.Item value="all" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{$t("common.all")}</Select.Item>
                                {#each assetTypesStore.assetTypes as type}
                                    <Select.Item value={type.id} class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{type.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="flex flex-col gap-1.5 min-w-[140px]">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("trades.filters.currency")}</span>
                        <Select.Root type="single" bind:value={filterCurrency}>
                            <Select.Trigger class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 dark:text-foreground/70 ring-0 focus:ring-0">
                                <span class="truncate">
                                    {filterCurrency === "all" ? $t("common.all") : filterCurrency}
                                </span>
                            </Select.Trigger>
                            <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <Select.Item value="all" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{$t("common.all")}</Select.Item>
                                {#each [...new Set(accountsStore.accounts.map(a => a.currency))] as curr}
                                    <Select.Item value={curr} class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">{curr}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="flex-1 flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest hover:bg-muted/10"
                            onclick={clearFilters}
                        >
                            <X class="w-3.5 h-3.5 mr-2" />
                            {$t("trades.list.actions.clear_filters")}
                        </Button>
                    </div>
                </div>
            </SystemCard>
        {/if}

        <!-- Main Split Content -->
        <div class="w-full">
            <!-- Left: Month/Week/Day Trade Hierarchy (MAIN LIST) -->
            <div class="space-y-4">
                {#if hierarchicalTradesData.length === 0}
                    <div
                        class="mt-8 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 p-12 text-center bg-accent/5"
                    >
                        <div
                            class="p-6 rounded-full bg-muted border border-primary/10 mb-4 shadow-xl"
                        >
                            <BookOpen
                                class="w-12 h-12 text-muted-foreground/50"
                            />
                        </div>
                        <h3 class="text-xl font-bold tracking-tight">
                            {$t("trades.list.empty.title")}
                        </h3>
                        <p
                            class="text-sm text-muted-foreground max-w-xs mx-auto mt-2"
                        >
                            {$t("trades.list.empty.description")}
                        </p>
                        <Button
                            class="mt-8 h-11 px-8 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            onclick={() => {
                                selectedTrade = null;
                                isEditOpen = true;
                            }}
                        >
                            {$t("trades.list.actions.new_trade")}
                        </Button>
                    </div>
                {:else}
                    <HierarchicalList
                        data={hierarchicalTradesData}
                        autoExpandDefault={true}
                        bind:expandedMonths
                        bind:expandedWeeks
                        bind:expandedDays
                        mutualExclusion={true}
                        onMonthToggle={(key, expanded) => {
                            if (expanded) {
                                const month = hierarchicalTradesData.find(
                                    (m) => m.key === key,
                                );
                                if (month)
                                    activeContext = {
                                        type: "month",
                                        key,
                                        label: month.label,
                                    };
                            } else {
                                activeContext = {
                                    type: "global",
                                    key: null,
                                    label:
                                        $t("common.period.allTime"),
                                };
                            }
                        }}
                        onWeekToggle={(key, expanded) => {
                            if (expanded) {
                                const week = hierarchicalTradesData
                                    .flatMap((m) => m.weeks)
                                    .find((w) => w.key === key);
                                if (week)
                                    activeContext = {
                                        type: "week",
                                        key,
                                        label: week.label,
                                    };
                            }
                        }}
                        onDayToggle={(key, expanded) => {
                            if (expanded) {
                                const day = hierarchicalTradesData
                                    .flatMap((m) => m.weeks)
                                    .flatMap((w) => w.days)
                                    .find((d) => d.key === key);
                                if (day)
                                    activeContext = {
                                        type: "day",
                                        key,
                                        label: day.label,
                                    };
                            }
                        }}
                    >
                        {#snippet monthBadges(month)}
                            <Badge
                                variant="outline"
                                class="text-[9px] px-1.5 h-4 bg-muted/50 border-border/50 font-bold uppercase"
                            >
                                {month.trades.length}
                                {$t("trades.messages.trades_count")}
                            </Badge>
                            <div class="flex gap-2">
                                {#each month.pnlEntries ?? [] as entry}
                                    <div class="flex items-baseline gap-0.5">
                                        <span
                                            class="text-[8px] text-muted-foreground uppercase"
                                            >{entry.curr}</span
                                        >
                                        <span
                                            class="text-[9px] font-mono font-bold {entry.val >=
                                            0
                                                ? 'text-emerald-500'
                                                : 'text-rose-500'}"
                                            >{formatNumber(entry.val)}</span
                                        >
                                    </div>
                                {/each}
                            </div>
                        {/snippet}
                        {#snippet weekBadges(week)}
                            <div class="flex gap-2">
                                {#each week.pnlEntries ?? [] as entry}
                                    <div class="flex items-baseline gap-0.5">
                                        <span
                                            class="text-[7px] text-muted-foreground uppercase"
                                            >{entry.curr}</span
                                        >
                                        <span
                                            class="text-[9px] font-mono font-bold {entry.val >=
                                            0
                                                ? 'text-emerald-500'
                                                : 'text-rose-500'}"
                                            >{formatNumber(entry.val)}</span
                                        >
                                    </div>
                                {/each}
                            </div>
                        {/snippet}
                        {#snippet dayBadges(day)}
                            <span
                                class="text-[8px] text-muted-foreground/60 font-medium"
                                >({day.trades.length}
                                {$t("trades.messages.trades_count")})</span
                            >
                            {#each day.pnlEntries ?? [] as entry}
                                <div class="flex items-baseline gap-0.5">
                                    <span
                                        class="text-[7px] text-muted-foreground uppercase"
                                        >{entry.curr}</span
                                    >
                                    <span
                                        class="text-[8px] font-mono font-bold {entry.val >=
                                        0
                                            ? 'text-emerald-500'
                                            : 'text-rose-500'}"
                                        >{formatNumber(entry.val)}</span
                                    >
                                </div>
                            {/each}
                        {/snippet}
                        {#snippet dayRight(day)}
                            <button
                                class="p-1.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-all duration-200 cursor-pointer border-none bg-transparent group/del-day"
                                title={$t("trades.list.actions.delete_day")}
                                onclick={(e) => {
                                    e.stopPropagation();
                                    requestDeleteDay(day);
                                }}
                            >
                                <Trash2 class="w-3.5 h-3.5" />
                            </button>
                        {/snippet}
                        {#snippet dayContent(day)}
                            <Table.Root>
                                <Table.Header>
                                    <Table.Row
                                        class="hover:bg-transparent border-border/10"
                                    >
                                        <Table.Head
                                            class="h-8 text-[9px] font-black uppercase text-muted-foreground"
                                            >{$t("trades.list.table.asset")}</Table.Head
                                        >
                                        <Table.Head
                                            class="h-8 text-[9px] font-black uppercase text-muted-foreground"
                                            >{$t("trades.list.table.direction")}</Table.Head
                                        >
                                        <Table.Head
                                            class="h-8 text-[9px] font-black uppercase text-muted-foreground"
                                            >{$t("trades.list.table.entry")}</Table.Head
                                        >
                                        <Table.Head
                                            class="h-8 text-[9px] font-black uppercase text-muted-foreground"
                                            >{$t("trades.list.table.exit")}</Table.Head
                                        >
                                        <Table.Head
                                            class="h-8 text-[9px] font-black uppercase text-muted-foreground text-right"
                                            >{$t("trades.list.table.pl")}</Table.Head
                                        >
                                        <Table.Head
                                            class="h-8 text-[9px] font-black uppercase text-muted-foreground text-right"
                                            >{$t("trades.list.table.actions")}</Table.Head
                                        >
                                    </Table.Row>
                                </Table.Header>
                                <tbody use:keyboardList class="[&_tr:last-child]:border-0">
                                    {#each day.trades as trade (trade.id)}
                                        <Table.Row
                                            class="group/row hover:bg-primary/10 border-border/10 cursor-pointer"
                                            onclick={() =>
                                                handleSelectTrade(trade)}
                                            role="button"
                                            tabindex={0}
                                            onkeydown={(e) => { if (e.key === 'Enter') handleView(trade); }}
                                        >
                                            <Table.Cell class="py-2">
                                                <div class="flex flex-col">
                                                    <span
                                                        class="font-bold text-[10px]"
                                                        >{trade.asset_symbol}</span
                                                    >
                                                    <span
                                                        class="text-[8px] text-muted-foreground uppercase tracking-tighter"
                                                    >
                                                        {workspaceStore.strategies.find(
                                                            (s) =>
                                                                s.id ===
                                                                trade.strategy_id,
                                                        )?.name || "-"}
                                                    </span>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell class="py-2">
                                                <div class="flex flex-col gap-1 items-start">
                                                    <Badge
                                                        variant="secondary"
                                                        class="text-[9px] font-black uppercase h-5 {trade.exit_price ||
                                                        trade.exit_date
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-amber-500/10 text-amber-500'}"
                                                    >
                                                        {trade.exit_price ||
                                                        trade.exit_date
                                                            ? $t("trades.list.table.status_closed")
                                                            : $t("trades.list.table.status_open")}
                                                    </Badge>
                                                     <Badge
                                                        variant="outline"
                                                        class="text-[8px] font-black px-1.5 h-4 border-none {trade.direction ===
                                                        'Buy'
                                                            ? 'bg-blue-500/10 text-blue-500'
                                                            : 'bg-orange-500/10 text-orange-500'}"
                                                    >
                                                        {trade.direction ===
                                                        "Buy"
                                                            ? $t("trades.list.table.buy")
                                                            : $t("trades.list.table.sell")}
                                                    </Badge>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell class="py-2">
                                                <div class="flex flex-col">
                                                    <span
                                                        class="text-[10px] font-mono font-bold tabular-nums"
                                                        >{trade.entry_price}</span
                                                    >
                                                    <span
                                                        class="text-[8px] text-muted-foreground/60"
                                                        >{format(
                                                            new Date(
                                                                trade.date,
                                                            ),
                                                            "HH:mm",
                                                        )}</span
                                                    >
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell class="py-2">
                                                <div class="flex flex-col">
                                                    <span
                                                        class="text-[10px] font-mono font-bold tabular-nums"
                                                        >{trade.exit_price ||
                                                            "-"}</span
                                                    >
                                                    <span
                                                        class="text-[8px] text-muted-foreground/60"
                                                        >{trade.exit_date
                                                            ? format(
                                                                  new Date(
                                                                      trade.exit_date,
                                                                  ),
                                                                  "HH:mm",
                                                              )
                                                            : "-"}</span
                                                    >
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell class="py-2 text-right">
                                                <span
                                                    class="text-[10px] font-mono font-bold {trade.result >=
                                                    0
                                                        ? 'text-emerald-500'
                                                        : 'text-rose-500'}"
                                                >
                                                    {formatCurrency(
                                                        trade.result,
                                                        accountsStore.accounts.find(
                                                            (a) =>
                                                                a.id ===
                                                                trade.account_id,
                                                        )?.currency || "BRL",
                                                    )}
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell class="py-2 text-right">
                                                <div
                                                    class="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        class="h-6 w-6"
                                                        onclick={() =>
                                                            handleView(trade)}
                                                    >
                                                        <Eye class="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        class="h-6 w-6"
                                                        onclick={() =>
                                                            handleEdit(trade)}
                                                    >
                                                        <Pencil
                                                            class="h-3 w-3"
                                                        />
                                                    </Button>
                                                    <button
                                                        class="p-1 px-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
                                                        title={$t("trades.list.table.actions_delete")}
                                                        onclick={(e) => {
                                                            e.stopPropagation();
                                                            requestDelete(
                                                                trade,
                                                            );
                                                        }}
                                                    >
                                                        <Trash2
                                                            class="h-3 w-3"
                                                        />
                                                    </button>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    {/each}
                                </tbody>
                            </Table.Root>
                        {/snippet}
                    </HierarchicalList>
                {/if}
            </div>

        </div> <!-- Closes w-full -->

        </div> <!-- End of Left Side (Main Trades Content) -->

        <!-- Right Side (Sidebar: QuickLog + Charts) -->
        <div class="w-full xl:w-[350px] shrink-0 space-y-6 z-[50] relative self-start sticky top-4">
            <!-- Registro Quick -->
            <QuickLog layout="vertical" />
            
            <!-- Interactive Metrics & Charts -->
            <div class="space-y-4">
                <div class="flex items-center justify-between px-2 h-9">
                    <h3
                        class="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2"
                    >
                        <BarChart2 class="w-4 h-4" />
                        {$t("trades.kpi.summary").toUpperCase()}
                    </h3>
                    <div class="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            class="text-[10px] font-black bg-muted border-border/40 uppercase tracking-tighter"
                        >
                            {activeContext.label}
                        </Badge>
                        {#if activeContext.type !== "global"}
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-6 w-6 text-muted-foreground hover:text-rose-500 transition-colors"
                                onclick={() =>
                                    (activeContext = {
                                        type: "global",
                                        key: null,
                                        label: $t("common.period.allTime"),
                                    })}
                            >
                                <X class="w-3 h-3" />
                            </Button>
                        {/if}
                    </div>
                </div>

                {#if activeContext.type === "trade" && activeContext.data}
                    <!-- Card: Trade Essential Info (Visible only when trade selected) -->
                    <Card.Root class="card-glass shadow-sm overflow-hidden">
                        <Card.Header class="pb-2">
                            <div class="flex items-center justify-between">
                                <Badge
                                    variant="secondary"
                                    class="bg-primary/10 text-primary border-none font-black"
                                >
                                    {activeContext.data.asset_symbol}
                                </Badge>
                                <span
                                    class="text-[10px] font-bold text-muted-foreground uppercase opacity-50"
                                >
                                    {format(
                                        new Date(activeContext.data.date),
                                        "dd MMMM yyyy HH:mm",
                                        {
                                            locale:
                                                $locale === "en-US"
                                                    ? undefined
                                                    : undefined,
                                        },
                                    )}
                                </span>
                            </div>
                        </Card.Header>
                        <Card.Content class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <span
                                    class="text-[9px] font-bold text-muted-foreground uppercase"
                                    >{$t("trades.kpi.result")}</span
                                >
                                <div
                                    class="text-xl font-black {activeContext
                                        .data.result >= 0
                                        ? 'text-emerald-500'
                                        : 'text-rose-500'}"
                                >
                                    {formatCurrency(
                                        activeContext.data.result,
                                        accountsStore.accounts.find(
                                            (a) =>
                                                a.id ===
                                                activeContext.data.account_id,
                                        )?.currency || "BRL",
                                    )}
                                </div>
                            </div>
                            <div class="space-y-1 text-right">
                                <span
                                    class="text-[9px] font-bold text-muted-foreground uppercase"
                                    >{$t("trades.kpi.type")}</span
                                >
                                <div
                                    class="text-xs font-bold uppercase tracking-widest"
                                >
                                    {activeContext.data.type || "N/A"}
                                </div>
                            </div>
                        </Card.Content>
                    </Card.Root>
                {/if}

                <div
                    class="grid grid-cols-1 gap-4"
                >
                    <!-- Card: KPIs Dashboard -->
                    <Card.Root class="card-glass flex flex-col justify-between">
                        <Card.Header
                            class="p-4 pb-2 border-b border-border/10 flex flex-row items-center justify-between space-y-0"
                        >
                            <span
                                class="text-[10px] font-black uppercase tracking-tighter text-muted-foreground"
                                >{$t("trades.kpi.performance")}</span
                            >
                            <TrendingUp
                                class="w-3 h-3 text-emerald-500 opacity-50"
                            />
                        </Card.Header>
                        <Card.Content class="p-4 pt-4">
                            <div class="space-y-6">
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-0.5">
                                        <span
                                            class="text-[8px] font-black text-muted-foreground uppercase opacity-50"
                                            >{$t("trades.kpi.profit_factor")}</span
                                        >
                                        <div
                                            class="text-sm font-mono font-bold tracking-tighter text-teal-400"
                                        >
                                            {activeContextStats.profitFactor}
                                        </div>
                                    </div>
                                    <div class="space-y-0.5 text-right">
                                        <span
                                            class="text-[8px] font-black text-rose-500/60 uppercase opacity-80"
                                            >{$t("trades.kpi.drawdown")}</span
                                        >
                                        <div
                                            class="text-[10px] font-mono font-bold text-rose-500 tracking-tighter"
                                        >
                                            {formatCurrency(
                                                activeContextStats.maxDrawdown,
                                                activeContextStats.mainCurrency,
                                                $locale || "pt-BR",
                                            ).replace(/[^\d.,+-]/g, "")}
                                        </div>
                                    </div>
                                </div>

                                <Separator class="bg-border/10" />

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-0.5">
                                        <span
                                            class="text-[8px] font-black text-muted-foreground/40 uppercase opacity-50"
                                            >{$t("trades.kpi.win_rate")}</span
                                        >
                                        <div
                                            class="text-[10px] font-mono font-bold tracking-tighter"
                                        >
                                            {activeContextStats.winRate}%
                                        </div>
                                    </div>
                                    <div class="space-y-0.5 text-right">
                                        <span
                                            class="text-[8px] font-black text-muted-foreground/40 uppercase opacity-50"
                                            >{$t("trades.kpi.risk_reward")}</span
                                        >
                                        <div
                                            class="text-[10px] font-mono font-bold tracking-tighter {parseFloat(
                                                activeContextStats.riskReward,
                                            ) >= 1
                                                ? 'text-emerald-500'
                                                : ''}"
                                        >
                                            1:{activeContextStats.riskReward}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card.Content>
                    </Card.Root>

                    <!-- Card: Outcome/Pie Chart -->
                    <Card.Root class="card-glass shadow-sm overflow-hidden">
                        <Card.Header
                            class="p-4 pb-0 border-b border-border/10 flex flex-row items-center justify-between space-y-0 bg-muted/5"
                        >
                            <span
                                class="text-[10px] font-black uppercase tracking-tighter text-muted-foreground"
                                >{$t("trades.kpi.distribution")}</span
                            >
                            <div
                                class="text-[9px] font-mono font-bold opacity-30 uppercase"
                            >
                                {activeContextStats.total} {$t("trades.kpi.trades_label")}
                            </div>
                        </Card.Header>
                        <Card.Content class="p-2 pb-0">
                            <div class="h-[220px] w-full">
                                <TradeOutcomePieChart
                                    trades={filteredTradesForChart}
                                />
                            </div>
                        </Card.Content>
                    </Card.Root>
                </div>

                <!-- Card: Equity Curve with Drawdown -->
                <Card.Root class="card-glass">
                    <Card.Header
                        class="p-4 py-3 border-b border-border/10 flex flex-row items-center justify-between space-y-0"
                    >
                        <span
                            class="text-[10px] font-black uppercase tracking-tighter text-muted-foreground"
                            >{$t("trades.kpi.equityCurve")}</span
                        >
                    </Card.Header>
                    <Card.Content class="p-2">
                        <div class="h-[260px] w-full">
                            <TradeEquityChart trades={filteredTradesForChart} />
                        </div>
                    </Card.Content>
                </Card.Root>
            </div>
        </div>
    </div>
</div>

<DeleteConfirmationModal
    bind:open={isDeleteOpen}
    onConfirm={confirmDelete}
    onCancel={() => (isDeleteOpen = false)}
    title={$t("trades.delete.title")}
    description={deleteModalDescription}
/>

<!-- View Modal -->
<Dialog.Root bind:open={isViewOpen}>
    <Dialog.Content
        class="max-w-4xl glass border-white/10 text-white overflow-hidden p-0"
    >
        <Dialog.Header class="p-6 pb-2 text-white">
            <Dialog.Title>{$t("trades.details.title")}</Dialog.Title>
        </Dialog.Header>
        {#if selectedTrade}
            <div class="px-6 pb-6 mt-2">
                <TradeDetailView trade={selectedTrade} />
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>

<!-- Quick Edit Modal -->
<QuickEditTrade 
    bind:open={isQuickEditOpen} 
    trade={selectedTrade} 
    onsave={() => { tradesStore.loadTrades(); financialConfigStore.loadCashTransactions(); }}
    onadvanced={handleAdvancedEdit}
/>

<!-- Wizard Modal (New/Edit) -->
<Dialog.Root bind:open={isEditOpen}>
    <Dialog.Content
        class="max-w-3xl max-h-[85vh] overflow-hidden p-0 flex flex-col border-0 bg-transparent shadow-none"
    >
        {#key selectedTrade?.id}
            <NewTradeWizard
                trade={selectedTrade}
                editTradeId={selectedTrade?.id}
                close={() => (isEditOpen = false)}
                onsave={() => {
                    isEditOpen = false;
                    setTimeout(() => {
                        selectedTrade = null;
                        tradesStore.loadTrades();
                        financialConfigStore.loadCashTransactions();
                    }, 100);
                }}
            />
        {/key}
    </Dialog.Content>
</Dialog.Root>

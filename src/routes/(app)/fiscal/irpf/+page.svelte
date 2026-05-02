<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { toast } from "svelte-sonner";
    import { _ as t } from "svelte-i18n";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Dialog from "$lib/components/ui/dialog";
    import {
        Calendar,
        DollarSign,
        FileText,
        TrendingDown,
        TrendingUp,
        Eye,
        Trash2,
        AlertTriangle,
        RefreshCw,
        ArrowRight,
        ChevronLeft,
        ChevronRight,
        CheckCircle2,
        AlertCircle,
        Search,
        Filter,
        ChevronDown,
        ChevronUp,
        Coins,
        Wallet,
    } from "lucide-svelte";
    import { irpfStore } from "$lib/stores/irpfStore.svelte";
    import TaxEvolutionChart from "$lib/components/dashboard/TaxEvolutionChart.svelte";
    import * as Select from "$lib/components/ui/select";
    import * as Tabs from "$lib/components/ui/tabs";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import DarfDetailsDialog from "$lib/components/finance/DarfDetailsDialog.svelte";
    import HierarchicalList from "$lib/components/shared/HierarchicalList.svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { SystemCard, SystemHeader, SystemMetric } from "$lib/components/ui/system";

    // View Modal State
    let isViewModalOpen = $state(false);
    let selectedAppraisal = $state<any>(null);

    // Delete Modal State
    let isDeleteModalOpen = $state(false);
    let appraisalToDelete = $state<any>(null);

    let isAppraisalModalOpen = $state(false);
    let appraisalMonth = $state(String(new Date().getMonth() + 1));
    let appraisalYear = $state(irpfStore.selectedYear);
    let appraisalResults = $state<any[]>([]);

    let currentMonth = new Date().getMonth() + 1;
    let selectedMonth = $state<number | null>(null); // null = "Todos"
    let statusFilter = $state<"all" | "pending">("all");
    let searchText = $state("");

    // Define months *before* using in derived stores
    const months = [
        { val: 1, key: "common.months.january" },
        { val: 2, key: "common.months.february" },
        { val: 3, key: "common.months.march" },
        { val: 4, key: "common.months.april" },
        { val: 5, key: "common.months.may" },
        { val: 6, key: "common.months.june" },
        { val: 7, key: "common.months.july" },
        { val: 8, key: "common.months.august" },
        { val: 9, key: "common.months.september" },
        { val: 10, key: "common.months.october" },
        { val: 11, key: "common.months.november" },
        { val: 12, key: "common.months.december" },
    ];

    let taxEvolutionData = $derived.by(() => {
        const result = [];
        const currentYear = Number(irpfStore.selectedYear);
        const apps = irpfStore.appraisals || [];
        const darfs = irpfStore.darfs || [];

        for (let i = 1; i <= 12; i++) {
            // Find appraisals for this month and year
            const monthApps = apps.filter(
                (a) =>
                    Number(a.period_month) === i &&
                    Number(a.period_year) === currentYear,
            );

            // Find paid darfs for this month and year
            const monthPaid = darfs.filter((d) => {
                const parts = (d.period || "").split("/");
                if (parts.length < 2) return false;
                const m = Number(parts[0]);
                const y = Number(parts[1]);
                return m === i && y === currentYear && d.status === "Paid";
            });

            const taxDueValue = monthApps.reduce((acc, a) => {
                const val = Number(a.total_payable || 0);
                return acc + (isNaN(val) ? 0 : val);
            }, 0);

            const taxPaidValue = monthPaid.reduce((acc, d) => {
                const val = Number(d.total_value || 0);
                return acc + (isNaN(val) ? 0 : val);
            }, 0);

            const activeMonth = months.find((m) => m.val === i);
            result.push({
                month: activeMonth ? $t(activeMonth.key) : "Mês Inválido",
                taxDue: taxDueValue,
                taxPaid: taxPaidValue,
            });
        }
        return result;
    });

    // Filter appraisals by selected month and hide paid ones
    let filteredAppraisals = $derived.by(() => {
        let list = irpfStore.appraisals.filter(
            (a) => Number(a.period_year) === Number(irpfStore.selectedYear),
        );

        // Apply Month Filter + Carry-over Pending
        if (selectedMonth !== null) {
            list = list.filter(a => 
                Number(a.period_month) === selectedMonth || 
                (a.status === 'Pending' && a.total_payable > 0)
            );
        }

        // Apply Status Filter
        if (statusFilter === "pending") {
            list = list.filter(a => a.status === 'Pending');
        }

        // Apply Search
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            list = list.filter(a => 
                (a.trade_type || "").toLowerCase().includes(q) ||
                (a.revenue_code || "").toLowerCase().includes(q)
            );
        }

        return list;
    });

    let hierarchicalAppraisals = $derived.by(() => {
        const dataByMonth: Record<number, any> = {};

        filteredAppraisals.forEach((item) => {
            if (!dataByMonth[item.period_month]) {
                const monthName = $t(
                    months.find((m) => m.val === Number(item.period_month))
                        ?.key || "general.error",
                );
                dataByMonth[item.period_month] = {
                    key: `month-${item.period_month}-${item.period_year}`,
                    label: `${monthName} / ${item.period_year}`,
                    days: [], // flatMode reads 'days' array directly
                    originalItems: [],
                };
            }

            const existingDarf = irpfStore.darfs.find(
                (d) =>
                    irpfStore.getId(d.appraisal_id) ===
                    irpfStore.getId(item.id),
            );
            dataByMonth[item.period_month].originalItems.push(item);
            dataByMonth[item.period_month].days.push({
                key: `appraisal-${item.id}`,
                date: "",
                label:
                    item.trade_type === "DayTrade"
                        ? "Day Trade"
                        : "Swing Trade",
                originalItem: item,
                existingDarf: existingDarf, // Otimizado: lookup feito apenas uma vez na derivação
            });
        });

        return Object.values(dataByMonth).sort((a: any, b: any) => {
            const m1 = parseInt(a.key.split("-")[1]);
            const m2 = parseInt(b.key.split("-")[1]);
            return m2 - m1;
        });
    });

    onMount(() => {
        irpfStore.loadAllData();
    });

    function deleteAppraisal(item: any) {
        appraisalToDelete = item;
        isDeleteModalOpen = true;
    }

    async function confirmDelete() {
        if (!appraisalToDelete) return;
        const idStr = irpfStore.getId(appraisalToDelete.id);
        await irpfStore.deleteAppraisal(idStr);
        isDeleteModalOpen = false;
    }

    async function generateDarf(item: any) {
        let idStr = irpfStore.getId(item.id);

        // Block if not saved
        if (!idStr) {
            toast.error($t("fiscal.irpf.saveBeforeDarf"));
            return;
        }

        try {
            await irpfStore.generateDarf(idStr);
            item.darfGenerated = true;
        } catch (error) {
            // Error handled in store
        }
    }

    function openViewModal(item: any) {
        // If there's an existing DARF, we show the DARF details
        // Otherwise we show the appraisal details (standardizing on DarfDetailsDialog)
        selectedAppraisal = item;
        isViewModalOpen = true;
    }

    import { cn, parseSafeDate, formatCurrency } from "$lib/utils";

    async function calculateAppraisal() {
        try {
            appraisalResults = await irpfStore.calculateMonthlyTax(
                Number(appraisalMonth),
                Number(appraisalYear),
            );
        } catch (error) {
            // Handled in store
        }
    }

    async function saveAppraisalResult(item: any) {
        const saved = await irpfStore.saveAppraisal(item);
        // Update item.id so "Gerar DARF" button appears immediately
        if (saved?.id) {
            item.id = saved.id;
            // Removed: isAppraisalModalOpen = false;
            irpfStore.loadAllData(); // Refresh history
        }
    }

    function loadData() {
        irpfStore.loadAllData();
    }

    function getTotalLoss(type: string) {
        return irpfStore.losses
            .filter((l) => l.trade_type === type)
            .reduce((acc, curr) => acc + curr.balance, 0);
    }

    async function deleteLoss(id: any) {
        const idStr = irpfStore.getId(id);
        await irpfStore.deleteLoss(idStr);
    }

    let expandedMonths = $state(new Set<string>());

    $effect(() => {
        if (hierarchicalAppraisals.length > 0) {
            untrack(() => {
                const today = new Date();
                const currentMonth = today.getMonth() + 1;
                const currentYear = today.getFullYear();
                const currentMonthKey = `month-${currentMonth}-${currentYear}`;

                if (expandedMonths.size === 0) {
                    if (hierarchicalAppraisals.some(m => m.key === currentMonthKey)) {
                        expandedMonths.add(currentMonthKey);
                    } else {
                        // Fallback to latest month
                        expandedMonths.add(hierarchicalAppraisals[0].key);
                    }
                    expandedMonths = new Set(expandedMonths);
                }
            });
        }
    });
</script>

<div
    class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20"
>
    <!-- Header & Actions -->
    {#snippet actions()}
        <div class="flex items-center gap-3">
            <!-- Global Year Filter -->
            <div class="flex items-center gap-2 px-3 py-1 bg-muted/10 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full">
                <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{$t("common.year")}</span>
                <Select.Root
                    type="single"
                    value={irpfStore.selectedYear.toString()}
                    onValueChange={(v) => {
                        if (v) {
                            irpfStore.loadAllData(parseInt(v));
                        }
                    }}
                >
                    <Select.Trigger
                        class="h-6 min-w-[80px] border-none bg-transparent hover:bg-transparent shadow-none p-0 text-[11px] font-black tracking-widest focus:ring-0"
                    >
                        <span class="truncate uppercase">{irpfStore.selectedYear}</span>
                    </Select.Trigger>
                    <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                        {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i) as y}
                            <Select.Item value={y.toString()} class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">
                                {y}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <div class="h-6 w-[1px] bg-border/20 mx-1"></div>

            <Button
                variant="outline"
                href="/fiscal/irpf/darf"
                class="bg-background/40 hover:bg-background/60 border border-border/40 text-[9px] font-black h-8 uppercase tracking-widest px-3 rounded-full"
            >
                <FileText class="w-3.5 h-3.5 mr-2" />
                {$t("fiscal.irpf.manageDarfs")}
            </Button>

            <Button
                onclick={() => (isAppraisalModalOpen = true)}
                class="neon-glow bg-primary text-primary-foreground text-[10px] font-black h-8 uppercase tracking-widest px-4 shadow-lg shadow-primary/20 rounded-full"
            >
                <Calendar class="w-3.5 h-3.5 mr-2" />
                {$t("fiscal.irpf.newAppraisal")}
            </Button>
        </div>
    {/snippet}

    <SystemCard status="primary" class="p-3 mb-6 bg-primary/5">
        <SystemHeader 
            title={$t("fiscal.irpf.title")}
            subtitle={$t("fiscal.irpf.description")}
            icon={FileText}
            variant="page"
            class="mb-0"
            {actions}
        />
    </SystemCard>

    <!-- KPI Cards (Standardized) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Devido -->
        <SystemCard status="danger" class="p-4 overflow-hidden relative group">
            <div class="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12"><DollarSign class="w-20 h-20"/></div>
            <SystemMetric 
                label={$t("fiscal.irpf.kpis.totalDue") + " (" + irpfStore.selectedYear + ")"}
                value={formatCurrency(irpfStore.totalDue)}
                status="danger"
                subvalue={$t("fiscal.irpf.kpis.dueYearHint")}
                weight="black"
            />
        </SystemCard>

        <!-- Total Pago -->
        <SystemCard status="success" class="p-4 overflow-hidden relative group">
            <div class="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12"><CheckCircle2 class="w-20 h-20"/></div>
            <SystemMetric 
                label={$t("fiscal.irpf.kpis.totalPaid") + " (" + irpfStore.selectedYear + ")"}
                value={formatCurrency(irpfStore.totalPaid)}
                status="success"
                subvalue={$t("fiscal.irpf.kpis.paidYearHint")}
                weight="black"
            />
        </SystemCard>

        <!-- Card 3: Pendente Atual -->
        <SystemCard status="warning" class="p-4 overflow-hidden relative group">
            <div class="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12"><AlertTriangle class="w-20 h-20"/></div>
            <SystemMetric 
                label={$t("fiscal.irpf.kpis.pending")}
                value={formatCurrency(irpfStore.pendingAmount)}
                status="warning"
                weight="black"
            >
                {#snippet subvalue()}
                    <div class="flex justify-between items-center mt-1">
                        <p class="text-[9px] text-muted-foreground opacity-60 font-black uppercase tracking-widest">
                            {$t("fiscal.irpf.kpis.pendingHint", {
                                count: irpfStore.pendingGuiasCount,
                            })}
                        </p>
                        <Button
                            variant="link"
                            href="/fiscal/irpf/darf"
                            class="h-auto p-0 text-[10px] text-amber-500/80 hover:text-amber-500 hover:no-underline font-black uppercase tracking-widest"
                        >
                            Verificar &rarr;
                        </Button>
                    </div>
                {/snippet}
            </SystemMetric>
        </SystemCard>

        <!-- Card 4: Prejuízos Acumulados -->
        <SystemCard class="p-4 overflow-hidden relative group border-l-4 border-l-blue-500">
            <div class="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12"><TrendingDown class="w-20 h-20 text-blue-500"/></div>
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2">
                    <TrendingDown class="w-3.5 h-3.5 text-blue-500" />
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{$t("fiscal.irpf.kpis.losses")}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <SystemMetric 
                        label="Day Trade" 
                        value={formatCurrency(getTotalLoss("DayTrade"))} 
                        variant="compact" 
                        status="danger"
                        weight="bold"
                    />
                    <SystemMetric 
                        label="Swing Trade" 
                        value={formatCurrency(getTotalLoss("SwingTrade"))} 
                        variant="compact" 
                        status="danger"
                        weight="bold"
                        class="text-right items-end"
                    />
                </div>
            </div>
        </SystemCard>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card.Root class="lg:col-span-3 card-glass overflow-hidden">
            <Card.Header class="pb-2">
                <div class="flex items-center justify-between">
                    <div>
                        <Card.Title class="text-sm font-black uppercase tracking-widest text-foreground/80">
                            {$t("fiscal.irpf.evolution")}
                        </Card.Title>
                        <p class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5 opacity-60">
                            Histórico anual de imposto devido vs pago
                        </p>
                    </div>
                    <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span class="text-muted-foreground">Devido</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span class="text-muted-foreground">Pago</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onclick={loadData}
                            class="h-8 w-8 rounded-full hover:bg-primary/5 ml-2"
                        >
                            <RefreshCw class="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </Card.Header>
            <Card.Content class="h-[320px] pt-4">
                {#key irpfStore.selectedYear}
                    <TaxEvolutionChart data={taxEvolutionData} />
                {#key irpfStore.selectedYear}
                <div
                    class="mt-4 pt-4 border-t border-border/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex justify-between px-2"
                >
                    <span>
                        TOTAL APURADO: {irpfStore.appraisals.filter(
                            (a) =>
                                Number(a.period_year) == irpfStore.selectedYear,
                        ).length} MESES / {irpfStore.darfs.filter((d) =>
                            d.period.includes(
                                irpfStore.selectedYear.toString(),
                            ),
                        ).length} DARFS GERADAS
                    </span>
                    <span class="text-foreground/60">
                        VALOR TOTAL: {formatCurrency(
                            Number(
                                taxEvolutionData.reduce(
                                    (acc, curr) => acc + curr.taxDue,
                                    0,
                                ),
                            ),
                        )}
                    </span>
                </div>
                {/key}
                {/key}
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Appraisals List -->
    <Card.Root class="card-glass">
        <Card.Header class="pb-4">
            <Card.Title class="text-sm font-black uppercase tracking-widest text-foreground/80">{$t("fiscal.irpf.history")}</Card.Title>
        </Card.Header>
        <Card.Content>
            <!-- Month Filter Tabs -->
            <div class="mb-8">
                <Tabs.Root
                    value={selectedMonth === null
                        ? "all"
                        : selectedMonth.toString()}
                    onValueChange={(v) => {
                        selectedMonth = v === "all" ? null : parseInt(v);
                    }}
                >
                    <Tabs.List
                        class="flex flex-wrap items-center gap-1 bg-muted/10 dark:bg-white/[0.03] p-1 rounded-full h-auto border border-black/5 dark:border-white/5"
                    >
                        <Tabs.Trigger 
                            value="all" 
                            class="text-[9px] font-black uppercase tracking-widest rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 py-1.5 px-4"
                        >
                            {$t("common.all")}
                        </Tabs.Trigger>
                        {#each months as m}
                            <Tabs.Trigger 
                                value={m.val.toString()} 
                                class="text-[9px] font-black uppercase tracking-widest rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 py-1.5 px-3 min-w-[45px]"
                            >
                                {$t(m.key).substring(0, 3)}
                            </Tabs.Trigger>
                        {/each}
                    </Tabs.List>
                </Tabs.Root>
            </div>

            <!-- Search and Status Filters -->
            <div class="flex flex-wrap items-end gap-4 mb-8">
                <!-- Search -->
                <div class="flex flex-col gap-1.5 min-w-[320px] flex-1 lg:flex-none">
                    <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("common.search")}</span>
                    <div class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full flex items-center focus-within:border-primary/40 transition-all shadow-inner">
                        <Search class="h-3.5 w-3.5 text-muted-foreground/50 mr-2 shrink-0" />
                        <input 
                            type="text" 
                            bind:value={searchText} 
                            placeholder="Buscar por tipo ou código..."
                            class="bg-transparent border-none p-0 text-[10px] font-bold w-full outline-none text-foreground placeholder:text-muted-foreground/30" 
                        />
                    </div>
                </div>

                <div class="flex-1"></div>

                <!-- Status Filter -->
                <div class="flex flex-col gap-1.5 min-w-[180px]">
                    <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("fiscal.irpf.table.status")}</span>
                    <Select.Root type="single" bind:value={statusFilter}>
                        <Select.Trigger class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-2 w-full text-foreground/80 ring-0 focus:ring-0">
                            <div class="flex items-center gap-2 truncate min-w-0">
                                <Filter class="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                <span class="truncate uppercase tracking-widest">
                                    {statusFilter === 'all' ? 'Todas' : 'Somente Pendentes'}
                                </span>
                            </div>
                            <ChevronDown class="w-3 h-3 text-muted-foreground/40 shrink-0 ml-1" />
                        </Select.Trigger>
                        <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                            <Select.Item value="all" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">Todas</Select.Item>
                            <Select.Item value="pending" class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">Somente Pendentes</Select.Item>
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>
            {#if irpfStore.loading}
                <div class="p-8 text-center text-muted-foreground">
                    {$t("common.loading")}
                </div>
            {:else if filteredAppraisals.length === 0}
                <div class="p-12 text-center flex flex-col items-center gap-3">
                    <div
                        class="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center"
                    >
                        <FileText class="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p class="text-muted-foreground">
                        {selectedMonth === null
                            ? $t("fiscal.darf.messages.emptyHistory", {
                                  year: irpfStore.selectedYear,
                              }).replace("DARF", "")
                            : `${$t("common.empty")} ${$t(months.find((m) => m.val === selectedMonth)?.key || "")}/${irpfStore.selectedYear}.`}
                    </p>
                    <Button
                        variant="outline"
                        onclick={() => (isAppraisalModalOpen = true)}
                        class="mt-2"
                    >
                        {$t("fiscal.irpf.newAppraisal")}
                    </Button>
                </div>
            {:else}
                <HierarchicalList
                    data={hierarchicalAppraisals}
                    flatMode={true}
                    omitDays={true}
                    bind:expandedMonths
                    mutualExclusion={true}
                >
                    {#snippet monthBadges(month: any)}
                        {@const totalPayable = month.originalItems.reduce(
                            (acc: number, curr: any) =>
                                acc + curr.total_payable,
                            0,
                        )}
                        {@const totalProfit = month.originalItems.reduce(
                            (acc: number, curr: any) => acc + curr.net_profit,
                            0,
                        )}

                        <Badge
                            variant="outline"
                            class="text-[9px] px-1.5 h-4 bg-muted border-border font-bold uppercase"
                        >
                            {month.days.length}
                            {$t("common.records", { default: "REGISTROS" })}
                        </Badge>

                        <div class="flex gap-3 ml-2">
                            <div class="flex flex-col items-end">
                                <span
                                    class="text-[9px] font-bold text-muted-foreground uppercase opacity-70"
                                >
                                    {$t("fiscal.irpf.table.netProfit")}
                                </span>
                                <span
                                    class="text-[10px] font-mono font-bold {totalProfit >=
                                    0
                                        ? 'text-emerald-500'
                                        : 'text-rose-500'}"
                                >
                                    {formatCurrency(totalProfit)}
                                </span>
                            </div>

                            <div class="flex flex-col items-end hidden sm:flex">
                                <span
                                    class="text-[9px] font-bold text-muted-foreground uppercase opacity-70"
                                >
                                    {$t("fiscal.irpf.kpis.totalDue")}
                                </span>
                                <span
                                    class="text-[10px] font-mono font-bold text-foreground"
                                >
                                    {formatCurrency(totalPayable)}
                                </span>
                            </div>
                        </div>
                    {/snippet}

                    {#snippet monthContent(month: any)}
                        <div class="space-y-2">
                            <div class="hidden md:flex items-center justify-between p-3 border-b border-border/10 bg-muted/5 rounded-t-lg">
                                <div class="flex items-center gap-3 w-32">
                                    <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{$t("fiscal.irpf.table.operation")}</span>
                                </div>
                                <div class="flex items-center gap-8 pr-4">
                                    <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest w-24 text-right">{$t("fiscal.irpf.table.netProfit")}</span>
                                    <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest w-24 text-right">{$t("fiscal.irpf.table.toPay")}</span>
                                    <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest w-24 text-right">{$t("fiscal.irpf.table.compensated")}</span>
                                    <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest w-24 text-center">{$t("fiscal.irpf.table.status")}</span>
                                    <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest w-24 text-right">{$t("fiscal.irpf.table.actions")}</span>
                                </div>
                            </div>
                            {#each month.originalItems as item}
                                {@const revenueCode =
                                    item.trade_type === "DayTrade"
                                        ? "6015"
                                        : "6015"}
                                {@const period = `${String(item.period_month).padStart(2, "0")}/${item.period_year}`}
                                {@const existingDarf = irpfStore.darfs.find(
                                    (d) =>
                                        irpfStore.getId(d.appraisal_id) ===
                                        irpfStore.getId(item.id),
                                )}

                                <div
                                    class="flex flex-col md:flex-row items-start md:items-center justify-between p-3 gap-4 w-full group hover:bg-muted/10 transition-colors"
                                >
                                    <div class="flex items-center gap-3">
                                        <span
                                            class="px-2 py-1 rounded text-xs font-bold {item.trade_type ===
                                            'DayTrade'
                                                ? 'bg-blue-500/10 text-blue-500'
                                                : 'bg-indigo-500/10 text-indigo-500'}"
                                        >
                                            {item.trade_type === "DayTrade"
                                                ? "Day Trade"
                                                : "Swing Trade"}
                                        </span>
                                        {#if item.is_complementary}
                                            <span
                                                class="text-[9px] font-bold text-amber-500 uppercase tracking-tighter"
                                            >
                                                {$t(
                                                    "fiscal.irpf.complementary",
                                                )}
                                            </span>
                                        {/if}
                                    </div>

                                    <div
                                        class="flex items-center gap-8 pr-4"
                                    >
                                        <div class="flex flex-col items-end w-24">
                                            <span
                                                class="text-[9px] text-muted-foreground uppercase font-bold"
                                                >{$t("fiscal.irpf.table.shortNet")}</span
                                            >
                                            <span
                                                class="font-mono text-sm leading-none font-bold {item.net_profit >=
                                                0
                                                    ? 'text-green-400'
                                                    : 'text-red-400'}"
                                            >
                                                {formatCurrency(
                                                    item.net_profit,
                                                )}
                                            </span>
                                        </div>
                                        <div class="flex flex-col items-end w-24">
                                            <span
                                                class="text-[9px] text-muted-foreground uppercase font-bold"
                                                title={item.tax_accumulated > 0
                                                    ? `Corrente: ${formatCurrency(item.tax_payable)} | Acum.: ${formatCurrency(item.tax_accumulated)}`
                                                    : ""}
                                            >
                                                {$t("fiscal.irpf.table.toPay")}
                                            </span>
                                            <span
                                                class="font-mono text-sm leading-none font-bold text-foreground"
                                            >
                                                {formatCurrency(
                                                    item.total_payable,
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            class="flex flex-col items-end hidden md:flex w-24"
                                        >
                                            <span
                                                class="text-[9px] text-muted-foreground uppercase font-bold"
                                                >{$t(
                                                    "fiscal.irpf.table.compensated",
                                                )}</span
                                            >
                                            <span
                                                class="font-mono text-sm leading-none font-bold text-yellow-500/80"
                                            >
                                                {item.compensated_loss > 0
                                                    ? `-${formatCurrency(item.compensated_loss)}`
                                                    : "-"}
                                            </span>
                                        </div>

                                        <div class="w-24 text-center">
                                                {#if item.status === "Paid"}
                                                    <span
                                                        class="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase"
                                                    >
                                                        {$t(
                                                            "fiscal.irpf.table.paid",
                                                        )}
                                                    </span>
                                                {:else if item.status === "Pending"}
                                                    <span
                                                        class="px-2 py-1 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase"
                                                    >
                                                        {$t(
                                                            "fiscal.irpf.table.pending",
                                                        )}
                                                    </span>
                                                {:else}
                                                    <span
                                                        class="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase"
                                                    >
                                                        {$t(
                                                            "fiscal.irpf.table.ok",
                                                        )}
                                                    </span>
                                                {/if}
                                        </div>
                                        <div
                                            class="w-24 flex items-center justify-end gap-1"
                                        >
                                                {#if item.status !== "Paid" && item.total_payable > 0}
                                                    {#if existingDarf}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            class="h-8 w-8 text-green-500 hover:text-green-400"
                                                            title={$t(
                                                                "fiscal.irpf.table.alreadyGenerated",
                                                            )}
                                                            href="/fiscal/irpf/darf"
                                                        >
                                                            <FileText
                                                                class="w-4 h-4"
                                                            />
                                                        </Button>
                                                    {:else if item.total_payable >= 10}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            class="h-8 w-8 text-amber-500 hover:text-amber-400"
                                                            title={$t(
                                                                "fiscal.irpf.table.generateDarf",
                                                            )}
                                                            onclick={() =>
                                                                generateDarf(
                                                                    item,
                                                                )}
                                                        >
                                                            <FileText
                                                                class="w-4 h-4"
                                                            />
                                                        </Button>
                                                    {/if}
                                                {/if}

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="h-8 w-8 text-blue-500 hover:text-blue-400"
                                                    onclick={() =>
                                                        openViewModal(item)}
                                                >
                                                    <Eye class="w-4 h-4" />
                                                </Button>

                                                {#if item.status === "Paid" || item.status === "Ok"}
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                class="h-8 w-8 opacity-50 cursor-not-allowed"
                                                                disabled
                                                            >
                                                                <Trash2
                                                                    class="w-4 h-4 text-muted-foreground/40"
                                                                />
                                                            </Button>
                                                        </Tooltip.Trigger>
                                                        <Tooltip.Content
                                                            class="bg-popover border-border text-foreground text-xs"
                                                        >
                                                            {$t(
                                                                "fiscal.irpf.table.cannotDelete",
                                                            )}
                                                        </Tooltip.Content>
                                                    </Tooltip.Root>
                                                {:else}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        class="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                                                        onclick={() =>
                                                            deleteAppraisal(
                                                                item,
                                                            )}
                                                    >
                                                        <Trash2
                                                            class="w-4 h-4 text-rose-500"
                                                        />
                                                    </Button>
                                                {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/snippet}
                </HierarchicalList>
            {/if}
        </Card.Content>
    </Card.Root>

    <!-- Appraisal Modal -->
    <Dialog.Root bind:open={isAppraisalModalOpen}>
        <Dialog.Content class="sm:max-w-[800px] p-0 bg-background/95 backdrop-blur-xl border border-border/30 shadow-2xl rounded-3xl">
            <div class="p-6 border-b border-border/10 bg-muted/5">
                <Dialog.Header>
                    <Dialog.Title class="text-xl font-black uppercase tracking-tight text-foreground">
                        {$t("fiscal.irpf.modal.title")}
                    </Dialog.Title>
                    <Dialog.Description class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">
                        {$t("fiscal.irpf.modal.description")}
                    </Dialog.Description>
                </Dialog.Header>
            </div>

            <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div class="flex flex-wrap gap-4 items-end bg-muted/5 p-4 rounded-2xl border border-border/10">
                    <div class="flex flex-col space-y-1.5 w-full md:w-48">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">{$t("fiscal.irpf.modal.month")}</span>
                        <Select.Root type="single" bind:value={appraisalMonth}>
                            <Select.Trigger class="h-9 px-4 bg-muted/10 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 ring-0 focus:ring-0">
                                <span class="truncate uppercase tracking-widest">
                                    {$t(months.find((m) => String(m.val) === appraisalMonth)?.key || "fiscal.irpf.modal.month")}
                                </span>
                            </Select.Trigger>
                            <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                {#each months as m}
                                    <Select.Item value={String(m.val)} class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5">
                                        {$t(m.key)}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="flex flex-col space-y-1.5 w-full md:w-32">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">{$t("fiscal.irpf.modal.year")}</span>
                        <div class="relative w-full">
                            <Input
                                type="number"
                                bind:value={appraisalYear}
                                class="h-9 px-4 bg-muted/10 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full text-[10px] font-black outline-none focus:border-primary/40 transition-all shadow-inner w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div class="absolute inset-y-0 right-1.5 flex flex-col items-center justify-center space-y-0.5">
                                <button
                                    type="button"
                                    class="p-0.5 hover:text-primary transition-colors"
                                    onclick={() => appraisalYear++}
                                >
                                    <ChevronUp class="w-2.5 h-2.5" />
                                </button>
                                <button
                                    type="button"
                                    class="p-0.5 hover:text-primary transition-colors"
                                    onclick={() => appraisalYear--}
                                >
                                    <ChevronDown class="w-2.5 h-2.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        class="h-9 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        onclick={calculateAppraisal}
                        disabled={irpfStore.loading}
                    >
                        {#if irpfStore.loading}
                            <RefreshCw class="w-3.5 h-3.5 mr-2 animate-spin" />
                            {$t("fiscal.irpf.calculating")}
                        {:else}
                            <FileText class="w-3.5 h-3.5 mr-2" />
                            {$t("fiscal.irpf.calculate")}
                        {/if}
                    </Button>
                </div>

                {#if appraisalResults.length > 0}
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {#each appraisalResults as item}
                            <Card.Root
                                class="bg-card/30 border-border/40 glass overflow-hidden relative group"
                            >
                                <div
                                    class="absolute top-0 left-0 w-1 h-full {item.trade_type ===
                                    'DayTrade'
                                        ? 'bg-blue-500'
                                        : 'bg-indigo-500'}"
                                ></div>
                                <Card.Header>
                                    <Card.Title
                                        class="flex justify-between items-center"
                                    >
                                        <span
                                            class="text-lg {item.trade_type ===
                                            'DayTrade'
                                                ? 'text-blue-400'
                                                : 'text-indigo-400'}"
                                        >
                                            {item.trade_type === "DayTrade"
                                                ? "Day Trade"
                                                : "Swing Trade"}
                                        </span>
                                        {#if item.is_exempt}
                                            <span
                                                class="px-2 py-1 rounded text-xs bg-green-500/10 text-green-500 border border-green-500/20"
                                                >Isento</span
                                            >
                                        {/if}
                                    </Card.Title>
                                </Card.Header>
                                <Card.Content class="space-y-4">
                                    <div class="grid grid-cols-2 gap-4 text-sm">
                                        <div class="space-y-1">
                                            <span class="text-muted-foreground"
                                                >Lucro Bruto</span
                                            >
                                            <div
                                                class="text-green-400 font-mono font-bold tabular-nums leading-none"
                                            >
                                                {formatCurrency(
                                                    item.gross_profit,
                                                )}
                                            </div>
                                        </div>
                                        <div class="space-y-1">
                                            <span class="text-muted-foreground"
                                                >Prejuízo</span
                                            >
                                            <div
                                                class="text-red-400 font-mono font-bold tabular-nums leading-none"
                                            >
                                                {formatCurrency(item.loss)}
                                            </div>
                                        </div>
                                        <div
                                            class="space-y-1 pt-2 border-t border-border/10 col-span-2"
                                        >
                                            <span
                                                class="text-muted-foreground font-bold"
                                                >Lucro Líquido</span
                                            >
                                            <div
                                                class="text-xl font-mono font-bold tabular-nums {item.net_profit >=
                                                0
                                                    ? 'text-foreground'
                                                    : 'text-red-400'}"
                                            >
                                                {formatCurrency(
                                                    item.net_profit,
                                                )}
                                            </div>
                                        </div>

                                        {#if item.net_profit > 0}
                                            <div
                                                class="space-y-1 col-span-2 bg-accent/5 p-3 rounded border border-border/10"
                                            >
                                                <div
                                                    class="flex justify-between"
                                                >
                                                    <span
                                                        class="text-muted-foreground"
                                                        >Base de Cálculo:</span
                                                    >
                                                    <span
                                                        class="font-mono font-bold tabular-nums leading-none"
                                                        >{formatCurrency(
                                                            item.calculation_basis,
                                                        )}</span
                                                    >
                                                </div>
                                                <div
                                                    class="flex justify-between"
                                                >
                                                    <span
                                                        class="text-muted-foreground"
                                                        >Alíquota:</span
                                                    >
                                                    <span
                                                        class="font-mono font-bold tabular-nums leading-none"
                                                        >{item.tax_rate}%</span
                                                    >
                                                </div>
                                                <div
                                                    class="flex justify-between text-red-600 dark:text-red-400"
                                                >
                                                    <span
                                                        class="text-muted-foreground"
                                                        >Imposto Devido:</span
                                                    >
                                                    <span
                                                        class="font-mono font-bold tabular-nums leading-none"
                                                        >{formatCurrency(
                                                            item.tax_due,
                                                        )}</span
                                                    >
                                                </div>
                                                {#if item.withheld_tax > 0}
                                                    <div
                                                        class="flex justify-between text-emerald-600 dark:text-emerald-400"
                                                    >
                                                        <span
                                                            class="text-muted-foreground"
                                                            >IRRF (Dedo-Duro):</span
                                                        >
                                                        <span
                                                            class="font-mono font-bold tabular-nums leading-none"
                                                            >-{formatCurrency(
                                                                item.withheld_tax,
                                                            )}</span
                                                        >
                                                    </div>
                                                {/if}
                                                {#if item.withholding_credit_used > 0}
                                                    <div
                                                        class="flex justify-between text-blue-600 dark:text-blue-400"
                                                    >
                                                        <span
                                                            class="text-muted-foreground"
                                                            >Crédito IRRF
                                                            Aplicado:</span
                                                        >
                                                        <span
                                                            class="font-mono font-bold tabular-nums leading-none"
                                                            >-{formatCurrency(
                                                                item.withholding_credit_used,
                                                            )}</span
                                                        >
                                                    </div>
                                                {/if}
                                                <div
                                                    class="flex justify-between pt-2 border-t border-border/10 mt-2"
                                                >
                                                    <span
                                                        class="text-muted-foreground"
                                                        >Imposto do Mês:</span
                                                    >
                                                    <span
                                                        class="font-mono font-bold tabular-nums leading-none text-foreground"
                                                        >{formatCurrency(
                                                            item.tax_payable,
                                                        )}</span
                                                    >
                                                </div>
                                                {#if item.withholding_credit_remaining > 0}
                                                    <div
                                                        class="flex justify-between text-cyan-600 dark:text-cyan-400"
                                                    >
                                                        <span
                                                            class="text-muted-foreground"
                                                            >Saldo IRRF p/
                                                            Futuro:</span
                                                        >
                                                        <span
                                                            class="font-mono font-bold tabular-nums leading-none"
                                                            >{formatCurrency(
                                                                item.withholding_credit_remaining,
                                                            )}</span
                                                        >
                                                    </div>
                                                {/if}
                                                {#if item.tax_accumulated > 0}
                                                    <div
                                                        class="flex justify-between"
                                                    >
                                                        <span
                                                            class="text-muted-foreground"
                                                            >Acumulado Anterior:</span
                                                        >
                                                        <span
                                                            class="font-black tabular-nums leading-none text-yellow-400"
                                                            >+{formatCurrency(
                                                                item.tax_accumulated,
                                                            )}</span
                                                        >
                                                    </div>
                                                {/if}
                                                <div
                                                    class="flex justify-between pt-2 border-t border-border/10 mt-1"
                                                >
                                                    <span
                                                        class="font-bold text-foreground"
                                                        >Total a Pagar:</span
                                                    >
                                                    <span
                                                        class="font-bold text-xl text-primary font-mono"
                                                        >{formatCurrency(
                                                            item.total_payable,
                                                        )}</span
                                                    >
                                                </div>
                                            </div>
                                        {:else}
                                            <div
                                                class="col-span-2 p-3 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3"
                                            >
                                                <AlertTriangle
                                                    class="w-5 h-5 text-amber-500"
                                                />
                                                <div class="flex flex-col">
                                                    <span
                                                        class="text-xs text-amber-600 dark:text-amber-400 font-medium"
                                                        >Prejuízo a compensar: {formatCurrency(
                                                            item.net_profit,
                                                        )}</span
                                                    >
                                                    {#if item.withholding_credit_remaining > 0}
                                                        <span
                                                            class="text-xs text-cyan-600 dark:text-cyan-400 font-bold"
                                                        >
                                                            Crédito IRRF
                                                            (Dedo-Duro): {formatCurrency(
                                                                item.withholding_credit_remaining,
                                                            )}
                                                        </span>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                </Card.Content>
                                <Card.Footer
                                    class="bg-muted/5 border-t border-border/10 p-4 flex justify-end gap-3"
                                >
                                    {#if item.id}
                                        {#if item.total_payable >= 10}
                                            <Button
                                                variant="secondary"
                                                class="h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest"
                                                onclick={() => generateDarf(item)}
                                            >
                                                <FileText class="w-3.5 h-3.5 mr-2" /> Gerar DARF
                                            </Button>
                                        {:else if item.total_payable > 0}
                                            <div class="flex items-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[9px] font-black uppercase tracking-widest mr-auto">
                                                <AlertCircle class="w-3 h-3 mr-1.5" />
                                                Valor menor que R$ 10,00 (Transportado)
                                            </div>
                                        {/if}
                                    {/if}
                                    <Button
                                        variant="outline"
                                        class="h-8 px-4 rounded-full border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                                        onclick={() => saveAppraisalResult(item)}
                                    >
                                        <FileText class="w-3.5 h-3.5 mr-2" /> Salvar
                                    </Button>
                                </Card.Footer>
                            </Card.Root>
                        {/each}
                    </div>
                {/if}
            </div>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Delete Modal -->
    <Dialog.Root bind:open={isDeleteModalOpen}>
        <Dialog.Content class="sm:max-w-[400px] p-0 bg-background/95 backdrop-blur-xl border border-border/30 overflow-hidden shadow-2xl rounded-3xl">
            <div class="p-6 border-b border-border/10 bg-muted/5">
                <Dialog.Header>
                    <Dialog.Title class="text-xl font-black uppercase tracking-tight text-foreground">
                        Confirmar Exclusão
                    </Dialog.Title>
                    <Dialog.Description class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">
                        Esta ação não pode ser desfeita e afetará o saldo de prejuízos.
                    </Dialog.Description>
                </Dialog.Header>
            </div>

            <div class="p-6 flex flex-col gap-4">
                <p class="text-xs text-muted-foreground/80 leading-relaxed">
                    Tem certeza que deseja excluir esta apuração? Todos os dados vinculados a este período serão removidos.
                </p>

                <div class="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        onclick={() => (isDeleteModalOpen = false)}
                        class="h-9 px-6 rounded-full border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="destructive" 
                        onclick={confirmDelete}
                        class="h-9 px-6 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20"
                    >
                        Excluir permanentemente
                    </Button>
                </div>
            </div>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Standardized DARF/Appraisal Details Dialog -->
    <DarfDetailsDialog
        darfId={selectedAppraisal
            ? irpfStore.darfs.find(
                  (d) =>
                      irpfStore.getId(d.appraisal_id) ===
                      irpfStore.getId(selectedAppraisal.id),
              )?.id || ""
            : ""}
        appraisalId={selectedAppraisal
            ? irpfStore.getId(selectedAppraisal.id)
            : ""}
        bind:open={isViewModalOpen}
    />
</div>

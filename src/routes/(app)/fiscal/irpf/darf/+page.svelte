<script lang="ts">
  import { accountsStore } from "$lib/stores/accounts.svelte";
    import { onMount, untrack } from "svelte";
    import { toast } from "svelte-sonner";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Dialog from "$lib/components/ui/dialog";
    import {
        FileText,
        CheckCircle,
        DollarSign,
        ArrowLeft,
        Trash2,
        Eye,
        AlertTriangle,
        Undo2,
        RotateCcw,
    } from "lucide-svelte";
    import { _ as t } from "svelte-i18n";
    import { irpfStore } from "$lib/stores/irpfStore.svelte";
    import { appStore } from "$lib/stores/app.svelte"; // Import appStore
    import * as Select from "$lib/components/ui/select";
    import DarfDetailsDialog from "$lib/components/finance/DarfDetailsDialog.svelte";
    import { formatLocalISO } from "$lib/utils";
    import HierarchicalList from "$lib/components/shared/HierarchicalList.svelte";
    import { Badge } from "$lib/components/ui/badge";

    const monthKeys = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
    ];

    function getMonthName(monthNumber: number) {
        const key = monthKeys[monthNumber - 1];
        return $t(`common.months.${key}`, {
            default: "Mês Inválido",
        });
    }

    // Use centralized year from irpfStore
    let selectedYear = $state(irpfStore.selectedYear);

    // View Modal State
    let isViewModalOpen = $state(false);
    let selectedDarf = $state<any>(null);

    // Delete Modal State
    let isDeleteModalOpen = $state(false);
    let darfToDelete = $state<any>(null);

    let isPayModalOpen = $state(false);
    let isSaving = $state(false); // Global saving state for financial operations
    let paymentData = $state({
        id: "",
        principal: 0,
        fine: 0,
        interest: 0,
        total: 0,
        date: new Date().toISOString().split("T")[0],
        accountId: "", // Add accountId
    });

    onMount(() => {
        irpfStore.loadAllData(selectedYear);
        // Ensure accounts are loaded if not already
        if (accountsStore.accounts.length === 0) {
            appStore.loadData();
        }
    });

    function loadData() {
        irpfStore.loadAllData(selectedYear);
    }

    function openPayModal(item: any) {
        paymentData = {
            id: item.id,
            principal: item.principal_value,
            fine: item.fine || 0,
            interest: item.interest || 0,
            total: item.total_value || item.principal_value,
            date: new Date().toISOString().split("T")[0],
            accountId: "", // Reset accountId
        };
        isPayModalOpen = true;
    }

    function updatePaymentTotal() {
        paymentData.total =
            Number(paymentData.principal) +
            Number(paymentData.fine) +
            Number(paymentData.interest);
    }

    async function confirmPayment() {
        if (!paymentData.accountId) {
            toast.error($t("fiscal.darf.accountError"));
            return;
        }
        if (isSaving) return; // Prevent double trigger
        
        isSaving = true;
        try {
            const idStr = irpfStore.getId(paymentData.id);

            // Append current time with high precision for chronological sorting
            const fullIsoDate = formatLocalISO(paymentData.date);

            console.log("[DARF_PAGE] Marking DARF as paid:", { idStr, date: fullIsoDate });
            await irpfStore.markDarfPaid(
                idStr,
                fullIsoDate,
                paymentData.total,
                paymentData.accountId,
                paymentData.fine,
                paymentData.interest,
            );
            isPayModalOpen = false;
        } catch (error) {
            console.error("[DARF_PAGE] Payment failed:", error);
            // Error handled in store's toast
        } finally {
            isSaving = false;
        }
    }

    function deleteDarf(item: any) {
        darfToDelete = item;
        isDeleteModalOpen = true;
    }

    async function confirmDelete() {
        if (!darfToDelete) return;
        const idStr = irpfStore.getId(darfToDelete.id);
        await irpfStore.deleteDarf(idStr);
        isDeleteModalOpen = false;
    }

    function openViewModal(darf: any) {
        selectedDarf = darf;
        isViewModalOpen = true;
    }

    function formatCurrency(val: number) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(val || 0);
    }

    function formatDate(dateStr: string) {
        if (!dateStr) return "-";
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
    }

    function getStatusColor(status: string, dueDate: string) {
        if (status === "Paid")
            return "text-green-500 bg-green-500/10 border-green-500/20";

        const today = new Date().toISOString().split("T")[0];
        if (dueDate < today)
            return "text-rose-500 bg-rose-500/10 border-rose-500/20";

        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    }

    // Unpay Modal State
    let isUnpayModalOpen = $state(false);
    let darfToUnpay = $state<any>(null);

    function openUnpayModal(item: any) {
        darfToUnpay = item;
        isUnpayModalOpen = true;
    }

    async function confirmUnpay() {
        if (!darfToUnpay) return;
        const idStr = irpfStore.getId(darfToUnpay.id);
        await irpfStore.unpayDarf(idStr);
        isUnpayModalOpen = false;
        isViewModalOpen = false; // Close view modal if open
    }

    function getAccountName(accountId: string) {
        if (!accountId) return "Desconhecida";
        const id = accountId.includes(":")
            ? accountId.split(":").pop()
            : accountId;
        const acc = accountsStore.accounts.find(
            (a) => irpfStore.getId(a.id) === id,
        );
        return acc ? acc.nickname : "Conta Removida";
    }

    let pendingDarfs = $derived(
        irpfStore.darfs
            .filter((d) => d.status === "Pending" && d.total_value > 0)
            .sort(
                (a, b) =>
                    new Date(a.due_date).getTime() -
                    new Date(b.due_date).getTime(),
            ),
    );

    let historyDarfs = $derived(
        irpfStore.darfs
            .filter((d) => {
                if (d.status === "Pending" && d.total_value > 0) return false; // Already in pending
                // Filter by year strictly for history (Parse MM/YYYY manually)
                const parts = d.period.split("/");
                const darfYear = parts.length > 1 ? parseInt(parts[1]) : 0;

                // Also include if paid in THIS selected year (regardless of period)
                const paymentYear = d.payment_date
                    ? parseInt(d.payment_date.split("-")[0])
                    : 0;

                return (
                    darfYear === irpfStore.selectedYear ||
                    paymentYear === irpfStore.selectedYear
                );
            })
            .sort((a, b) => {
                // Sort by period descending (MM/YYYY)
                const partsA = a.period.split("/");
                const partsB = b.period.split("/");
                const dateA = new Date(
                    parseInt(partsA[1]),
                    parseInt(partsA[0]) - 1,
                );
                const dateB = new Date(
                    parseInt(partsB[1]),
                    parseInt(partsB[0]) - 1,
                );
                return dateB.getTime() - dateA.getTime();
            }),
    );

    let hierarchicalDarfs = $derived.by(() => {
        const dataByMonth: Record<string, any> = {};

        historyDarfs.forEach((item) => {
            const parts = item.period.split("/");
            if (parts.length !== 2) return;
            const periodMonth = parseInt(parts[0]);
            const periodYear = parseInt(parts[1]);
            const groupKey = `${periodMonth}-${periodYear}`;

            if (!dataByMonth[groupKey]) {
                const monthName = getMonthName(periodMonth);
                dataByMonth[groupKey] = {
                    key: `month-${groupKey}`,
                    label: `${monthName} / ${periodYear}`.toUpperCase(),
                    days: [], // used for flat mode
                    originalItems: [],
                };
            }

            dataByMonth[groupKey].originalItems.push(item);
            dataByMonth[groupKey].days.push({
                key: `darf-${item.id}`,
                date: "",
                label: item.revenue_code,
                originalItem: item,
            });
        });

        return Object.values(dataByMonth).sort((a: any, b: any) => {
            // Sort by key (month-year) descending
            const [m1, y1] = a.key.replace("month-", "").split("-").map(Number);
            const [m2, y2] = b.key.replace("month-", "").split("-").map(Number);
            
            if (y1 !== y2) return y2 - y1;
            return m2 - m1;
        });
    });

    function loadIrpfData() {
        irpfStore.loadAllData(selectedYear);
    }

    let expandedMonths = $state(new Set<string>());

    $effect(() => {
        if (hierarchicalDarfs.length > 0) {
            untrack(() => {
                const today = new Date();
                const currentMonth = today.getMonth() + 1;
                const currentYear = today.getFullYear();
                const currentMonthKey = `month-${currentMonth}-${currentYear}`;

                if (expandedMonths.size === 0) {
                    if (hierarchicalDarfs.some(m => m.key === currentMonthKey)) {
                        expandedMonths.add(currentMonthKey);
                    } else {
                        // Fallback to latest month
                        expandedMonths.add(hierarchicalDarfs[0].key);
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
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-6"
    >
        <div class="flex flex-col md:flex-row md:items-center gap-4">
            <Button
                variant="ghost"
                size="icon"
                href="/fiscal/irpf"
                class="hidden md:flex"
            >
                <ArrowLeft class="w-5 h-5" />
            </Button>
            <div>
                <h2
                    class="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2"
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        href="/fiscal/irpf"
                        class="md:hidden h-6 w-6"
                    >
                        <ArrowLeft class="w-4 h-4" />
                    </Button>
                    {$t("fiscal.darf.title")}
                </h2>
                <p class="text-muted-foreground mt-1">
                    {$t("fiscal.darf.description")}
                </p>
            </div>
        </div>

        <div class="flex items-center gap-1.5">
            <div class="flex flex-col space-y-1">
                <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">{$t("fiscal.irpf.modal.year")}</span>
                <Select.Root
                    type="single"
                    value={selectedYear.toString()}
                    onValueChange={(v) => {
                        if (v) {
                            selectedYear = parseInt(v);
                            loadIrpfData();
                        }
                    }}
                >
                    <Select.Trigger
                        class="h-9 px-4 bg-muted/10 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-[120px] text-foreground/80 ring-0 focus:ring-0"
                    >
                        <span class="truncate uppercase tracking-widest">{irpfStore.selectedYear}</span>
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
            <Button variant="outline" onclick={loadData} class="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest mt-4">
                <Undo2 class="w-3.5 h-3.5 mr-2" />
                {$t("common.reload")}
            </Button>
        </div>
    </div>

    <!-- Active DARFs (Cards) -->
    {#if pendingDarfs.length > 0}
        <div>
            <h3
                class="text-lg font-semibold text-foreground mb-4 flex items-center gap-1.5"
            >
                <AlertTriangle class="w-5 h-5 text-amber-500" />
                {$t("fiscal.darf.active")}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                {#each pendingDarfs as item}
                    <Card.Root
                        class="bg-muted/30 border-l-4 border-l-amber-500 border-y border-r border-border/30 glass relative overflow-hidden group hover:border-r-amber-500/30 transition-all hover:shadow-md"
                    >
                        <div
                            class="absolute top-0 right-0 p-1.5 flex gap-1 z-10"
                        >
                            {#if item.due_date < new Date()
                                    .toISOString()
                                    .split("T")[0]}
                                <span
                                    class="px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter text-rose-500 bg-rose-500/10 border border-rose-500/20"
                                >
                                    {$t("fiscal.darf.status.late")}
                                </span>
                            {:else}
                                <span
                                    class="px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter text-amber-500 bg-amber-500/10 border border-amber-500/20"
                                >
                                    {$t("fiscal.darf.status.pending")}
                                </span>
                            {/if}
                        </div>

                        <Card.Content class="py-0.5 px-2 space-y-1">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-1.5">
                                    <FileText class="w-3 h-3 text-primary" />
                                    <span
                                        class="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none"
                                        >DARF {item.period}</span
                                    >
                                </div>
                                <span
                                    class="text-[8px] font-bold opacity-70 leading-none"
                                    >Cód: {item.revenue_code}</span
                                >
                            </div>

                            <div class="mt-0">
                                <span
                                    class="text-[9px] text-muted-foreground uppercase leading-none block"
                                    >{$t("fiscal.darf.labels.valueToPay")}</span
                                >
                                <div
                                    class="text-base font-black text-foreground tabular-nums tracking-tight leading-none mt-0.5"
                                >
                                    {formatCurrency(item.total_value)}
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                                <div>
                                    <span
                                        class="text-muted-foreground block uppercase font-medium"
                                        >{$t(
                                            "fiscal.darf.labels.dueDate",
                                        )}</span
                                    >
                                    <span class="text-foreground font-medium"
                                        >{formatDate(item.due_date)}</span
                                    >
                                </div>
                                <div>
                                    <span
                                        class="text-muted-foreground block uppercase font-medium"
                                        >{$t(
                                            "fiscal.darf.labels.principal",
                                        )}</span
                                    >
                                    <span class="text-foreground font-medium"
                                        >{formatCurrency(
                                            item.principal_value,
                                        )}</span
                                    >
                                </div>
                            </div>
                        </Card.Content>

                        <Card.Footer
                            class="bg-muted/20 border-t border-border/10 p-1.5 flex justify-end gap-1.5"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                class="h-7 w-7 p-0"
                                onclick={() => openViewModal(item)}
                            >
                                <Eye class="w-3 h-3" />
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                class="bg-green-600 hover:bg-green-700 text-white h-7 text-[10px] font-bold uppercase tracking-wide flex-1"
                                onclick={() => openPayModal(item)}
                            >
                                <DollarSign class="w-3 h-3 mr-1" />
                                {$t("fiscal.darf.buttons.pay")}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-7 w-7 p-0 hover:bg-rose-500/10"
                                onclick={() => deleteDarf(item)}
                            >
                                <Trash2
                                    class="w-3 h-3 text-red-400 group-hover:text-rose-500"
                                />
                            </Button>
                        </Card.Footer>
                    </Card.Root>
                {/each}
            </div>
        </div>
    {/if}

    <!-- History/Paid DARFs (List) -->
    <div class="mt-8">
        <h3
            class="text-lg font-semibold text-foreground mb-4 flex items-center gap-1.5"
        >
            <CheckCircle class="w-5 h-5 text-green-500" />
            {$t("fiscal.darf.history", { values: { year: irpfStore.selectedYear.toString() } })}
        </h3>

        {#if irpfStore.loading}
            <div class="p-8 text-center text-muted-foreground">
                {$t("fiscal.darf.messages.loading")}
            </div>
        {:else if historyDarfs.length === 0}
            <div
                class="p-8 text-center border border-dashed border-border text-muted-foreground"
            >
                {$t("fiscal.darf.emptyHistory", {
                    year: irpfStore.selectedYear,
                })}
            </div>
        {:else}
            <div class="mt-4">
                <HierarchicalList
                    data={hierarchicalDarfs}
                    flatMode={true}
                    omitDays={true}
                    bind:expandedMonths
                    mutualExclusion={true}
                >
                    {#snippet monthBadges(month: any)}
                        {@const totalMonthPaid = month.originalItems.reduce(
                            (acc: number, curr: any) => acc + curr.total_value,
                            0,
                        )}
                        {@const totalMonthPrin = month.originalItems.reduce(
                            (acc: number, curr: any) =>
                                acc + curr.principal_value,
                            0,
                        )}

                        <Badge
                            variant="outline"
                            class="text-[9px] px-1.5 h-4 bg-muted border-border font-bold uppercase"
                        >
                            {month.days.length}
                            {$t("common.records", { default: "REGISTROS" })}
                        </Badge>

                        <div class="flex gap-4 ml-2">
                            <div class="flex flex-col items-end">
                                <span
                                    class="text-[9px] font-bold text-muted-foreground uppercase opacity-70"
                                >
                                    {$t("fiscal.darf.principalValue")}
                                </span>
                                <span
                                    class="text-[10px] font-mono font-bold text-muted-foreground"
                                >
                                    {formatCurrency(totalMonthPrin)}
                                </span>
                            </div>

                            <div class="flex flex-col items-end">
                                <span
                                    class="text-[9px] font-bold text-muted-foreground uppercase opacity-70"
                                >
                                    {$t("fiscal.darf.totalPaid")}
                                </span>
                                <span
                                    class="text-[10px] font-mono font-bold text-green-400"
                                >
                                    {formatCurrency(totalMonthPaid)}
                                </span>
                            </div>
                        </div>
                    {/snippet}

                    {#snippet monthContent(month: any)}
                        <div class="space-y-1">
                            {#each month.originalItems as item}
                                <div
                                    class="flex flex-col lg:flex-row items-center justify-between p-3 gap-4 w-full group hover:bg-muted/10 transition-colors border-b border-border/10 last:border-0"
                                >
                                    <div class="flex flex-col gap-1 w-full lg:w-40">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted/50 text-foreground border border-border/30"
                                            >
                                                {item.revenue_code}
                                            </span>
                                            {#if item.is_complementary}
                                                <Badge variant="outline" class="text-[8px] px-1 h-4 border-amber-500/30 text-amber-500 bg-amber-500/5">COMPLEMENTAR</Badge>
                                            {/if}
                                        </div>
                                        <span class="text-[9px] font-bold text-muted-foreground uppercase truncate">
                                            {getAccountName(item.account_id)}
                                        </span>
                                    </div>

                                    <div
                                        class="flex flex-row items-center gap-6 sm:gap-10 flex-1 justify-end"
                                    >
                                        <!-- Dates -->
                                        <div class="hidden sm:flex gap-6">
                                            <div class="flex flex-col items-end">
                                                <span class="text-[8px] text-muted-foreground uppercase font-bold">Vencimento</span>
                                                <span class="text-[10px] font-bold text-muted-foreground/80">{formatDate(item.due_date)}</span>
                                            </div>
                                            <div class="flex flex-col items-end">
                                                <span class="text-[8px] text-muted-foreground uppercase font-bold">Pagamento</span>
                                                <span class="text-[10px] font-bold text-green-500/80">{formatDate(item.payment_date)}</span>
                                            </div>
                                        </div>

                                        <!-- Values -->
                                        <div class="flex flex-col items-end">
                                            <span
                                                class="text-[8px] text-muted-foreground uppercase font-bold"
                                                >{$t("fiscal.darf.principalValue")}</span
                                            >
                                            <span
                                                class="font-mono text-xs leading-none font-bold text-muted-foreground"
                                            >
                                                {formatCurrency(item.principal_value)}
                                            </span>
                                        </div>

                                        <div
                                            class="flex flex-col items-end h-[30px] justify-center w-20"
                                        >
                                            {#if item.fine + item.interest > 0}
                                                <span
                                                    class="text-[8px] text-muted-foreground uppercase font-bold"
                                                    >{$t("fiscal.darf.fineInterest")}</span
                                                >
                                                <span
                                                    class="font-mono text-[10px] leading-none font-bold text-rose-400"
                                                >
                                                    {formatCurrency(item.fine + item.interest)}
                                                </span>
                                            {/if}
                                        </div>

                                        <div class="flex flex-col items-end">
                                            <span
                                                class="text-[8px] text-muted-foreground uppercase font-bold"
                                                >{$t("fiscal.darf.totalPaid")}</span
                                            >
                                            <span
                                                class="font-mono text-xs leading-none font-bold text-green-400"
                                            >
                                                {formatCurrency(item.total_value)}
                                            </span>
                                        </div>

                                        <div
                                            class="flex items-center gap-3 justify-between border-l border-border/50 pl-4 ml-2"
                                        >
                                            <div class="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                                                    onclick={() => openViewModal(item)}
                                                >
                                                    <Eye class="w-3.5 h-3.5" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="h-7 w-7 text-muted-foreground hover:text-rose-500 transition-colors"
                                                    onclick={() => deleteDarf(item)}
                                                >
                                                    <Trash2 class="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/snippet}
                </HierarchicalList>
            </div>
        {/if}

        <!-- Payment Modal -->
        <Dialog.Root bind:open={isPayModalOpen}>
            <Dialog.Content class="sm:max-w-[425px] rounded-3xl border-border/40 p-0 overflow-hidden shadow-2xl">
                <div class="p-6 border-b border-border/10 bg-muted/5">
                    <Dialog.Header>
                        <Dialog.Title class="text-xl font-black uppercase tracking-tight">{$t("fiscal.darf.registerPayment")}</Dialog.Title>
                        <Dialog.Description class="text-xs text-muted-foreground">
                            {$t("fiscal.darf.paymentDescription")}
                        </Dialog.Description>
                    </Dialog.Header>
                </div>

                <div class="p-6 space-y-6">
                    <div class="bg-muted/10 rounded-2xl p-4 border border-border/10 flex justify-between items-center">
                        <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{$t("fiscal.darf.labels.principal")}</span>
                        <div class="text-lg font-black tabular-nums tracking-tight">
                            {formatCurrency(paymentData.principal)}
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">{$t("fiscal.darf.sourceAccount")}</span>
                        <div class="flex flex-col gap-1.5">
                            <Select.Root
                                type="single"
                                bind:value={paymentData.accountId}
                            >
                                <Select.Trigger
                                    class="h-10 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[11px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 ring-0 focus:ring-0"
                                >
                                    <span class="truncate uppercase tracking-widest">
                                        {accountsStore.accounts.find(
                                            (a) => a.id === paymentData.accountId,
                                        )?.nickname ||
                                            $t("fiscal.darf.selectAccount")}
                                    </span>
                                </Select.Trigger>
                                <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                    <Select.Group>
                                        {#each accountsStore.accounts as acc}
                                            <Select.Item
                                                value={acc.id}
                                                class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5"
                                            >
                                                {acc.nickname}{acc.currency ? ` (${acc.currency})` : ""}
                                            </Select.Item>
                                        {/each}
                                    </Select.Group>
                                </Select.Content>
                            </Select.Root>

                            {#if !paymentData.accountId}
                                <span class="text-[10px] font-bold text-rose-500/80 px-3 italic"
                                    >{$t("fiscal.darf.modal.pay.noAccount")}</span
                                >
                            {/if}
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">{$t("fiscal.darf.labels.fine")}</span>
                            <Input
                                type="number"
                                step="0.01"
                                bind:value={paymentData.fine}
                                oninput={updatePaymentTotal}
                                class="h-10 rounded-full bg-muted/5 border-border/40 font-mono font-bold text-center focus:ring-primary/20"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">{$t("fiscal.darf.labels.interest")}</span>
                            <Input
                                type="number"
                                step="0.01"
                                bind:value={paymentData.interest}
                                oninput={updatePaymentTotal}
                                class="h-10 rounded-full bg-muted/5 border-border/40 font-mono font-bold text-center focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">{$t("fiscal.darf.labels.paymentDate")}</span>
                        <Input
                            type="date"
                            bind:value={paymentData.date}
                            class="h-10 rounded-full bg-muted/5 border-border/40 font-black text-xs uppercase tracking-widest px-6"
                        />
                    </div>

                    <div class="pt-6 border-t border-border/10 flex justify-between items-center px-2">
                        <span class="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{$t("fiscal.darf.labels.totalPaid")}</span>
                        <div class="text-2xl font-black tabular-nums tracking-tighter text-emerald-500">
                            {formatCurrency(paymentData.total)}
                        </div>
                    </div>
                </div>

                <Dialog.Footer class="p-6 bg-muted/5 border-t border-border/10 flex gap-3">
                    <Button
                        variant="ghost"
                        class="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-10"
                        onclick={() => (isPayModalOpen = false)}
                        >{$t("fiscal.darf.buttons.cancel")}</Button
                    >
                    <Button
                        class="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-10 shadow-lg shadow-primary/20"
                        disabled={!paymentData.accountId || isSaving}
                        onclick={confirmPayment}
                    >
                        {#if isSaving}
                            <span class="flex items-center gap-2">
                                <span class="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                                {$t("common.saving")}...
                            </span>
                        {:else}
                            <DollarSign class="w-4 h-4 mr-2" />
                            {$t("fiscal.darf.buttons.confirmPay")}
                        {/if}
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>

        <!-- Standardized View Modal -->
        <DarfDetailsDialog
            darfId={selectedDarf ? irpfStore.getId(selectedDarf.id) : ""}
            bind:open={isViewModalOpen}
        />

        <!-- Delete Modal -->
        <Dialog.Root bind:open={isDeleteModalOpen}>
            <Dialog.Content class="sm:max-w-[400px] rounded-3xl border-border/40 p-0 overflow-hidden shadow-2xl">
                <div class="p-6 border-b border-border/10 bg-muted/5">
                    <Dialog.Header>
                        <Dialog.Title class="text-xl font-black uppercase tracking-tight">{$t("fiscal.darf.modal.delete.title")}</Dialog.Title>
                        <Dialog.Description class="text-xs text-muted-foreground">
                            {$t("fiscal.darf.modal.delete.prompt")}
                        </Dialog.Description>
                    </Dialog.Header>
                </div>
                <Dialog.Footer class="p-6 bg-muted/5 border-t border-border/10 flex gap-3">
                    <Button
                        variant="ghost"
                        class="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-10"
                        onclick={() => (isDeleteModalOpen = false)}
                        >{$t("fiscal.darf.buttons.cancel")}</Button
                    >
                    <Button 
                        variant="destructive" 
                        class="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-10 shadow-lg shadow-rose-500/20"
                        onclick={confirmDelete}
                    >
                        <Trash2 class="w-3.5 h-3.5 mr-2" />
                        {$t("fiscal.darf.buttons.delete")}
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>

        <!-- Unpay Modal -->
        <Dialog.Root bind:open={isUnpayModalOpen}>
            <Dialog.Content class="sm:max-w-[400px] rounded-3xl border-border/40 p-0 overflow-hidden shadow-2xl">
                <div class="p-6 border-b border-border/10 bg-muted/5">
                    <Dialog.Header>
                        <Dialog.Title class="text-xl font-black uppercase tracking-tight">{$t("fiscal.darf.modal.unpay.title")}</Dialog.Title>
                        <Dialog.Description class="text-xs text-muted-foreground">
                            {$t("fiscal.darf.modal.unpay.descriptionLine1")}
                            <b class="text-foreground">{darfToUnpay ? formatCurrency(darfToUnpay.total_value) : ""}</b>
                            {$t("fiscal.darf.modal.unpay.descriptionLine2")}
                        </Dialog.Description>
                    </Dialog.Header>
                </div>
                <div class="p-6">
                    <p class="text-sm font-medium text-center italic">{$t("fiscal.darf.modal.unpay.descriptionLine3")}</p>
                </div>
                <Dialog.Footer class="p-6 bg-muted/5 border-t border-border/10 flex gap-3">
                    <Button
                        variant="ghost"
                        class="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-10"
                        onclick={() => (isUnpayModalOpen = false)}
                        >{$t("fiscal.darf.buttons.cancel")}</Button
                    >
                    <Button 
                        variant="default" 
                        class="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-10 shadow-lg shadow-primary/20"
                        onclick={confirmUnpay}
                    >
                        <RotateCcw class="w-3.5 h-3.5 mr-2" />
                        {$t("fiscal.darf.buttons.confirmUnpay")}
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
    </div>
</div>

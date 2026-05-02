<script lang="ts">
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
  import { currenciesStore } from "$lib/stores/currencies.svelte";
  import { accountsStore } from "$lib/stores/accounts.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Button } from "$lib/components/ui/button";
    import { appStore } from "$lib/stores/app.svelte";
    import {
        ArrowRightLeft,
        Wallet,
        ChevronRight,
        Info,
        AlertCircle,
        ArrowDown,
    } from "lucide-svelte";
    import { t } from "svelte-i18n";
    import { toast } from "svelte-sonner";
    import { cn, formatLocalISO } from "$lib/utils";

    let { open = $bindable(false) } = $props();

    let fromAccountId = $state("");
    let toAccountId = $state("");
    let sourceAmount = $state(0);
    let fee = $state(0);
    let destAmount = $state(0);
    let exchangeRate = $state(1);
    let date = $state(new Date().toISOString().split("T")[0]);
    let description = $state("");

    let fromAccount = $derived(
        accountsStore.accounts.find((a) => a.id === fromAccountId),
    );
    let toAccount = $derived(
        accountsStore.accounts.find((a) => a.id === toAccountId),
    );

    let sameCurrency = $derived(
        fromAccount && toAccount && fromAccount.currency === toAccount.currency,
    );

    // Update exchange rate when accounts change
    $effect(() => {
        if (fromAccount && toAccount && !sameCurrency) {
            const fromRate =
                currenciesStore.currencies.find(
                    (c) => c.code === fromAccount!.currency,
                )?.exchange_rate || 1;
            const toRate =
                currenciesStore.currencies.find(
                    (c) => c.code === toAccount!.currency,
                )?.exchange_rate || 1;
            exchangeRate = fromRate / toRate;
            handleSourceChange();
        } else {
            exchangeRate = 1;
            handleSourceChange();
        }
    });

    function handleSourceChange() {
        destAmount = (sourceAmount - fee) * exchangeRate;
    }

    function handleDestChange() {
        if (exchangeRate > 0) {
            sourceAmount = destAmount / exchangeRate + fee;
        }
    }

    async function handleSubmit() {
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
            toast.error($t("finance.transferDialog.errorDifferentAccounts"));
            return;
        }

        if (sourceAmount <= 0) {
            toast.error($t("finance.transferDialog.errorPositiveValue"));
            return;
        }

        const fullIsoDate = formatLocalISO(date);

        const result = await financialConfigStore.transferFunds({
            fromAccountId,
            toAccountId,
            amountParams: {
                sourceAmount: sourceAmount,
                fee: fee,
                destAmount: destAmount,
            },
            date: fullIsoDate,
            description:
                description ||
                `${$t("finance.transactionDialog.tabs.transfer")}: ${fromAccount?.currency} -> ${toAccount?.currency} (${$t("finance.transactionDialog.fxRate")}: ${exchangeRate.toFixed(4)})`,
        });

        if (result.success) {
            toast.success($t("finance.transferDialog.success"));
            open = false;
            resetForm();
        } else {
            toast.error(result.error || $t("finance.transferDialog.errorSave"));
        }
    }

    function resetForm() {
        fromAccountId = "";
        toAccountId = "";
        sourceAmount = 0;
        fee = 0;
        destAmount = 0;
        description = "";
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content
        class="sm:max-w-[480px] bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
    >
        <div
            class="p-6 border-b border-zinc-800 bg-zinc-900 shadow-xl relative z-10"
        >
            <Dialog.Header>
                <Dialog.Title
                    class="text-xl font-bold text-white flex items-center gap-2"
                >
                    <div
                        class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                    >
                        <ArrowRightLeft class="w-5 h-5 text-primary" />
                    </div>
                    {$t("finance.transferDialog.title")}
                </Dialog.Title>
                <Dialog.Description class="text-zinc-500 text-xs">
                    {$t("finance.transferDialog.description")}
                </Dialog.Description>
            </Dialog.Header>
        </div>

        <div
            class="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
        >
            <div
                class="grid grid-cols-[1fr,auto,1fr] items-center gap-3 bg-muted/5 dark:bg-white/[0.02] p-4 rounded-2xl border border-border/40"
            >
                <div class="space-y-1.5">
                    <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3">{$t("common.origin")}</span>
                    <Select.Root type="single" bind:value={fromAccountId}>
                        <Select.Trigger
                            class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 dark:text-foreground/70 ring-0 focus:ring-0"
                        >
                            <span class="truncate uppercase tracking-widest">
                                {fromAccount?.nickname ?? $t("common.origin")}
                            </span>
                        </Select.Trigger>
                        <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                            {#each accountsStore.accounts as acc}
                                <Select.Item
                                    value={acc.id}
                                    class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5"
                                    >{acc.nickname}{acc.currency ? ` (${acc.currency})` : ""}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>

                <div class="mt-5">
                    <div
                        class="w-8 h-8 rounded-full bg-muted/10 flex items-center justify-center border border-border/40"
                    >
                        <ChevronRight class="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>

                <div class="space-y-1.5">
                    <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/30 px-3 text-right block">{$t("common.destination")}</span>
                    <Select.Root type="single" bind:value={toAccountId}>
                        <Select.Trigger
                            class="h-9 px-4 bg-muted/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full hover:border-black/10 dark:hover:border-white/20 transition-all text-[10px] font-black shadow-inner flex items-center justify-between gap-1 w-full text-foreground/80 dark:text-foreground/70 ring-0 focus:ring-0"
                        >
                            <span class="truncate uppercase tracking-widest">
                                {toAccount?.nickname ??
                                    $t("common.destination")}
                            </span>
                        </Select.Trigger>
                        <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border-black/10 dark:border-white/5 rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                            {#each accountsStore.accounts as acc}
                                <Select.Item
                                    value={acc.id}
                                    class="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-muted/5"
                                    >{acc.nickname}{acc.currency ? ` (${acc.currency})` : ""}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>

            <!-- Amounts -->
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label
                            class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1"
                            >{$t("finance.transferDialog.amount")}</Label
                        >
                        <div class="relative">
                            <div
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs"
                            >
                                {fromAccount?.currency ?? ""}
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                class="pl-12 h-12 bg-zinc-950/50 border-zinc-800 font-mono font-bold"
                                bind:value={sourceAmount}
                                oninput={handleSourceChange}
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label
                            class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1"
                            >{$t("finance.transferDialog.fee")}</Label
                        >
                        <div class="relative">
                            <div
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs"
                            >
                                {fromAccount?.currency ?? ""}
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                class="pl-12 h-12 bg-zinc-950/50 border-zinc-800 font-mono"
                                bind:value={fee}
                                oninput={handleSourceChange}
                            />
                        </div>
                    </div>
                </div>

                {#if fromAccount && toAccount && !sameCurrency}
                    <div
                        class="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3"
                    >
                        <div class="flex items-center justify-between">
                            <div
                                class="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider"
                            >
                                <Info class="w-3 h-3" />
                                {$t("finance.transferDialog.rate")}
                            </div>
                            <div class="text-[10px] text-zinc-500 font-mono">
                                1 {fromAccount.currency} = {exchangeRate.toFixed(
                                    4,
                                )}
                                {toAccount.currency}
                            </div>
                        </div>
                        <Input
                            type="number"
                            step="0.0001"
                            class="bg-zinc-950/50 border-primary/20 h-10 font-mono text-center text-primary font-bold"
                            bind:value={exchangeRate}
                            oninput={handleSourceChange}
                        />
                    </div>
                {/if}

                <div class="flex justify-center py-2">
                    <div
                        class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"
                    >
                        <ArrowDown class="w-4 h-4 text-zinc-500" />
                    </div>
                </div>

                <div class="space-y-2">
                    <Label
                        class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1"
                        >{$t("finance.transferDialog.finalAmount")}</Label
                    >
                    <div class="relative">
                        <div
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs uppercase"
                        >
                            {toAccount?.currency ?? ""}
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            class="pl-12 h-14 bg-zinc-950/80 border-emerald-500/30 text-emerald-400 font-mono text-xl font-black"
                            bind:value={destAmount}
                            oninput={handleDestChange}
                        />
                    </div>
                    <p class="text-[10px] text-zinc-600 italic px-1">
                        {$t("finance.transferDialog.finalAmountHint")}
                    </p>
                </div>
            </div>

            <!-- Other Info -->
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label
                        class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1"
                        >{$t("common.date")}</Label
                    >
                    <Input
                        type="date"
                        class="bg-zinc-950/50 border-zinc-800 h-10"
                        bind:value={date}
                    />
                </div>
                <div class="space-y-2">
                    <Label
                        class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1"
                        >{$t("common.description")}</Label
                    >
                    <Input
                        placeholder={$t("common.optional")}
                        class="bg-zinc-950/50 border-zinc-800 h-10"
                        bind:value={description}
                    />
                </div>
            </div>

            {#if fromAccountId === toAccountId && fromAccountId !== ""}
                <div
                    class="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-center gap-3 text-rose-500 text-xs"
                >
                    <AlertCircle class="w-4 h-4 shrink-0" />
                    {$t("finance.transferDialog.errorDifferentAccounts")}
                </div>
            {/if}
        </div>

        <Dialog.Footer class="p-6 bg-zinc-900 border-t border-zinc-800">
            <Button
                variant="ghost"
                onclick={() => (open = false)}
                class="text-zinc-500">{$t("common.cancel")}</Button
            >
            <Button
                class="px-8 shadow-lg shadow-primary/20"
                onclick={handleSubmit}
                disabled={!fromAccountId ||
                    !toAccountId ||
                    fromAccountId === toAccountId ||
                    sourceAmount <= 0}
            >
                {$t("finance.transferDialog.confirm")}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #27272a;
        border-radius: 10px;
    }
</style>

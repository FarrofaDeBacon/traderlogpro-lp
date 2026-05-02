<script lang="ts">
    import { currenciesStore } from "$lib/stores/currencies.svelte";
    import { accountsStore } from "$lib/stores/accounts.svelte";
    import {
        Plus,
        Pencil,
        Trash2,
        Wallet,
        Building2,
        Hash,
        ChevronRight,
        ChevronDown,
        Search,
        Globe,
        FlaskConical,
    } from "lucide-svelte";
    import { marketsStore } from "$lib/stores/markets.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Root as DialogRoot, Content as DialogContent, Header as DialogHeader, Title as DialogTitle, Description as DialogDescription, Footer as DialogFooter } from "$lib/components/ui/dialog";
    import { SystemCard, SystemSelect, SystemInput, SystemListItem } from "$lib/components/ui/system";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { appStore } from "$lib/stores/app.svelte";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import type { Account } from "$lib/types";
    import { t, locale } from "svelte-i18n";
    import { toast } from "svelte-sonner";
    import { formatCurrency, cn } from "$lib/utils";
    console.log("[ACCOUNTS] formatCurrency is:", typeof formatCurrency);
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
    import { slide } from "svelte/transition";
    import { keyboardList, keyboardForm } from "$lib/actions/keyboard-nav";

    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";

    let isDialogOpen = $state(false);
    let editingId = $state<string | null>(null);
    let searchTerm = $state("");

    // Delete Modal State
    let isDeleteOpen = $state(false);
    let deleteId = $state<string | null>(null);
    let isProcessing = $state(false);

    let expandedGroups = $state<Record<string, boolean>>({
        Real: true,
        Prop: true,
        Demo: true
    });

    function toggleGroup(group: string) {
        expandedGroups[group] = !expandedGroups[group];
    }

    let filteredItems = $derived(
        accountsStore.accounts
            .filter(a => a.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.nickname.localeCompare(b.nickname))
    );

    let groupedAccounts = $derived(
        filteredItems.reduce((acc, account) => {
            const type = account.account_type || $t("common.others");
            if (!acc[type]) acc[type] = [];
            acc[type].push(account);
            return acc;
        }, {} as Record<string, Account[]>)
    );

    const typeOrder = ["Real", "Prop", "Demo"];

    let formData = $state<Omit<Account, "id">>({
        nickname: "",
        account_type: "Real",
        broker: "",
        account_number: "",
        currency: "BRL",
        currency_id: "currency:brl",
        balance: 0,
        custom_logo: null,
        market_id: undefined,
    });

    function resetForm() {
        formData = {
            nickname: "",
            account_type: "Real",
            broker: "",
            account_number: "",
            currency: "BRL",
            currency_id: "currency:brl",
            balance: 0,
            custom_logo: null,
            market_id: undefined,
        };
        editingId = null;
    }

    function openNew() {
        resetForm();
        isDialogOpen = true;
    }

    function openEdit(account: Account) {
        editingId = account.id;
        formData = { ...$state.snapshot(account) };
        isDialogOpen = true;
    }

    async function saveAccount() {
        if (!formData.nickname.trim()) {
            toast.error($t("accounts.form.nicknameRequired"));
            return;
        }

        if (isProcessing) return;
        isProcessing = true;
        try {
            if (editingId) {
                await accountsStore.updateAccount(editingId, formData);
            } else {
                await accountsStore.addAccount(formData);
            }
            toast.success($t("common.saveSuccess"));
            isDialogOpen = false;
        } catch (e) {
            toast.error(String(e));
        } finally {
            isProcessing = false;
        }
    }

    function requestDelete(id: string) {
        deleteId = id;
        isDeleteOpen = true;
    }

    async function confirmDelete() {
        if (deleteId && !isProcessing) {
            isProcessing = true;
            try {
                const result = await accountsStore.deleteAccount(deleteId);
                if (result.success) {
                    toast.success($t("common.deleteSuccess"));
                    isDeleteOpen = false;
            deleteId = null;
                }
            } finally {
                isProcessing = false;
            }
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
                placeholder={$t("accounts.searchPlaceholder")}
                class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80"
            />
        </div>
        <Button 
            onclick={openNew} 
            class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("accounts.new")}
        </Button>
    </div>
{/snippet}

<div class="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0 pt-4">


    <div class="grid gap-10 pt-4" use:keyboardList>
        {#if filteredItems.length === 0}
            <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl">
                <Wallet class="w-20 h-20 opacity-5 animate-pulse mb-8" />
                <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50">{$t("accounts.empty")}</span>
                <Button variant="link" class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors" onclick={openNew}>
                    {searchTerm ? $t("common.clear") : $t("accounts.form.createFirst")}
                </Button>
            </div>
        {:else}
            {#each typeOrder as type}
                {#if groupedAccounts[type] && groupedAccounts[type].length > 0}
                    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <button 
                            type="button" 
                            class="flex items-center gap-3 px-2 group w-full text-left outline-none" 
                            onclick={() => toggleGroup(type)}
                        >
                            <div class={cn(
                                "p-1.5 rounded-xl transition-colors",
                                type === "Real" ? "bg-emerald-500/10 text-emerald-500" :
                                type === "Prop" ? "bg-amber-500/10 text-amber-500" :
                                "bg-blue-500/10 text-blue-500"
                            )}>
                                {#if type === "Prop"}
                                    <Hash class="w-3.5 h-3.5" />
                                {:else}
                                    <Building2 class="w-3.5 h-3.5" />
                                {/if}
                            </div>
                            <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                                {$t(`accounts.types.${type}`) || type}
                            </h4>
                            <div class="h-[1px] flex-1 bg-muted/10 mx-2"></div>
                            {#if expandedGroups[type]}
                                <ChevronDown class="w-4 h-4 text-muted-foreground/40" />
                            {:else}
                                <ChevronRight class="w-4 h-4 text-muted-foreground/40" />
                            {/if}
                        </button>

                        {#if expandedGroups[type]}
                            <div transition:slide={{ duration: 200 }} class="flex flex-col gap-3">
                            {#each groupedAccounts[type] as account}
                                <SystemListItem
                                    title={account.nickname}
                                    subtitle={account.broker}
                                    icon={account.account_type === "Real" ? Building2 : account.account_type === "Prop" ? Hash : FlaskConical}
                                    onclick={() => openEdit(account)}
                                    onEdit={() => openEdit(account)}
                                    onDelete={() => requestDelete(account.id)}
                                >
                                    {#snippet extra()}
                                        <div class="flex items-center gap-8">
                                            {#if account.account_number}
                                                <div class="hidden md:flex flex-col items-end gap-0.5 px-4 h-8 justify-center border-r border-border/40 mr-2">
                                                    <span class="text-[8px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">{$t("accounts.form.number")}</span>
                                                    <span class="font-mono text-xs text-muted-foreground/80 tracking-tight leading-none uppercase">{account.account_number}</span>
                                                </div>
                                            {/if}

                                            <div class="flex flex-col items-end gap-0.5">
                                                <span class="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                                                    {$t("accounts.form.balanceLabel")}
                                                </span>
                                                <span class="font-bold text-lg text-foreground tracking-tighter group-hover:text-primary transition-colors">
                                                    {formatCurrency(
                                                        account.balance,
                                                        account.currency || currenciesStore.resolveById(account.currency_id || "")?.code || "BRL",
                                                        $locale || "pt-BR",
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    {/snippet}
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
    <DialogContent class="sm:max-w-[550px] overflow-visible bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2.5rem] shadow-2xl">
        <div class="px-8 py-6 border-b border-border bg-muted/5 rounded-t-[2.5rem]">
            <DialogHeader class="space-y-1">
                <DialogTitle class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                    <div class="p-2 bg-primary/10 rounded-xl">
                        <Wallet class="w-5 h-5 text-primary" />
                    </div>
                    {editingId
                        ? $t("accounts.form.titleEdit")
                        : $t("accounts.form.titleNew")}
                </DialogTitle>
                <DialogDescription class="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-[44px]">
                    {editingId ? $t("accounts.description") : $t("accounts.description")}
                </DialogDescription>
            </DialogHeader>
        </div>

        <div class="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" use:keyboardForm>
            <SystemInput 
                label={$t("accounts.form.nickname") + "*"}
                bind:value={formData.nickname}
                placeholder={$t("accounts.form.nicknamePlaceholder")}
                class="font-bold tracking-widest"
            />

            <div class="grid grid-cols-2 gap-4">
                <SystemSelect 
                    label={$t("accounts.form.type")}
                    bind:value={formData.account_type}
                    options={[
                        { value: "Real", label: $t("accounts.types.Real") },
                        { value: "Prop", label: $t("accounts.types.Prop") },
                        { value: "Demo", label: $t("accounts.types.Demo") }
                    ]}
                />

                <SystemInput 
                    label={$t("accounts.form.broker")}
                    bind:value={formData.broker}
                    placeholder={$t("accounts.form.brokerPlaceholder")}
                    class="font-bold tracking-widest"
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <SystemInput 
                    label={$t("accounts.form.number")}
                    bind:value={formData.account_number}
                    placeholder={$t("accounts.form.optional")}
                    class="font-bold tracking-widest font-mono"
                />

                <SystemSelect 
                    label={$t("accounts.form.currency")}
                    bind:value={formData.currency_id}
                    onValueChange={(val) => {
                        const resolved = currenciesStore.resolveById(val);
                        if (resolved) formData.currency = resolved.code;
                    }}
                    options={currenciesStore.currencies.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
                />
            </div>

            <Separator class="bg-border opacity-50" />

            <div class="space-y-4">
                <SystemSelect 
                    label={$t("accounts.form.linkMarket")}
                    bind:value={formData.market_id}
                    options={marketsStore.markets.map(m => ({ value: m.id, label: `${m.code} - ${m.name}` }))}
                    placeholder={$t("accounts.form.linkMarketPlaceholder")}
                />
            </div>

            <div class="space-y-2 px-1">
                <span class="text-[11px] uppercase font-extrabold tracking-widest text-muted-foreground/50 block">{$t("accounts.form.openingBalance")}</span>
                <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-primary/80 text-sm font-black group-focus-within:text-primary transition-colors">
                        {currenciesStore.getCurrencySymbol(formData.currency_id || formData.currency)}
                    </span>
                    <input 
                        type="number"
                        bind:value={formData.balance}
                        step="0.01"
                        class="h-10 w-full bg-muted/10 border border-border rounded-xl px-12 text-sm font-bold tracking-tight focus:border-primary/40 outline-none transition-all"
                    />
                </div>
            </div>
        </div>

        <DialogFooter class="px-8 py-6 border-t border-border bg-muted/5 rounded-b-[2.5rem] flex flex-row items-center justify-end gap-3">
            <Button variant="ghost" onclick={() => (isDialogOpen = false)} class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {$t("common.cancel")}
            </Button>
            <Button onclick={saveAccount} disabled={isProcessing} class="rounded-xl px-10 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:scale-105 transition-all shadow-xl shadow-primary/20">
                {#if isProcessing}
                    <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                {/if}
                {$t("accounts.form.save")}
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

import { safeInvoke } from "$lib/services/tauri";
import { getLocalDatePart } from "$lib/utils";
import type {
    FeeProfile, FeeProfileEntry, TaxRule, TaxMapping, TaxProfile, TaxProfileEntry, CashTransaction
} from "$lib/types";
import { accountsStore } from "./accounts.svelte";
import { assetsStore } from "./assets.svelte";

export class FinancialConfigStore {
    fees = $state<FeeProfile[]>([]);
    feeProfileEntries = $state<FeeProfileEntry[]>([]);
    taxRules = $state<TaxRule[]>([]);
    taxMappings = $state<TaxMapping[]>([]);
    taxProfiles = $state<TaxProfile[]>([]);
    taxProfileEntries = $state<TaxProfileEntry[]>([]);
    cashTransactions = $state<CashTransaction[]>([]);

    isLoading = $state(false);

    async loadData() {
        if (this.isLoading) return;
        this.isLoading = true;
        try {
            // Load essential data with individual protection
            const fetch = async <T>(cmd: string, label: string): Promise<T | null> => {
                try {
                    return await safeInvoke<T>(cmd, label);
                } catch (e) {
                    console.warn(`[FinancialConfigStore] Failed to load ${label}:`, e);
                    return null;
                }
            };

            const [
                feesRes,
                feeProfileEntriesRes,
                taxRulesRes,
                taxMappingsRes,
                taxProfilesRes,
                taxProfileEntriesRes,
                transactionsRes
            ] = await Promise.all([
                fetch<FeeProfile[]>("get_fees", "Fees"),
                fetch<FeeProfileEntry[]>("get_fee_profile_entries", "Fee Entries"),
                fetch<TaxRule[]>("get_tax_rules", "Tax Rules"),
                fetch<TaxMapping[]>("get_tax_mappings", "Tax Mappings"),
                fetch<TaxProfile[]>("get_tax_profiles", "Tax Profiles"),
                fetch<TaxProfileEntry[]>("get_tax_profile_entries", "Tax Profile Entries"),
                fetch<CashTransaction[]>("get_cash_transactions", "Cash Transactions")
            ]);

            if (feesRes) this.fees = feesRes;
            if (feeProfileEntriesRes) this.feeProfileEntries = feeProfileEntriesRes;
            if (taxRulesRes) this.taxRules = taxRulesRes;
            if (taxMappingsRes) this.taxMappings = taxMappingsRes;
            if (taxProfilesRes) this.taxProfiles = taxProfilesRes;
            if (taxProfileEntriesRes) this.taxProfileEntries = taxProfileEntriesRes;
            if (transactionsRes) this.cashTransactions = transactionsRes;

        } catch (e) {
            console.error("[FinancialConfigStore] Fatal error in loadData:", e);
        } finally {
            this.isLoading = false;
        }
    }

    // --- Fees ---
    async saveFees() {
        for (const profile of this.fees) {
            try {
                await safeInvoke("save_fee_profile", { profile: $state.snapshot(profile) });
            } catch (e) {
                console.error("[FinancialConfigStore] Error saving fee profile:", e);
            }
        }
    }

    addFeeProfile(item: Omit<FeeProfile, "id">) {
        const id = `fee_profile:${crypto.randomUUID()}`;
        this.fees.push({ ...item, id });
        this.saveFees();
        return id;
    }

    updateFeeProfile(id: string, item: Partial<FeeProfile>) {
        this.fees = this.fees.map(f => f.id === id ? { ...f, ...item } : f);
        this.saveFees();
    }

    async deleteFeeProfile(id: string): Promise<{ success: boolean; error?: string }> {
        if (assetsStore.assets.some(a => a.default_fee_id === id)) return { success: false, error: "Este Perfil de Taxas está sendo usado por Ativos." };
        try {
            await safeInvoke("delete_fee", { id });
            this.fees = this.fees.filter(f => f.id !== id);
            this.feeProfileEntries = this.feeProfileEntries.filter(e => e.fee_profile_id !== id);
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }

    async saveFeeProfileEntry(entry: Omit<FeeProfileEntry, "id"> & { id?: string }) {
        try {
            const id = entry.id || `fee_profile_entry:${crypto.randomUUID()}`;
            const finalEntry = { ...entry, id } as FeeProfileEntry;
            await safeInvoke("save_fee_profile_entry", { entry: $state.snapshot(finalEntry) });
            
            const index = this.feeProfileEntries.findIndex(e => e.id === id);
            if (index >= 0) {
                this.feeProfileEntries[index] = finalEntry;
            } else {
                this.feeProfileEntries.push(finalEntry);
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }

    async deleteFeeProfileEntry(id: string) {
        try {
            await safeInvoke("delete_fee_profile_entry", { id });
            this.feeProfileEntries = this.feeProfileEntries.filter(e => e.id !== id);
        } catch (e) {
            console.error("Failed to delete fee profile entry", e);
        }
    }

    getEntriesForFeeProfile(profileId: string) {
        return this.feeProfileEntries.filter(e => e.fee_profile_id === profileId);
    }

    // --- Tax Rules ---
    async addTaxRule(item: Omit<TaxRule, "id">) {
        const id = `tax_rule:${crypto.randomUUID()}`;
        const rule = { ...item, id };
        await safeInvoke("save_tax_rule", { rule: $state.snapshot(rule) });
        this.taxRules.push(rule);
    }

    async updateTaxRule(id: string, item: Partial<TaxRule>) {
        const rule = this.taxRules.find(r => r.id === id);
        if (rule) {
            const updated = { ...rule, ...item };
            await safeInvoke("save_tax_rule", { rule: $state.snapshot(updated) });
            this.taxRules = this.taxRules.map(r => r.id === id ? updated : r);
        }
    }

    async deleteTaxRule(id: string): Promise<{ success: boolean; error?: string }> {
        const normalize = (val: string) => {
            if (!val) return '';
            const parts = val.split(':');
            const lastPart = parts[parts.length - 1];
            return lastPart.replace(/[⟨⟩`\s]/g, '');
        };
        const cleanId = normalize(id);

        if (this.taxMappings.some(m => normalize(m.tax_rule_id) === cleanId)) return { success: false, error: "Esta regra está sendo usada em Mapeamentos Fiscais." };
        
        // Só bloqueia se a entrada pertencer a um Perfil que REALMENTE existe na lista de Perfis
        const inUseByActiveProfile = this.taxProfileEntries.some(e => {
            if (normalize(e.tax_rule_id) !== cleanId) return false;
            // Verifica se o Perfil Pai (Pai da entrada) ainda existe na store
            return this.taxProfiles.some(p => normalize(p.id) === normalize(e.tax_profile_id));
        });

        if (inUseByActiveProfile) return { success: false, error: "Esta regra está sendo usada em Perfis Tributários ativos." };

        try {
            await safeInvoke("delete_tax_rule", { id });
            this.taxRules = this.taxRules.filter(r => r.id !== id);
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }

    // --- Tax Profiles ---
    async addTaxProfile(item: Omit<TaxProfile, "id">) {
        const id = `tax_profile:${crypto.randomUUID()}`;
        const profile = { ...item, id };
        await safeInvoke("save_tax_profile", { profile: $state.snapshot(profile) });
        this.taxProfiles.push(profile);
        return id;
    }

    async updateTaxProfile(id: string, item: Partial<TaxProfile>) {
        const profile = this.taxProfiles.find(p => p.id === id);
        if (profile) {
            const updated = { ...profile, ...item };
            await safeInvoke("save_tax_profile", { profile: $state.snapshot(updated) });
            this.taxProfiles = this.taxProfiles.map(p => p.id === id ? updated : p);
        }
    }

    async deleteTaxProfile(id: string): Promise<{ success: boolean; error?: string }> {
        // Safety: Check usage
        if (assetsStore.assets.some(a => a.tax_profile_id === id)) {
            return { success: false, error: "Este Perfil Tributário está sendo usado por um ou mais Ativos." };
        }

        const { tradesStore } = await import("./trades.svelte");
        const profileId = id.split(":").pop() || id;
        const isUsedInTrades = tradesStore.trades.some(t => {
            const tpid = typeof t.tax_profile_id === 'object' ? (t.tax_profile_id as any).id || (t.tax_profile_id as any).String : t.tax_profile_id;
            const etpid = typeof t.effective_tax_profile_id === 'object' ? (t.effective_tax_profile_id as any).id || (t.effective_tax_profile_id as any).String : t.effective_tax_profile_id;
            return tpid?.toString().split(":").pop() === profileId || etpid?.toString().split(":").pop() === profileId;
        });

        if (isUsedInTrades) {
            return { success: false, error: "Não é permitido excluir um perfil tributário que possui trades vinculados." };
        }

        try {
            await safeInvoke("delete_tax_profile", { id });
            this.taxProfiles = this.taxProfiles.filter(p => p.id !== id);
            this.taxProfileEntries = this.taxProfileEntries.filter(e => e.tax_profile_id !== id);
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }

    async addTaxProfileEntry(item: Omit<TaxProfileEntry, "id">) {
        const id = `tax_profile_entry:${crypto.randomUUID()}`;
        const entry = { ...item, id };
        await safeInvoke("save_tax_profile_entry", { entry: $state.snapshot(entry) });
        this.taxProfileEntries.push(entry);
    }

    async deleteTaxProfileEntry(id: string) {
        try {
            await safeInvoke("delete_tax_profile_entry", { id });
            this.taxProfileEntries = this.taxProfileEntries.filter(e => e.id !== id);
        } catch (e) {
            console.error("Failed to delete profile entry", e);
        }
    }

    getEntriesForProfile(profileId: string) {
        return this.taxProfileEntries.filter(e => e.tax_profile_id === profileId);
    }

    // --- Tax Mappings ---
    async addTaxMapping(item: Omit<TaxMapping, "id">) {
        const id = `tax_mapping:${crypto.randomUUID()}`;
        const mapping = { ...item, id };
        await safeInvoke("save_tax_mapping", { mapping: $state.snapshot(mapping) });
        this.taxMappings.push(mapping);
    }

    async updateTaxMapping(id: string, item: Partial<TaxMapping>) {
        const mapping = this.taxMappings.find(m => m.id === id);
        if (mapping) {
            const updated = { ...mapping, ...item };
            await safeInvoke("save_tax_mapping", { mapping: $state.snapshot(updated) });
            this.taxMappings = this.taxMappings.map(m => m.id === id ? updated : m);
        }
    }

    async deleteTaxMapping(id: string) {
        try {
            await safeInvoke("delete_tax_mapping", { id });
            this.taxMappings = this.taxMappings.filter(m => m.id !== id);
        } catch (e) {
            console.error("Error deleting tax mapping", e);
        }
    }

    // --- Cash Transactions ---
    async addCashTransaction(item: Omit<CashTransaction, "id"> & { id?: string }) {
        try {
            const id = item.id || crypto.randomUUID();
            const transaction = { ...item, id } as CashTransaction;
            const cleanInputId = id.split(':').pop() || id;
            const isDailyClosure = cleanInputId.startsWith('daily_closure_');
            const searchDate = isDailyClosure ? getLocalDatePart(item.date) : null;

            let existingIndex = -1;
            
            existingIndex = this.cashTransactions.findIndex(t => {
                const cleanTId = t.id.split(':').pop() || t.id;
                if (cleanTId === cleanInputId) return true;

                if (isDailyClosure && t.system_linked && t.id.startsWith('daily_closure_')) {
                    const tDate = getLocalDatePart(t.date);
                    const cleanTAccId = t.account_id.split(':').pop()?.replace(/[⟨⟩`]/g, '').trim() || t.account_id;
                    const cleanItemAccId = item.account_id.split(':').pop()?.replace(/[⟨⟩`]/g, '').trim() || item.account_id;
                    return tDate === searchDate && cleanTAccId === cleanItemAccId;
                }
                return false;
            });
            
            let amountDiff = transaction.amount;

            if (existingIndex >= 0) {
                const existing = this.cashTransactions[existingIndex];
                amountDiff = transaction.amount - existing.amount;

                if (existing.id !== transaction.id) {
                    console.log(`[FinancialConfigStore] Deduplication: Using existing ID ${existing.id} instead of ${transaction.id}`);
                    transaction.id = existing.id;
                }
                this.cashTransactions[existingIndex] = transaction;
            } else {
                this.cashTransactions.push(transaction);
            }

            await safeInvoke("save_cash_transaction", { transaction: $state.snapshot(transaction) });

            const account = accountsStore.accounts.find(a => a.id === item.account_id);
            if (account && amountDiff !== 0) {
                const newBalance = account.balance + amountDiff;
                await accountsStore.updateAccount(account.id, { balance: newBalance });
            }
            return { success: true, id };
        } catch (e: any) {
            console.error("[FinancialConfigStore] Error saving transaction:", e);
            return { success: false, error: e.toString() };
        }
    }

    async removeCashTransaction(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const tx = this.cashTransactions.find(t => t.id === id);
            if (tx) {
                await safeInvoke("delete_cash_transaction", { id });
                this.cashTransactions = this.cashTransactions.filter(t => t.id !== id);
                const account = accountsStore.accounts.find(a => a.id === tx.account_id);
                if (account) {
                    const newBalance = account.balance - tx.amount;
                    await accountsStore.updateAccount(account.id, { balance: newBalance });
                }
            }
            return { success: true };
        } catch (e: any) {
            console.error("[FinancialConfigStore] Error deleting transaction:", e);
            return { success: false, error: e.toString() };
        }
    }

    async transferFunds(options: {
        fromAccountId: string,
        toAccountId: string,
        amountParams: {
            sourceAmount: number,
            fee: number,
            destAmount: number
        },
        date: string,
        description: string
    }) {
        try {
            const { fromAccountId, toAccountId, amountParams, date, description } = options;

            const res1 = await this.addCashTransaction({
                date,
                amount: -amountParams.sourceAmount,
                type: "Withdraw",
                category: "Transfer",
                description: description || "Transferência (Saída)",
                account_id: fromAccountId
            });
            if (!res1.success) throw new Error(res1.error);

            const res2 = await this.addCashTransaction({
                date,
                amount: amountParams.destAmount,
                type: "Deposit",
                category: "Transfer",
                description: description || "Transferência (Entrada)",
                account_id: toAccountId
            });
            if (!res2.success) throw new Error(res2.error);

            if (amountParams.fee > 0) {
                const res3 = await this.addCashTransaction({
                    date,
                    amount: -amountParams.fee,
                    type: "Withdraw",
                    category: "Fee",
                    description: "Taxa de Transferência",
                    account_id: fromAccountId
                });
                if (!res3.success) throw new Error(res3.error);
            }

            return { success: true };
        } catch (error: any) {
            console.error("Transfer failed", error);
            return { success: false, error: error.toString() };
        }
    }

    async loadCashTransactions() {
        try {
            const result = await safeInvoke<CashTransaction[]>("get_cash_transactions", "Cash Transactions Reload");
            if (result) {
                this.cashTransactions = result;
            }
            return { success: true };
        } catch (e) {
            console.error("[FinancialConfigStore] Error reloading cash transactions:", e);
            return { success: false, error: String(e) };
        }
    }
    async hasClosureForDate(date: string, accountId: string): Promise<boolean> {
        const targetDate = getLocalDatePart(date);
        const normalize = (id: string) => id.split(':').pop()?.replace(/[⟨⟩`\s]/g, '') || id;
        const targetAcc = normalize(accountId);

        return this.cashTransactions.some(ct =>
            ct.system_linked &&
            getLocalDatePart(ct.date) === targetDate &&
            normalize(ct.account_id) === targetAcc
        );
    }
}

export const financialConfigStore = new FinancialConfigStore();

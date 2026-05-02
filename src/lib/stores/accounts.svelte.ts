import { safeInvoke } from "$lib/services/tauri";
import { type Account } from "$lib/types";

export class AccountsStore {
    accounts = $state<Account[]>([]);

    async loadAccounts() {
        try {
            this.accounts = await safeInvoke<Account[]>("get_accounts");
        } catch (e) {
            console.error("[AccountsStore] Error loading accounts:", e);
        }
    }

    async saveAccounts() {
        for (const account of this.accounts) {
            try {
                await safeInvoke("save_account", { account: $state.snapshot(account) });
            } catch (e) {
                console.error("[AccountsStore] Error saving account:", e);
            }
        }
    }

    addAccount(item: Omit<Account, "id">) {
        this.accounts.push({ ...item, id: crypto.randomUUID() });
        this.saveAccounts();
    }

    updateAccount(id: string, item: Partial<Account>) {
        this.accounts = this.accounts.map(a => a.id === id ? { ...a, ...item } : a);
        this.saveAccounts();
    }

    async deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
        // Safety: Block if any trade uses this account
        const { tradesStore } = await import("./trades.svelte");
        const accountId = id.includes(":") ? id.split(":").pop() : id;
        
        const isUsed = tradesStore.trades.some(t => {
            const tid = typeof t.account_id === 'object' ? (t.account_id as any).id || (t.account_id as any).String : t.account_id;
            const cid = tid?.toString().split(":").pop();
            return cid === accountId;
        });

        if (isUsed) {
            return { success: false, error: "Não é permitido excluir uma conta que possui trades vinculados." };
        }

        try {
            await safeInvoke("delete_account", { id });
            this.accounts = this.accounts.filter(a => a.id !== id);
            return { success: true };
        } catch (e) {
            const errorMsg = String(e);
            if (errorMsg.includes("used by one or more trades")) {
                const { t } = await import("svelte-i18n");
                const { get } = await import("svelte/store");
                return { success: false, error: get(t)("accounts.errors.inUse") };
            }
            return { success: false, error: errorMsg };
        }
    }

    async deduplicateAccounts() {
        const seenNicks = new Set<string>();
        const toKeep: Account[] = [];
        for (const acc of this.accounts) {
            if (!seenNicks.has(acc.nickname)) {
                seenNicks.add(acc.nickname);
                toKeep.push(acc);
            } else {
                await safeInvoke("delete_account", { id: acc.id }).catch(e => console.error(e));
            }
        }
        this.accounts = toKeep;
    }

    clearAccounts() {
        this.accounts = [];
    }
}

export const accountsStore = new AccountsStore();

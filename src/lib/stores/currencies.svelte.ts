import { safeInvoke } from "$lib/services/tauri";
import type { Currency } from "$lib/types";
import { accountsStore } from "./accounts.svelte";

export class CurrenciesStore {
    currencies = $state<Currency[]>([]);

    async saveCurrencies() {
        for (const currency of this.currencies) {
            try {
                await safeInvoke("save_currency", { currency: $state.snapshot(currency) });
            } catch (e) {
                console.error("[CurrenciesStore] Error saving currency:", e);
            }
        }
    }

    async syncExchangeRates(customApiUrl?: string | null) {
        const existingCodes = this.currencies.map(c => c.code.toUpperCase()).filter(code => code !== "BRL");
        if (existingCodes.length === 0) return;
        const pairs = existingCodes.map(code => `${code}-BRL`).join(",");
        const baseUrl = customApiUrl || "https://economia.awesomeapi.com.br/last/";
        const url = `${baseUrl}${pairs}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const data = await response.json();
            let updatedCount = 0;
            this.currencies = this.currencies.map(currency => {
                const code = currency.code.toUpperCase();
                const pairKey = `${code}BRL`;
                if (data[pairKey]) {
                    updatedCount++;
                    return { ...currency, exchange_rate: parseFloat(data[pairKey].bid) };
                }
                return currency;
            });
            if (updatedCount > 0) {
                await this.saveCurrencies();
                return { success: true, count: updatedCount };
            }
        } catch (error) {
            console.error("[CurrenciesStore] Failed to sync exchange rates:", error);
            return { success: false, error: String(error) };
        }
    }

    addCurrency(item: Omit<Currency, "id">) {
        this.currencies.push({ ...item, id: crypto.randomUUID() });
        this.saveCurrencies();
    }

    updateCurrency(id: string, item: Partial<Currency>) {
        this.currencies = this.currencies.map(c => c.id === id ? { ...c, ...item } : c);
        this.saveCurrencies();
    }

    async deleteCurrency(id: string): Promise<{ success: boolean; error?: string }> {
        console.log(`[CurrenciesStore] Attempting to delete currency: ${id}`);
        
        // Validation: Block if any account uses this currency
        const cleanId = id.includes(':') ? id.split(':').pop() : id;
        
        const isUsed = accountsStore.accounts.some(acc => {
            // Handle both string IDs and RecordID objects from SurrealDB
            const accCurrencyId = typeof acc.currency_id === 'object' 
                ? (acc.currency_id as any).id || (acc.currency_id as any).String 
                : acc.currency_id;
            
            if (!accCurrencyId) return false;
            
            const cleanAccCurrencyId = accCurrencyId.toString().split(':').pop();
            return cleanAccCurrencyId === cleanId;
        });

        if (isUsed) {
            console.warn(`[CurrenciesStore] Deletion blocked: Currency ${id} is in use.`);
            const { t } = await import("svelte-i18n");
            const { get } = await import("svelte/store");
            const translate = get(t);
            return { success: false, error: translate("currencies.errors.inUse") };
        }

        try {
            // Use safeInvoke to ensure argument sanitization
            await safeInvoke("delete_currency", { id: $state.snapshot(id) });
            this.currencies = this.currencies.filter(c => c.id !== id);
            console.log(`[CurrenciesStore] Currency ${id} deleted successfully.`);
            return { success: true };
        } catch (e) {
            console.error(`[CurrenciesStore] Error deleting currency ${id}:`, e);
            return { success: false, error: String(e) };
        }
    }

    getCurrencySymbol(idOrCode: string): string {
        const currency = this.resolveById(idOrCode) || this.resolveByCode(idOrCode);
        return currency?.symbol || "R$";
    }

    resolveById(id: string): Currency | undefined {
        if (!id) return undefined;
        // Normalize id for lookup (handle both raw 'brl' and 'currency:brl')
        const cleanId = id.includes(':') ? id : `currency:${id.toLowerCase()}`;
        return this.currencies.find(c => c.id === cleanId);
    }

    resolveByCode(code: string): Currency | undefined {
        if (!code) return undefined;
        const searchCode = code.toUpperCase();
        return this.currencies.find(c => c.code.toUpperCase() === searchCode);
    }

    clearCurrencies() {
        this.currencies = [];
    }
}

export const currenciesStore = new CurrenciesStore();

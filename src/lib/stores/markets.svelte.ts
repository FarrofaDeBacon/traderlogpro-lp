import { invoke } from "@tauri-apps/api/core";
import type { Market } from "$lib/types";

export class MarketsStore {
    markets = $state<Market[]>([]);

    async saveMarkets() {
        for (const market of this.markets) {
            try {
                await invoke("save_market", { market: $state.snapshot(market) });
            } catch (e) {
                console.error("[MarketsStore] Error saving market:", e);
            }
        }
    }

    addMarket(item: Omit<Market, "id">) {
        this.markets.push({ ...item, id: `market:${crypto.randomUUID()}` });
        this.saveMarkets();
    }

    updateMarket(id: string, item: Partial<Market>) {
        this.markets = this.markets.map(m => m.id === id ? { ...m, ...item } : m);
        this.saveMarkets();
    }

    async deleteMarket(id: string): Promise<{ success: boolean; error?: string }> {
        // Dynamic import to prevent circular dependency
        const { assetTypesStore } = await import("./asset-types.svelte");
        
        // Validation: Block if any asset type uses this market
        const cleanId = id.includes(':') ? id.split(':').pop() : id;
        const isUsed = assetTypesStore.assetTypes.some(at => {
            const atMarketId = typeof at.market_id === 'object' 
                ? (at.market_id as any).id || (at.market_id as any).String 
                : at.market_id;
            
            if (!atMarketId) return false;
            const cleanAtMarketId = atMarketId.toString().split(':').pop();
            return cleanAtMarketId === cleanId;
        });

        if (isUsed) {
            const { t } = await import("svelte-i18n");
            const { get } = await import("svelte/store");
            const translate = get(t);
            return { success: false, error: translate("markets.errors.inUse") };
        }

        try {
            await invoke("delete_market", { id });
            this.markets = this.markets.filter(m => m.id !== id);
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }

    clearMarkets() {
        this.markets = [];
    }

    getMarketName(id: string): string {
        const item = this.markets.find(m => m.id === id);
        return item ? item.code : "N/A";
    }
}

export const marketsStore = new MarketsStore();

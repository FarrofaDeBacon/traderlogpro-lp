import { safeInvoke } from "$lib/services/tauri";
import type { Asset, AssetType, Strategy } from "$lib/types";

export class AssetsStore {
    assets = $state<Asset[]>([]);

    async loadAssets(): Promise<void> {
        try {
            const assetsRes = await safeInvoke<Asset[]>("get_assets", "Assets") || [];
            if (assetsRes) {
                this.assets = assetsRes.map(a => ({
                    ...a,
                    tax_profile_id: a.tax_profile_id ?? undefined,
                    root_id: a.root_id ?? undefined
                }));
            }
        } catch (e) {
            console.error("[AssetsStore] ERROR loading Assets:", e);
        }
    }

    async saveAssets() {
        console.log(`[AssetsStore] saveAssets: Saving ${this.assets.length} assets in bulk...`);
        try {
            await safeInvoke("save_assets", { assets: $state.snapshot(this.assets) });
            console.log(`[AssetsStore] saveAssets bulk complete.`);
        } catch (e) {
            console.error(`[AssetsStore] FATAL Error saving assets in bulk:`, e);
            // Fallback to individual save only if bulk fails (resilience)
            for (const asset of this.assets) {
                try {
                    await safeInvoke("save_asset", { asset: $state.snapshot(asset) });
                } catch (err) {
                    console.error(`[AssetsStore] Fallback save failed for ${asset.symbol}:`, err);
                }
            }
        }
    }

    async addAsset(item: Omit<Asset, "id">, autoSave: boolean = true) {
        this.assets.push({ 
            ...item, 
            id: crypto.randomUUID(),
            is_root: item.is_root ?? false,
            root_id: item.root_id === "" || item.root_id === "none" ? undefined : item.root_id,
            tax_profile_id: item.tax_profile_id === "" ? undefined : item.tax_profile_id,
            default_fee_id: item.default_fee_id === "" ? undefined : item.default_fee_id
        });
        if (autoSave) await this.saveAssets();
    }

    updateAsset(id: string, item: Partial<Asset>) {
        const cleanItem = { ...item };
        if (cleanItem.root_id === "" || cleanItem.root_id === "none") cleanItem.root_id = undefined;
        if (cleanItem.tax_profile_id === "") cleanItem.tax_profile_id = undefined;
        if (cleanItem.default_fee_id === "") cleanItem.default_fee_id = undefined;

        this.assets = this.assets.map(a => a.id === id ? { ...a, ...cleanItem } : a);
        this.saveAssets();
    }

    async bulkUpdateAssetType(ids: string[], typeId: string) {
        this.assets = this.assets.map(a => 
            ids.includes(a.id) ? { ...a, asset_type_id: typeId } : a
        );
        await this.saveAssets();
    }

    async bulkUpdateSector(ids: string[], sectorId: string) {
        this.assets = this.assets.map(a => 
            ids.includes(a.id) ? { ...a, sector_id: sectorId } : a
        );
        await this.saveAssets();
    }

    clearAssets() {
        this.assets = [];
    }

    async deleteAsset(id: string): Promise<{ success: boolean; error?: string }> {
        console.log(`[AssetsStore] Attempting to delete asset: ${id}`);
        const asset = this.assets.find(a => a.id === id);
        if (!asset) {
            console.warn(`[AssetsStore] Asset not found in store: ${id}`);
            return { success: false, error: "assets.errors.notFound" };
        }
        
        const assetId = id.split(":").pop() || id;
        console.log(`[AssetsStore] Clean ID for comparison: ${assetId}, Symbol: ${asset.symbol}`);

        // 1. Check Strategies (workspaceStore)
        const { workspaceStore } = await import("./workspace.svelte");
        const usedInStrategy = workspaceStore.strategies.some(s => s.specific_assets.includes(asset.symbol));
        if (usedInStrategy) {
            console.error(`[AssetsStore] Delete BLOCKED: Asset ${asset.symbol} is used in a Strategy.`);
            return { success: false, error: "assets.errors.usedInStrategy" };
        }

        // 2. Check Trades
        const { tradesStore } = await import("./trades.svelte");
        const isUsedInTrades = tradesStore.trades.some(t => {
            const aid = typeof t.asset_id === 'object' ? (t.asset_id as any).id || (t.asset_id as any).String : t.asset_id;
            const cleanAid = aid?.toString().split(":").pop();
            return cleanAid === assetId;
        });
        if (isUsedInTrades) {
            console.error(`[AssetsStore] Delete BLOCKED: Asset ${asset.symbol} has associated trades.`);
            return { success: false, error: "assets.errors.usedInTrades" };
        }

        // 3. Check Risk Profiles (Escopos de Risco)
        const { riskSettingsStore } = await import("./risk-settings.svelte");
        const isUsedInRisk = riskSettingsStore.assetRiskProfiles.some(p => 
            (p.asset_ids || []).some(aid => aid.split(":").pop() === assetId)
        );
        if (isUsedInRisk) {
            console.error(`[AssetsStore] Delete BLOCKED: Asset ${asset.symbol} is linked to a Risk Profile.`);
            return { success: false, error: "assets.errors.usedInRisk" };
        }

        // 4. Check Child Assets (if this is a root)
        if (asset.is_root) {
            const hasChildren = this.assets.some(a => a.root_id === asset.id);
            if (hasChildren) {
                console.error(`[AssetsStore] Delete BLOCKED: Root asset ${asset.symbol} has child assets.`);
                return { success: false, error: "assets.errors.hasChildren" };
            }
        }

        console.log(`[AssetsStore] All integrity checks passed. Invoking backend delete for: ${id}`);

        try {
            await safeInvoke("delete_asset", { id });
            this.assets = this.assets.filter(a => a.id !== id);
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }

    async bulkDeleteAssets(ids: string[]): Promise<{ deleted: number; skipped: number; errors: string[] }> {
        let deleted = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const id of ids) {
            const asset = this.assets.find(a => a.id === id);
            const result = await this.deleteAsset(id);
            if (result.success) {
                deleted++;
            } else {
                skipped++;
                if (result.error) {
                    errors.push(`${asset?.symbol || id}: ${result.error}`);
                }
            }
        }

        return { deleted, skipped, errors };
    }

    private discoveryCache = new Set<string>();

    async ensureAssetExists(symbol: string, forceTypeId: string | undefined, assetTypes: AssetType[], sheetContext?: string) {
        if (!symbol) return;
        const sym = symbol.toUpperCase().trim();
        
        // --- BLOCK PHANTOM ASSETS ---
        // Never auto-create generic symbols that don't represent a specific contract or stock
        const genericSymbols = ["WIN", "WDO", "WINFUT", "WDOFUT", "IND", "DOL", "BIT"];
        if (genericSymbols.includes(sym)) {
            console.warn(`[AssetsStore] Blocking auto-creation of generic phantom asset: ${sym}`);
            return;
        }

        // Local cache check to prevent concurrent duplicate adds
        if (this.discoveryCache.has(sym)) return;

        const existing = this.assets.find(a => a.symbol === sym);
        if (existing) {
            if (forceTypeId && existing.asset_type_id !== forceTypeId) {
                await this.updateAsset(existing.id, { asset_type_id: forceTypeId });
            }
            return;
        }

        this.discoveryCache.add(sym);

        try {
            let typeId = forceTypeId || "";
            let name = sym;

            // Context-based type detection (ABA do Profit)
            const context = (sheetContext || "").toUpperCase();
            const isFutureContext = context.includes("WIN") || context.includes("DOL") || context.includes("FUT") || context.includes("IND") || context.includes("B3");

            if (isFutureContext || sym.startsWith("WIN") || sym.startsWith("WDO") || sym.startsWith("IND") || sym.startsWith("DOL") || sym.startsWith("BIT")) {
                const type = assetTypes.find(at => at.name.toLowerCase().includes("futuro") || at.code.toLowerCase().includes("index") || at.name.toLowerCase().includes("índice"));
                typeId = type?.id || assetTypes[0]?.id || "";
                name = sym.startsWith("WIN") ? "Mini Index" :
                    sym.startsWith("WDO") ? "Mini Dollar" :
                        sym.startsWith("IND") ? "Bovespa Index" :
                            sym.startsWith("DOL") ? "Full Dollar" :
                                sym.startsWith("BIT") ? "Mini Bitcoin" : sym;
            } else if (sym.length === 6 && !sym.match(/\d/)) {
                const type = assetTypes.find(at => at.name.toLowerCase().includes("forex") || at.code.toLowerCase().includes("fx"));
                typeId = type?.id || assetTypes[0]?.id || "";
            } else if (sym.length >= 5 && (sym.endsWith("11") || sym.endsWith("3") || sym.endsWith("4") || sym.endsWith("5") || sym.endsWith("6"))) {
                const type = assetTypes.find(at => at.name.toLowerCase().includes("stock") || at.name.toLowerCase().includes("ação") || at.code.toLowerCase().includes("stk"));
                typeId = type?.id || assetTypes[0]?.id || "";
            } else {
                typeId = assetTypes[0]?.id || "";
            }

            let pv = 1.0;
            if (sym.startsWith("WDO") || sym.startsWith("DOL")) pv = 10.0;
            else if (sym.startsWith("WIN") || sym.startsWith("IND")) pv = 0.20;
            else if (sym.startsWith("BIT")) pv = 0.1;

            // Auto-link to root if possible
            let rootId: string | null = null;
            if (sym.length >= 3) {
                const prefix = sym.substring(0, 3);
                const root = this.assets.find(a => a.is_root && a.symbol === prefix);
                if (root) rootId = root.id;
            }

            await this.addAsset({
                symbol: sym,
                name: `${name} (Auto)`,
                asset_type_id: typeId,
                point_value: pv,
                default_fee_id: "",
                is_root: false,
                root_id: rootId ?? undefined
            });
        } finally {
            // Stay in cache for 10s to prevent rapid re-triggering while store reloads
            setTimeout(() => this.discoveryCache.delete(sym), 10000);
        }
    }
}

export const assetsStore = new AssetsStore();

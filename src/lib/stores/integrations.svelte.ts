import { invoke } from "@tauri-apps/api/core";
import { userProfileStore } from "./user-profile.svelte";

import type { ApiConfig } from "$lib/types";

class IntegrationsStore {
    apiConfigs = $state<ApiConfig[]>([]);
    psychologyApiId = $state<string>("none");
    marketDataApiId = $state<string>("none");

    constructor() {
        // No longer using localStorage for RTD path, we use userProfileStore
    }

    get rtdExcelPath() {
        return userProfileStore.userProfile.rtd_excel_path || "";
    }

    set rtdExcelPath(value: string) {
        userProfileStore.updateUserProfile({ rtd_excel_path: value });
    }

    get rtdEnabled() {
        return userProfileStore.userProfile.rtd_auto_start || false;
    }

    set rtdEnabled(value: boolean) {
        userProfileStore.updateUserProfile({ rtd_auto_start: value });
        if (typeof window !== "undefined") {
            localStorage.setItem("rtd_enabled", value ? "true" : "false");
        }
    }

    async loadData() {
        try {
            console.log("[IntegrationsStore] Loading data...");
            const apiConfigsRes = await invoke<ApiConfig[]>("get_api_configs").catch(() => null);
            if (apiConfigsRes) this.apiConfigs = apiConfigsRes;

            // Sync bindings from userProfileStore
            if (userProfileStore.userProfile.psychology_api_id) {
                this.psychologyApiId = userProfileStore.userProfile.psychology_api_id;
            }
            if (userProfileStore.userProfile.market_data_api_id) {
                this.marketDataApiId = userProfileStore.userProfile.market_data_api_id;
            }

            if (this.rtdEnabled) {
                console.log("[IntegrationsStore] Auto-starting RTD Monitor with path:", this.rtdExcelPath);
                invoke("start_rtd_monitor_cmd", { excelPath: this.rtdExcelPath || null }).catch(e => console.error(e));
            }

            console.log("[IntegrationsStore] Data loaded.");
        } catch (e) {
            console.error("[IntegrationsStore] ERROR loading integrations data:", e);
        }
    }

    addApiConfig(item: Omit<ApiConfig, "id">) {
        this.apiConfigs.push({ ...item, id: crypto.randomUUID() });
        this.saveApiConfigs();
    }
    updateApiConfig(id: string, item: Partial<ApiConfig>) {
        this.apiConfigs = this.apiConfigs.map(a => a.id === id ? { ...a, ...item } : a);
        this.saveApiConfigs();
    }
    async deleteApiConfig(id: string): Promise<{ success: boolean; error?: string }> {
        await invoke("delete_api_config", { id });
        this.apiConfigs = this.apiConfigs.filter(a => a.id !== id);
        return { success: true };
    }
    private async saveApiConfigs() {
        for (const config of this.apiConfigs) {
            try {
                await invoke("save_api_config", { config: $state.snapshot(config) });
            } catch (e) {
                console.error("[IntegrationsStore] Error saving api config:", e);
            }
        }
    }

    bindServiceApi(serviceData: { psychology: string, market_data: string }) {
        this.psychologyApiId = serviceData.psychology;
        this.marketDataApiId = serviceData.market_data;
        
        // Persist to userProfileStore (which saves to backend)
        userProfileStore.updateUserProfile({
            psychology_api_id: serviceData.psychology,
            market_data_api_id: serviceData.market_data
        });

        if (typeof window !== "undefined") {
            localStorage.setItem("service_api_bindings", JSON.stringify(serviceData));
        }
    }
}

export const integrationsStore = new IntegrationsStore();

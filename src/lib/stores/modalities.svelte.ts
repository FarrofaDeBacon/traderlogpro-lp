import { invoke } from "@tauri-apps/api/core";
import type { Modality } from "$lib/types";

export class ModalitiesStore {
    modalities = $state<Modality[]>([]);

    async saveModalities() {
        for (const modality of this.modalities) {
            try {
                await invoke("save_modality", { modality: $state.snapshot(modality) });
            } catch (e) {
                console.error("[ModalitiesStore] Error saving modality:", e);
            }
        }
    }

    addModality(item: Omit<Modality, "id">) {
        this.modalities.push({ ...item, id: crypto.randomUUID() });
        this.saveModalities();
    }

    updateModality(id: string, item: Partial<Modality>) {
        this.modalities = this.modalities.map(m => m.id === id ? { ...m, ...item } : m);
        this.saveModalities();
    }

    async deleteModality(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            await invoke("delete_modality", { id });
            this.modalities = this.modalities.filter(m => m.id !== id);
            return { success: true };
        } catch (e) {
            const errorMsg = String(e);
            if (errorMsg.includes("used by one or more trades") || errorMsg.includes("used in tax configurations")) {
                const { t } = await import("svelte-i18n");
                const { get } = await import("svelte/store");
                return { success: false, error: get(t)("modalities.errors.inUse") };
            }
            return { success: false, error: errorMsg };
        }
    }

    clearModalities() {
        this.modalities = [];
    }
}

export const modalitiesStore = new ModalitiesStore();

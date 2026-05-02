import { invoke } from '@tauri-apps/api/core';
import type { RiskProfile } from '$lib/types';

export class RiskProfileStore {
    profiles = $state<RiskProfile[]>([]);
    isLoading = $state(false);
    error = $state<string | null>(null);

    constructor() {
        this.loadProfiles();
    }

    /**
     * Carrega todos os perfis de risco essenciais do back-end.
     */
    async loadProfiles() {
        this.isLoading = true;
        this.error = null;
        try {
            this.profiles = await invoke<RiskProfile[]>('get_risk_profiles');
        } catch (e: any) {
            console.error('Falha ao carregar perfis de risco', e);
            this.error = e.toString();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Salva (cria ou atualiza) um perfil de risco.
     */
    async saveProfile(profile: RiskProfile) {
        this.isLoading = true;
        this.error = null;
        try {
            const id = await invoke<string>('save_risk_profile', { profile });
            await this.loadProfiles();
            return id;
        } catch (e: any) {
            console.error('Falha ao salvar perfil de risco', e);
            this.error = e.toString();
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Deleta um perfil de risco.
     */
    async deleteProfile(id: string) {
        this.isLoading = true;
        this.error = null;
        try {
            await invoke('delete_risk_profile', { id });
            await this.loadProfiles();
        } catch (e: any) {
            console.error('Falha ao deletar perfil de risco', e);
            this.error = e.toString();
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Helper para buscar perfil ativo por conta.
     */
    getProfileByAccount(accountId: string): RiskProfile | undefined {
        return this.profiles.find(p => p.active && p.account_ids.includes(accountId));
    }
}

// Instância singleton global
export const riskProfileStore = new RiskProfileStore();

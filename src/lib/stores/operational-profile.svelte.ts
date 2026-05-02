import { invoke } from '@tauri-apps/api/core';
import type { OperationalProfile } from '$lib/types';

export class OperationalProfileStore {
    profiles = $state<OperationalProfile[]>([]);
    isLoading = $state(false);
    error = $state<string | null>(null);

    constructor() {
        this.loadProfiles();
    }

    /**
     * Carrega todos os perfis operacionais do back-end.
     */
    async loadProfiles() {
        this.isLoading = true;
        this.error = null;
        try {
            this.profiles = await invoke<OperationalProfile[]>('get_operational_profiles');
        } catch (e: any) {
            console.error('Falha ao carregar perfis operacionais', e);
            this.error = e.toString();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Salva (cria ou atualiza) um perfil operacional.
     */
    async saveProfile(profile: OperationalProfile) {
        this.isLoading = true;
        this.error = null;
        try {
            const id = await invoke<string>('save_operational_profile', { profile });
            await this.loadProfiles();
            return id;
        } catch (e: any) {
            console.error('Falha ao salvar perfil operacional', e);
            this.error = e.toString();
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Deleta um perfil operacional.
     */
    async deleteProfile(id: string) {
        this.isLoading = true;
        this.error = null;
        try {
            await invoke('delete_operational_profile', { id });
            await this.loadProfiles();
        } catch (e: any) {
            console.error('Falha ao deletar perfil operacional', e);
            this.error = e.toString();
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Executa a migração assistida do sistema de risco antigo para o novo formato de Perfis Operacionais.
     * Deve retornar a contagem de perfis migrados, de forma assíncrona.
     */
    async runMigration() {
        this.isLoading = true;
        this.error = null;
        try {
            const count: number = await invoke('migrate_legacy_risk_to_operational');
            await this.loadProfiles();
            return count;
        } catch (e: any) {
            console.error('Falha durante a migração assistida', e);
            this.error = e.toString();
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    // ==========================================
    // HELPERS & NORMALIZE (Derivados / Queries)
    // ==========================================

    /**
     * Busca o Perfil Operacional ativo vinculado a uma determinada conta.
     * Note: Pelo novo domínio, preferencialmente teremos apenas um perfil ATIVO por conta.
     */
    getProfileByAccount(accountId: string): OperationalProfile | undefined {
        return this.profiles.find(p => p.active && p.account_ids.includes(accountId));
    }

    /**
     * Retorna todos os perfis migrados que possuem pendências operacionais ativando o gatilho da UI
     * para marcações assistidas usando metadata.requires_account_binding ou rules com needs_review.
     */
    getProfilesNeedingReview(): OperationalProfile[] {
        return this.profiles.filter(p => 
            p.metadata?.requires_account_binding === true || 
            p.rules.some(r => r.needs_review)
        );
    }
}

// Instância singleton global do store (padrão Svelte 5 Runes)
export const operationalProfileStore = new OperationalProfileStore();

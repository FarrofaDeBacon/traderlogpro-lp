<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { riskProfileStore } from "$lib/stores/risk-profile.svelte";
    import { accountsStore } from "$lib/stores/accounts.svelte";
    import { assetsStore } from "$lib/stores/assets.svelte";
    import { goto } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import { t } from "svelte-i18n";

    import { ShieldCheck, ArrowLeft, Save, Trash2, Database, Link as LinkIcon, Gauge, Lock, FileText, Plus, Zap, AlertCircle, X, Edit3, CheckCircle2 } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Switch } from "$lib/components/ui/switch";
    import { Label } from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import SystemInput from "$lib/components/ui/system/SystemInput.svelte";
    import type { AssetRiskOverride } from "$lib/types";

    // Reatividade do Formulário (Svelte 5 Runes)
    let profileId = $derived(decodeURIComponent($page.params.id));
    let isNew = $derived(profileId === "new");

    let name = $state("");
    let description = $state("");
    let active = $state(true);
    let account_ids = $state<string[]>([]);
    
    // Limits
    let daily_loss_limit = $state(0);
    let profit_target = $state(0);
    let max_exposure = $state(0);
    let order_limit = $state(0);

    // Blocking
    let block_on_daily_loss = $state(false);
    let block_on_order_limit = $state(false);
    let asset_overrides = $state<AssetRiskOverride[]>([]);

    // Modal State
    let isOverrideModalOpen = $state(false);
    let editingOverrideIndex = $state<number | null>(null);
    let modalData = $state<AssetRiskOverride>({
        asset_ids: [],
        min_lots: 1,
        max_lots: 1,
        default_stop_points: 100,
        observations: ""
    });

    let observations = $state("");

    let isSaving = $state(false);
    let isDeleting = $state(false);

    onMount(async () => {
        await accountsStore.loadAccounts();
        await assetsStore.loadAssets();
        
        if (!isNew) {
            if (riskProfileStore.profiles.length === 0) {
                await riskProfileStore.loadProfiles();
            }

            const existing = riskProfileStore.profiles.find(p => p.id === profileId);
            if (existing) {
                name = existing.name;
                description = existing.description || "";
                active = existing.active;
                account_ids = [...existing.account_ids];
                daily_loss_limit = existing.daily_loss_limit;
                profit_target = existing.profit_target;
                max_exposure = existing.max_exposure;
                order_limit = existing.order_limit;
                block_on_daily_loss = existing.block_on_daily_loss;
                block_on_order_limit = existing.block_on_order_limit;
                asset_overrides = existing.asset_overrides ? JSON.parse(JSON.stringify(existing.asset_overrides)) : [];
                observations = existing.observations || "";
            } else {
                toast.error($t("risk.messages.profileNotFound"));
                goto("/settings/risk");
            }
        }
    });

    function openOverrideModal(index: number | null = null) {
        if (index !== null) {
            editingOverrideIndex = index;
            modalData = JSON.parse(JSON.stringify(asset_overrides[index]));
        } else {
            editingOverrideIndex = null;
            modalData = {
                asset_ids: [],
                min_lots: 1,
                max_lots: 1,
                default_stop_points: 100,
                observations: ""
            };
        }
        isOverrideModalOpen = true;
    }

    function saveOverride() {
        if (modalData.asset_ids.length === 0) {
            toast.error($t("risk.form.messages.selectAssetOrType"));
            return;
        }

        if (editingOverrideIndex !== null) {
            asset_overrides[editingOverrideIndex] = { ...modalData };
        } else {
            asset_overrides = [...asset_overrides, { ...modalData }];
        }
        isOverrideModalOpen = false;
    }

    function removeOverride(index: number) {
        asset_overrides = asset_overrides.filter((_, i) => i !== index);
    }

    function toggleAssetInModal(assetId: string) {
        if (modalData.asset_ids.includes(assetId)) {
            modalData.asset_ids = modalData.asset_ids.filter(id => id !== assetId);
        } else {
            modalData.asset_ids = [...modalData.asset_ids, assetId];
        }
    }

    function toggleAccount(id: string) {
        if (account_ids.includes(id)) {
            account_ids = account_ids.filter(accId => accId !== id);
        } else {
            account_ids = [...account_ids, id];
        }
    }

    async function handleSave() {
        if (!name.trim()) {
            toast.error($t("risk.form.messages.profileNameRequired"));
            return;
        }

        isSaving = true;
        try {
            const profileToSave = {
                id: isNew ? "new" : profileId,
                name,
                description,
                active,
                account_ids,
                daily_loss_limit,
                profit_target,
                max_exposure,
                order_limit,
                block_on_daily_loss,
                block_on_order_limit,
                asset_overrides: JSON.parse(JSON.stringify(asset_overrides)),
                observations
            };

            await riskProfileStore.saveProfile(profileToSave);
            toast.success($t("risk.messages.saveSuccess"));
            goto("/settings/risk");
        } catch (error) {
            toast.error($t("risk.messages.saveError"));
        } finally {
            isSaving = false;
        }
    }

    async function deleteProfile() {
        if (isNew) return;
        isDeleting = true;
        try {
            await riskProfileStore.deleteProfile(profileId);
            toast.success($t("risk.messages.deleteSuccess"));
            goto("/settings/risk");
        } catch (error) {
            toast.error($t("risk.messages.deleteError"));
        } finally {
            isDeleting = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-10">
    
    <!-- TOP ACTIONS BAR -->
    <div class="flex items-center justify-between">
        <Button variant="ghost" class="text-muted-foreground hover:text-white rounded-xl h-10 px-4" onclick={() => goto("/settings/risk")}>
            <ArrowLeft class="w-4 h-4 mr-2" />
            {$t('risk.actions.cancel')}
        </Button>

        {#if !isNew}
            <Button 
                variant="ghost" 
                onclick={deleteProfile}
                disabled={isDeleting || isSaving}
                class="text-rose-500 hover:bg-rose-500/10 rounded-xl h-10 px-4 transition-colors"
            >
                <Trash2 class="w-4 h-4 mr-2" />
                {isDeleting ? $t("common.deleting") : $t("common.delete")}
            </Button>
        {/if}
    </div>

    <!-- SECTION 1: IDENTIDADE -->
    <div class="bg-black/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] space-y-10 shadow-2xl relative overflow-hidden group">
        <!-- Subtle gradient glow -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/15 transition-all duration-700"></div>
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div class="space-y-2">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <ShieldCheck class="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h1 class="text-3xl font-black uppercase tracking-tighter leading-none text-foreground">
                            {name || $t('risk.plan.new')}
                        </h1>
                        <p class="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.4em] mt-1">{$t("risk.form.institutionalRiskManagement")}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-3 rounded-xl self-start md:self-center transition-all hover:bg-white/10">
                <div class="w-2.5 h-2.5 rounded-full {active ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-muted-foreground/30'} animate-pulse"></div>
                <span class="text-[11px] font-black uppercase tracking-[0.2em] {active ? 'text-emerald-400' : 'text-muted-foreground/40'}">
                    {active ? $t("common.yes") : $t("common.no")}
                </span>
                <Separator orientation="vertical" class="h-4 bg-white/10" />
                <Switch bind:checked={active} class="data-[state=checked]:bg-emerald-500" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <SystemInput 
                label={$t('risk.plan.name')} 
                bind:value={name} 
                placeholder={$t('risk.plan.namePlaceholder')}
                class="h-12 bg-white/5 border-white/5 rounded-xl px-6 focus-visible:border-emerald-500/40"
            />
            <SystemInput 
                label={$t('risk.form.description')} 
                bind:value={description} 
                placeholder={$t('risk.form.descriptionPlaceholder')}
                class="h-12 bg-white/5 border-white/5 rounded-xl px-6 focus-visible:border-emerald-500/40"
            />
        </div>
    </div>

    <!-- SINGLE PAGE CONTENT (BLOCK-BASED) -->
    <div class="space-y-6 pb-20">
        
    <!-- SECTION 2: CONTAS VINCULADAS -->
    <div class="bg-black/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-xl">
        <div class="flex items-center justify-between border-b border-white/5 pb-6">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <LinkIcon class="w-5 h-5 text-emerald-500/60" />
                </div>
                <div>
                    <h2 class="text-[12px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.linkedAccounts")}</h2>
                    <p class="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">{$t("risk.form.linkedAccountsDesc")}</p>
                </div>
            </div>
        </div>

        <div class="flex flex-wrap gap-4 p-1">
            {#each accountsStore.accounts as acc}
                <button 
                    class="h-12 px-8 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 {account_ids.includes(acc.id) ? 'bg-emerald-500 text-black border-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-white/5 border-white/5 text-muted-foreground/60 hover:bg-white/10 hover:text-white'}"
                    onclick={() => toggleAccount(acc.id)}
                >
                    {acc.name}
                </button>
            {:else}
                <div class="py-6 flex items-center justify-center w-full border-2 border-dashed border-white/5 rounded-[2rem] bg-black/20">
                    <p class="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.3em] italic">{$t("settings.accounts.noAccounts")}</p>
                </div>
            {/each}
        </div>
    </div>

    <!-- SECTION 3: LIMITES FINANCEIROS -->
    <div class="bg-black/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] space-y-10 shadow-xl">
        <div class="flex items-center gap-4 border-b border-white/5 pb-6">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Gauge class="w-5 h-5 text-emerald-500/60" />
            </div>
            <div>
                <h2 class="text-[12px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.globalFinancialLimits")}</h2>
                <p class="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">{$t("risk.form.globalFinancialLimitsDesc")}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div class="space-y-3">
                <SystemInput 
                    label={$t("risk.form.dailyLoss")} 
                    type="number" 
                    bind:value={daily_loss_limit} 
                    class="h-12 bg-white/5 border-white/5 rounded-xl px-6 pl-12 font-mono text-[13px] font-black"
                >
                    <span class="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500/40">{$t("common.currency")}</span>
                </SystemInput>
            </div>
            <div class="space-y-3">
                <SystemInput 
                    label={$t("risk.form.profitTarget")} 
                    type="number" 
                    bind:value={profit_target} 
                    class="h-12 bg-white/5 border-white/5 rounded-xl px-6 pl-12 font-mono text-[13px] font-black"
                >
                    <span class="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500/40">{$t("common.currency")}</span>
                </SystemInput>
            </div>
            <div class="space-y-3">
                <SystemInput 
                    label={$t("risk.form.maxExposure")} 
                    type="number" 
                    bind:value={max_exposure} 
                    class="h-12 bg-white/5 border-white/5 rounded-xl px-6 pr-20 font-mono text-[13px] font-black text-right"
                >
                    <span class="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{$t("common.lots")}</span>
                </SystemInput>
            </div>
            <div class="space-y-3">
                <SystemInput 
                    label={$t("risk.form.orderLimit")} 
                    type="number" 
                    bind:value={order_limit} 
                    class="h-12 bg-white/5 border-white/5 rounded-xl px-6 pr-20 font-mono text-[13px] font-black text-right"
                >
                    <span class="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{$t("common.orders")}</span>
                </SystemInput>
            </div>
        </div>
    </div>

    <!-- SECTION 4: BLOQUEIOS AUTOMÁTICOS -->
    <div class="bg-black/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-xl">
        <div class="flex items-center gap-4 border-b border-white/5 pb-6">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Lock class="w-5 h-5 text-emerald-500/60" />
            </div>
            <div>
                <h2 class="text-[12px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.automaticBlocks")}</h2>
                <p class="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">{$t("risk.form.automaticBlocksDesc")}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
                class="flex items-center gap-6 p-8 rounded-[2.5rem] border transition-all duration-500 group/block {block_on_daily_loss ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'}"
                onclick={() => block_on_daily_loss = !block_on_daily_loss}
            >
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-xl border-2 transition-all duration-500 flex items-center justify-center {block_on_daily_loss ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/40' : 'border-white/10 group-hover/block:border-white/30'}">
                        {#if block_on_daily_loss}
                            <CheckCircle2 class="w-5 h-5" />
                        {/if}
                    </div>
                </div>
                <div class="text-left">
                    <p class="text-[11px] font-black uppercase tracking-[0.1em] {block_on_daily_loss ? 'text-white' : 'text-muted-foreground/60'}">{$t("risk.form.blockOnDailyLoss")}</p>
                    <p class="text-[8px] text-muted-foreground/30 font-bold uppercase mt-1 tracking-widest">{$t("risk.form.blockOnDailyLossDesc")}</p>
                </div>
            </button>

            <button 
                class="flex items-center gap-6 p-8 rounded-[2.5rem] border transition-all duration-500 group/block {block_on_order_limit ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'}"
                onclick={() => block_on_order_limit = !block_on_order_limit}
            >
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-xl border-2 transition-all duration-500 flex items-center justify-center {block_on_order_limit ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/40' : 'border-white/10 group-hover/block:border-white/30'}">
                        {#if block_on_order_limit}
                            <CheckCircle2 class="w-5 h-5" />
                        {/if}
                    </div>
                </div>
                <div class="text-left">
                    <p class="text-[11px] font-black uppercase tracking-[0.1em] {block_on_order_limit ? 'text-white' : 'text-muted-foreground/60'}">{$t("risk.form.blockOnOrderLimit")}</p>
                    <p class="text-[8px] text-muted-foreground/30 font-bold uppercase mt-1 tracking-widest">{$t("risk.form.blockOnOrderLimitDesc")}</p>
                </div>
            </button>
        </div>
    </div>

    <!-- SECTION 5: LIMITES POR ATIVO / MERCADO -->
    <div class="bg-black/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] space-y-10 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between border-b border-white/5 pb-6">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap class="w-5 h-5 text-emerald-500/60" />
                </div>
                <div>
                    <h2 class="text-[12px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.assetRules")}</h2>
                    <p class="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">{$t("risk.form.assetRulesDesc")}</p>
                </div>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                class="rounded-xl h-10 px-6 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest"
                onclick={() => openOverrideModal()}
            >
                <Plus class="w-4 h-4 mr-2" /> {$t("risk.form.addRule")}
            </Button>
        </div>

        {#if asset_overrides.length === 0}
            <div class="py-16 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-black/20">
                <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <AlertCircle class="w-8 h-8 text-white/10" />
                </div>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 text-center max-w-[250px]">{$t("risk.form.noAssetRules")}</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each asset_overrides as override, idx}
                    <div class="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-emerald-500/30 transition-all duration-500 group relative shadow-lg">
                        <div class="flex flex-wrap gap-2">
                            {#each override.asset_ids as assetId}
                                {@const asset = assetsStore.assets.find(a => a.id === assetId)}
                                <Badge class="bg-emerald-500 text-black text-[9px] font-black rounded-xl px-4 py-1 border-none shadow-lg shadow-emerald-500/10">
                                    {asset?.symbol || assetId}
                                </Badge>
                            {/each}
                        </div>

                        <div class="space-y-3">
                            <div class="flex justify-between items-center border-b border-white/5 pb-2">
                                <span class="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{$t("common.lots")}:</span>
                                <span class="text-[13px] font-mono font-black text-foreground">{override.min_lots} <span class="text-emerald-500/40 mx-1">→</span> {override.max_lots}</span>
                            </div>
                            <div class="flex justify-between items-center border-b border-white/5 pb-2">
                                <span class="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{$t("risk.management.stopLimit")}:</span>
                                <span class="text-[13px] font-mono font-black text-foreground">{override.default_stop_points} <span class="text-[9px] text-muted-foreground/40 ml-1">PTS</span></span>
                            </div>
                        </div>

                        {#if override.observations}
                            <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                                <p class="text-[9px] text-muted-foreground/50 italic line-clamp-2 font-medium leading-relaxed uppercase">“{override.observations}”</p>
                            </div>
                        {/if}

                        <div class="flex items-center gap-3 pt-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
                            <Button 
                                variant="ghost" 
                                class="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-emerald-500 hover:text-black transition-all flex-1"
                                onclick={() => openOverrideModal(idx)}
                            >
                                <Edit3 class="w-3.5 h-3.5 mr-2" />
                                {$t("common.edit")}
                            </Button>
                            <Button 
                                variant="ghost" 
                                class="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shrink-0"
                                onclick={() => removeOverride(idx)}
                            >
                                <Trash2 class="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- SECTION 6: OBSERVAÇÕES -->
    <div class="bg-black/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-xl">
        <div class="flex items-center gap-4 border-b border-white/5 pb-6">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <FileText class="w-5 h-5 text-emerald-500/60" />
            </div>
            <div>
                <h2 class="text-[12px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.generalObservations")}</h2>
                <p class="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">{$t("risk.form.generalObservationsDesc")}</p>
            </div>
        </div>
        <SystemInput 
            bind:value={observations} 
            multiline
            placeholder={$t("risk.form.observationsPlaceholder")} 
            class="min-h-[150px] rounded-[2rem] bg-white/5 border-white/5 focus-visible:border-emerald-500/40 p-8 text-sm resize-none" 
        />
    </div>

    </div>

</div>

<!-- SECTION 7: RODAPÉ FAIXA FIXA -->
<div class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-6 pointer-events-none">
    <div class="flex items-center justify-between bg-[#0a0c10]/80 backdrop-blur-3xl border border-white/10 p-3 rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] pointer-events-auto">
        <Button 
            variant="ghost" 
            class="rounded-xl h-12 px-10 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-white/5 hover:text-white"
            onclick={() => goto("/settings/risk")}
        >
            {$t("common.cancel")}
        </Button>

        <Button 
            onclick={handleSave}
            disabled={isSaving || isDeleting}
            class="rounded-xl px-16 h-12 text-[11px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center gap-3"
        >
            {#if isSaving}
                <div class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                {$t("common.saving")}
            {:else}
                <Save class="w-4 h-4" />
                {$t("risk.form.saveProfile")}
            {/if}
        </Button>
    </div>
</div>

<!-- MODAL: NOVO LIMITE POR ATIVO -->
<Dialog.Root bind:open={isOverrideModalOpen}>
    <Dialog.Content class="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-0 overflow-hidden shadow-2xl max-w-xl z-[150]">
        <div class="p-10 bg-emerald-500/5 border-b border-white/5 relative overflow-hidden group">
            <div class="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            <h2 class="text-2xl font-black uppercase tracking-tight flex items-center gap-4 relative z-10">
                <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                    <Zap class="w-5 h-5 text-emerald-500" />
                </div>
                {editingOverrideIndex !== null ? $t("risk.form.editRule") : $t("risk.form.newAssetRule")}
            </h2>
        </div>

        <div class="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-10">
            <!-- SELEÇÃO DE ATIVOS (CHIPS) -->
            <div class="space-y-4">
                <Label class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.form.selectedAssets")}</Label>
                <div class="flex flex-wrap gap-2.5 p-6 bg-black/40 rounded-[2.5rem] border border-white/5 min-h-[120px] items-start shadow-inner">
                    {#each assetsStore.assets as asset}
                        <button 
                            class="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all {modalData.asset_ids.includes(asset.id) ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/30' : 'bg-white/5 text-muted-foreground/40 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}"
                            onclick={() => toggleAssetInModal(asset.id)}
                        >
                            <span class="flex items-center gap-3">
                                {asset.symbol}
                                {#if modalData.asset_ids.includes(asset.id)}
                                    <X class="w-3.5 h-3.5" />
                                {/if}
                            </span>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="grid grid-cols-2 gap-8">
                <div class="space-y-2">
                    <Label class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.form.minLot")}</Label>
                    <Input type="number" bind:value={modalData.min_lots} class="rounded-xl h-12 bg-white/5 border-white/5 px-8 font-mono text-sm font-black focus-visible:border-emerald-500/40" />
                </div>
                <div class="space-y-2">
                    <Label class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.form.maxLot")}</Label>
                    <Input type="number" bind:value={modalData.max_lots} class="rounded-xl h-12 bg-white/5 border-white/5 px-8 font-mono text-sm font-black focus-visible:border-emerald-500/40" />
                </div>
            </div>

            <div class="space-y-2">
                <Label class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.form.defaultStop")}</Label>
                <div class="relative">
                    <Input type="number" bind:value={modalData.default_stop_points} class="rounded-xl h-12 bg-white/5 border-white/5 px-8 font-mono text-sm font-black focus-visible:border-emerald-500/40" />
                </div>
            </div>

            <div class="space-y-2">
                <Label class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.form.ruleObservations")}</Label>
                <Textarea bind:value={modalData.observations} placeholder={$t("risk.form.ruleObservationsPlaceholder")} class="rounded-[2.5rem] bg-white/5 border-white/5 min-h-[120px] p-8 text-[11px] font-black uppercase tracking-widest leading-relaxed resize-none focus-visible:border-emerald-500/40" />
            </div>
        </div>

        <div class="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between px-12 backdrop-blur-2xl">
            <Button 
                variant="ghost" 
                class="rounded-xl h-12 px-10 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white transition-all"
                onclick={() => isOverrideModalOpen = false}
            >
                {$t("common.cancel")}
            </Button>
            <Button 
                class="rounded-xl h-12 px-16 text-[11px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                onclick={saveOverride}
            >
                {$t("risk.form.confirmRule")}
            </Button>
        </div>
    </Dialog.Content>
</Dialog.Root>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) { width: 4px; }
    :global(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
</style>

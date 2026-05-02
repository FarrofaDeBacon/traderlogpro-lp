<script lang="ts">
  import { onMount } from "svelte";
  import { riskSettingsStore } from "$lib/stores/risk-settings.svelte";
  import { accountsStore } from "$lib/stores/accounts.svelte";
  import { assetsStore } from "$lib/stores/assets.svelte";
  import { assetTypesStore } from "$lib/stores/asset-types.svelte";
  import { ShieldCheck, Gauge, Lock, FileText, Plus, Zap, Edit3, Trash2, Save, X, CheckCircle2, ChevronRight, AlertCircle, Link as LinkIcon, Layers, Calendar } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Switch } from "$lib/components/ui/switch";
  import { Label } from "$lib/components/ui/label";
  import { Separator } from "$lib/components/ui/separator";
  import { SystemInput, SystemSelect, SystemCalendar } from "$lib/components/ui/system";
  import { t } from "svelte-i18n";
  import { toast } from "svelte-sonner";
  import { riskStore } from "$lib/stores/riskStore.svelte";
  import { keyboardForm } from "$lib/actions/keyboard-nav";
  import type { RiskProfile, AssetRiskOverride } from "$lib/types";

  interface Props {
    initialData?: RiskProfile;
    onSave: (data: Omit<RiskProfile, "id">) => void;
    onCancel: () => void;
  }

  let { initialData, onSave, onCancel }: Props = $props();

  let name = $state(initialData?.name || "");
  let description = $state(initialData?.description || "");
  let active = $state(initialData?.active ?? true);
  let account_ids = $state<string[]>(initialData?.account_ids ? [...initialData.account_ids] : []);
  let growth_plan_enabled = $state(!!initialData?.growth_plan_id);
  let growth_plan_id = $state(initialData?.growth_plan_id || "");
  
  // Limits with Fallbacks for Legacy Names
  // @ts-ignore - handling potential backend name mismatch
  let daily_loss_limit = $state(initialData?.daily_loss_limit ?? initialData?.max_daily_loss ?? 0);
  // @ts-ignore
  let profit_target = $state(initialData?.profit_target ?? initialData?.target_profit_factor ?? 0);
  let max_exposure = $state(initialData?.max_exposure ?? 0);
  let order_limit = $state(initialData?.order_limit ?? 0);

  // Blocking
  let block_on_daily_loss = $state(initialData?.block_on_daily_loss || false);
  let block_on_order_limit = $state(initialData?.block_on_order_limit || false);
  let asset_overrides_enabled = $state(initialData?.asset_overrides && initialData.asset_overrides.length > 0 ? true : false);
  let asset_overrides = $state<AssetRiskOverride[]>(initialData?.asset_overrides ? JSON.parse(JSON.stringify(initialData.asset_overrides)) : []);
  let observations = $state(initialData?.observations || "");

  // Start Date Management (Reactive to the selected plan)
  let localStartDate = $state("");
  
  $effect(() => {
    if (growth_plan_enabled && growth_plan_id) {
      const plan = riskSettingsStore.growthPlans.find(p => p.id === growth_plan_id);
      if (plan?.currentPhaseStartedAt) {
        const date = new Date(plan.currentPhaseStartedAt);
        localStartDate = date.toISOString().split('T')[0];
      }
    }
  });

  async function handleUpdateStartDate() {
    if (!localStartDate || !growth_plan_id) {
      toast.error($t("risk.form.messages.selectDateFirst") || "Selecione uma data primeiro");
      return false;
    }
    
    try {
      const date = new Date(localStartDate + 'T12:00:00Z');
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      const isoDate = date.toISOString();
      
      await riskSettingsStore.updateGrowthPlan(growth_plan_id, {
        currentPhaseStartedAt: isoDate
      });
      
      // O Cockpit se atualiza sozinho via reatividade do Svelte 5 (Runes)
      // pois ele depende do riskSettingsStore.growthPlans que acabamos de atualizar.
      
      toast.success($t("risk.form.messages.saveDateSuccess") || "Data salva!", { id: loadingToast });
      return true;
    } catch (e) {
      console.error("[RiskProfileForm] Save date error:", e);
      toast.error($t("risk.form.messages.invalidDateFormat") || "Erro ao salvar data", { id: loadingToast });
      return false;
    }
  }

  // Modal State for Overrides
  let isOverrideModalOpen = $state(false);
  let editingOverrideIndex = $state<number | null>(null);
  let modalData = $state<AssetRiskOverride>({
    asset_ids: [],
    asset_type_ids: [],
    min_lots: 1,
    max_lots: 1,
    default_stop_points: 100,
    observations: ""
  });

  onMount(async () => {
    await accountsStore.loadAccounts();
    await assetsStore.loadAssets();
    await assetTypesStore.loadAssetTypes();
  });

  function openOverrideModal(index: number | null = null) {
    if (index !== null) {
      editingOverrideIndex = index;
      modalData = JSON.parse(JSON.stringify(asset_overrides[index]));
    } else {
      editingOverrideIndex = null;
      modalData = {
        asset_ids: [],
        asset_type_ids: [],
        min_lots: 1,
        max_lots: 1,
        default_stop_points: 100,
        observations: ""
      };
    }
    isOverrideModalOpen = true;
  }

  function saveOverride() {
    if (modalData.asset_ids.length === 0 && modalData.asset_type_ids.length === 0) {
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

  function toggleAssetTypeInModal(typeId: string) {
    if (modalData.asset_type_ids.includes(typeId)) {
      modalData.asset_type_ids = modalData.asset_type_ids.filter(id => id !== typeId);
    } else {
      modalData.asset_type_ids = [...modalData.asset_type_ids, typeId];
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
    if (!name) {
      toast.error($t("risk.form.messages.profileNameRequired"));
      return;
    }

    const loadingToast = toast.loading($t("common.saving") || "Salvando perfil...");

    try {
      // Se a data de início foi alterada, salva ela primeiro
      if (growth_plan_enabled && localStartDate) {
        const ok = await handleUpdateStartDate();
        if (!ok) {
          toast.dismiss(loadingToast);
          return;
        }
      }

      const finalData = {
        ...initialData,
        name,
        description,
        active,
        account_ids: Array.isArray(account_ids) ? account_ids : [],
        growth_plan_id: growth_plan_enabled ? (growth_plan_id || null) : null,
        daily_loss_limit: growth_plan_enabled ? 0 : (daily_loss_limit || 0),
        profit_target: growth_plan_enabled ? 0 : (profit_target || 0),
        max_exposure: growth_plan_enabled ? 0 : (max_exposure || 0),
        order_limit: growth_plan_enabled ? 0 : (order_limit || 0),
        block_on_daily_loss,
        block_on_order_limit,
        asset_overrides: JSON.parse(JSON.stringify(asset_overrides)),
        observations: observations || ""
      };

      await onSave(finalData as any);
      
      // Notificamos sucesso e o modal deve ser fechado pelo componente pai
      toast.success($t("common.saveSuccess") || "Perfil salvo com sucesso!", { id: loadingToast });
    } catch (e) {
      console.error("[RiskProfileForm] Main save error:", e);
      toast.error($t("common.saveError") || "Erro ao salvar perfil", { id: loadingToast });
    }
  }

  let selectedPlanName = $derived(
    riskSettingsStore.growthPlans.find(p => p.id === growth_plan_id)?.name || $t("risk.management.noPlanLinked")
  );
</script>

<!-- Header -->
<div class="p-8 bg-muted/5 border-b border-border flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
  <div class="flex items-center gap-4">
    <div class="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center border border-primary/20">
      <ShieldCheck class="w-6 h-6 text-primary" />
    </div>
    <div>
      <h2 class="text-xl font-black uppercase tracking-tight text-foreground">
        {initialData ? name : $t("risk.plan.new")}
      </h2>
      <p class="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mt-1">
        {$t("risk.form.institutionalRiskManagement")}
      </p>
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-6 bg-muted/10 px-6 py-2 rounded-full border border-border/50">
      <div class="flex items-center gap-3">
        <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{$t("risk.form.linkAccount")}</span>
        <SystemSelect 
          options={accountsStore.accounts.map(acc => ({ value: acc.id, label: acc.nickname || acc.account_number || $t("common.account") }))}
          placeholder={$t("risk.form.chooseAccount")}
          onchange={(val) => val && !account_ids.includes(val) && (account_ids = [...account_ids, val])}
          class="h-8 min-w-[180px] bg-transparent border-0 shadow-none hover:bg-white/5"
        />
      </div>
      <Separator orientation="vertical" class="h-4 bg-border/50" />
      <div class="flex items-center gap-3">
        <span class="text-[9px] font-black uppercase tracking-[0.2em] {active ? 'text-emerald-500' : 'text-muted-foreground/40'}">
          {active ? $t("common.yes") : $t("common.no")}
        </span>
        <Switch bind:checked={active} class="scale-90" />
      </div>
    </div>
    
    {#if account_ids.length > 0}
      <div class="flex flex-wrap gap-2 justify-end px-2">
        {#each account_ids as id}
          {@const acc = accountsStore.accounts.find(a => a.id === id)}
          <div class="h-6 px-3 rounded-full bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-primary/20 animate-in fade-in slide-in-from-right-2 duration-300">
            {acc?.nickname || acc?.account_number || $t("common.account")}
            <button onclick={() => toggleAccount(id)} class="hover:text-primary-foreground/60 transition-colors">
              <X class="w-2.5 h-2.5" />
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Content -->
<div class="p-8 space-y-12 pb-32" use:keyboardForm>
  <!-- Identity -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div class="space-y-2">
      <span class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-4">{$t("risk.form.profileName")}</span>
      <SystemInput 
        bind:value={name} 
        placeholder={$t("risk.form.profileNamePlaceholder")}
        class="h-12 bg-muted/5 border-border rounded-full px-6 focus-visible:border-primary/40"
      />
    </div>
    <div class="space-y-2">
      <span class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-4">{$t("risk.form.description")}</span>
      <SystemInput 
        bind:value={description} 
        placeholder={$t("risk.form.descriptionPlaceholder")}
        class="h-12 bg-muted/5 border-border rounded-full px-6 focus-visible:border-primary/40"
      />
    </div>
  </div>



  <!-- Operational Management -->
  <div class="space-y-8">
    <div class="flex items-center justify-between border-b border-border pb-4">
      <div class="flex items-center gap-4">
        <Gauge class="w-4 h-4 text-primary/60" />
        <span class="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.operationalManagement")}</span>
      </div>
      
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-3 bg-muted/10 px-4 py-1.5 rounded-full border border-border/50">
          <span class="text-[9px] font-black uppercase tracking-widest {growth_plan_enabled ? 'text-primary' : 'text-muted-foreground/40'}">
            {$t("risk.form.growthPlan")}
          </span>
          <Separator orientation="vertical" class="h-3 bg-border/50" />
          <Switch bind:checked={growth_plan_enabled} class="scale-75" />
        </div>

        {#if growth_plan_enabled}
          <SystemSelect 
            bind:value={growth_plan_id} 
            options={riskSettingsStore.growthPlans.map(p => ({ value: p.id, label: p.name }))}
            class="h-9 min-w-[220px] rounded-full bg-muted/10"
            placeholder={$t("risk.form.choosePlan")}
          />
        {/if}
      </div>
    </div>

    {#if growth_plan_enabled}
      <div class="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] flex items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
          <ChevronRight class="w-6 h-6 text-emerald-500" />
        </div>
        <div class="flex flex-col gap-4">
          <h4 class="text-[12px] font-black uppercase tracking-widest text-emerald-500">{$t("risk.form.cockpitProgressionMode")}</h4>
          <p class="text-[11px] text-muted-foreground/60 font-bold mt-1 leading-relaxed uppercase tracking-[0.05em]">
             {$t("risk.form.cockpitProgressionModeDesc")}
          </p>

          <div class="flex flex-col gap-3 mt-4 p-5 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 max-w-lg">
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-emerald-500/10 rounded-2xl">
                <Calendar class="w-5 h-5 text-emerald-500" />
              </div>
              <div class="flex-1">
                <p class="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-1">{$t("risk.form.phaseStartDate")}</p>
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <input 
                      type="date"
                      bind:value={localStartDate} 
                      class="flex h-10 w-full rounded-xl border border-border bg-white dark:bg-muted/10 px-4 py-2 text-[13px] font-bold transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none" 
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    class="h-10 px-4 rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold uppercase text-[10px] tracking-widest whitespace-nowrap"
                    onclick={handleUpdateStartDate}
                  >
                    {$t("risk.form.saveDate")}
                  </Button>
                </div>
                <p class="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-2 ml-1">
                  {$t("risk.form.dateHelper")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div class="space-y-2">
          <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-4">{$t("risk.form.dailyLoss")}</span>
          <SystemInput type="number" bind:value={daily_loss_limit} class="h-11 bg-muted/5 border-border rounded-full px-6 pl-10 font-mono font-black text-xs">
            <span class="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-500/60">{$t("common.currency")}</span>
          </SystemInput>
        </div>
        <div class="space-y-2">
          <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-4">{$t("risk.form.profitTarget")}</span>
          <SystemInput type="number" bind:value={profit_target} class="h-11 bg-muted/5 border-border rounded-full px-6 pl-10 font-mono font-black text-xs">
            <span class="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500/60">{$t("common.currency")}</span>
          </SystemInput>
        </div>
        <div class="space-y-2">
          <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-4">{$t("risk.form.maxExposure")}</span>
          <SystemInput type="number" bind:value={max_exposure} class="h-11 bg-muted/5 border-border rounded-full px-6 pr-14 font-mono font-black text-xs text-right">
            <span class="absolute right-5 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground/40 uppercase">{$t("common.lots")}</span>
          </SystemInput>
        </div>
        <div class="space-y-2">
          <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-4">{$t("risk.form.orderLimit")}</span>
          <SystemInput type="number" bind:value={order_limit} class="h-11 bg-muted/5 border-border rounded-full px-6 pr-16 font-mono font-black text-xs text-right">
            <span class="absolute right-5 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground/40 uppercase">{$t("common.orders")}</span>
          </SystemInput>
        </div>
      </div>
    {/if}
  </div>

  <!-- Blocks -->
  <div class="space-y-6">
    <div class="flex items-center gap-4 border-b border-border pb-4">
      <Lock class="w-4 h-4 text-primary/60" />
      <span class="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.automaticBlocks")}</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button 
        onclick={() => block_on_daily_loss = !block_on_daily_loss}
        class="flex items-center gap-6 p-6 rounded-[2rem] border transition-all {block_on_daily_loss ? 'bg-primary/5 border-primary/30' : 'bg-muted/5 border-border hover:bg-muted/10'}"
      >
        <div class="w-8 h-8 rounded-xl border-2 flex items-center justify-center {block_on_daily_loss ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}">
          {#if block_on_daily_loss}<CheckCircle2 class="w-5 h-5" />{/if}
        </div>
        <div class="text-left">
          <p class="text-[10px] font-black uppercase tracking-widest {block_on_daily_loss ? 'text-foreground' : 'text-muted-foreground/60'}">{$t("risk.form.blockOnDailyLoss")}</p>
          <p class="text-[8px] text-muted-foreground/30 font-bold uppercase mt-1 tracking-widest">{$t("risk.form.blockOnDailyLossDesc")}</p>
        </div>
      </button>
      <button 
        onclick={() => block_on_order_limit = !block_on_order_limit}
        class="flex items-center gap-6 p-6 rounded-[2rem] border transition-all {block_on_order_limit ? 'bg-primary/5 border-primary/30' : 'bg-muted/5 border-border hover:bg-muted/10'}"
      >
        <div class="w-8 h-8 rounded-xl border-2 flex items-center justify-center {block_on_order_limit ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}">
          {#if block_on_order_limit}<CheckCircle2 class="w-5 h-5" />{/if}
        </div>
        <div class="text-left">
          <p class="text-[10px] font-black uppercase tracking-widest {block_on_order_limit ? 'text-foreground' : 'text-muted-foreground/60'}">{$t("risk.form.blockOnOrderLimit")}</p>
          <p class="text-[8px] text-muted-foreground/30 font-bold uppercase mt-1 tracking-widest">{$t("risk.form.blockOnOrderLimitDesc")}</p>
        </div>
      </button>
    </div>
  </div>

  {#if !growth_plan_enabled}
    <!-- Asset Overrides -->
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div class="flex items-center justify-between border-b border-border pb-4">
        <div class="flex items-center gap-4">
          <Zap class="w-4 h-4 text-primary/60" />
          <span class="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.assetRules")}</span>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3 bg-muted/10 px-4 py-1.5 rounded-full border border-border/50">
            <span class="text-[9px] font-black uppercase tracking-widest {asset_overrides_enabled ? 'text-primary' : 'text-muted-foreground/40'}">
              {$t("risk.form.enableAssetRules")}
            </span>
            <Separator orientation="vertical" class="h-3 bg-border/50" />
            <Switch bind:checked={asset_overrides_enabled} class="scale-75" />
          </div>

          {#if asset_overrides_enabled}
            <Button variant="ghost" size="sm" class="h-8 rounded-full px-4 text-primary hover:bg-primary/10 text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95" onclick={() => openOverrideModal()}>
              <Plus class="w-4 h-4 mr-2" /> {$t("risk.form.addRule")}
            </Button>
          {/if}
        </div>
      </div>

      {#if asset_overrides_enabled}
        <div class="animate-in fade-in slide-in-from-top-2 duration-300">
          {#if asset_overrides.length === 0}
            <div class="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5">
              <AlertCircle class="w-10 h-10 text-muted-foreground/20 mb-4" />
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">{$t("risk.form.noAssetRules")}</p>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#each asset_overrides as override, idx}
                <div class="bg-muted/5 border border-border rounded-[2rem] p-6 space-y-4 group relative overflow-hidden hover:border-primary/20 transition-all">
                  <div class="flex flex-wrap gap-2">
                    {#each override.asset_type_ids || [] as typeId}
                      {@const type = assetTypesStore.assetTypes.find(t => t.id === typeId)}
                      <span class="bg-primary text-primary-foreground text-[9px] font-black rounded-full px-3 py-1 flex items-center gap-2 border border-primary">
                        <Layers class="w-3 h-3" />
                        {type?.name || typeId}
                      </span>
                    {/each}
                    {#each override.asset_ids as assetId}
                      {@const asset = assetsStore.assets.find(a => a.id === assetId)}
                      <span class="bg-primary/10 text-primary text-[9px] font-black rounded-full px-3 py-1 border border-primary/20">
                        {asset?.symbol || assetId}
                      </span>
                    {/each}
                  </div>
                  <div class="justify-between items-center text-[11px] font-mono font-black hidden group-hover:flex">
                     <span class="text-muted-foreground/40 uppercase text-[9px] font-sans">{$t("common.lots")}: {override.min_lots} → {override.max_lots}</span>
                     <span class="text-primary/60 uppercase text-[9px] font-sans">{$t("risk.management.stopLimit")}: {override.default_stop_points} pts</span>
                  </div>
                  <div class="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" class="h-8 px-4 rounded-full text-[9px] font-black uppercase bg-muted/10 hover:bg-primary hover:text-primary-foreground flex-1" onclick={() => openOverrideModal(idx)}>
                      <Edit3 class="w-3.5 h-3.5 mr-2" /> {$t("common.edit")}
                    </Button>
                    <Button variant="ghost" class="h-8 w-8 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white" onclick={() => removeOverride(idx)}>
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <div class="p-8 bg-muted/5 border border-dashed border-border rounded-[2.5rem] flex items-center justify-center gap-4 animate-in fade-in zoom-in-95">
          <Zap class="w-5 h-5 text-muted-foreground/20" />
          <p class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">{$t("risk.form.assetRulesDisabled")}</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Observations -->
  <div class="space-y-6">
    <div class="flex items-center gap-4 border-b border-border pb-4">
      <FileText class="w-4 h-4 text-primary/60" />
      <span class="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("risk.form.generalObservations")}</span>
    </div>
    <textarea 
      bind:value={observations}
      placeholder={$t("risk.form.observationsPlaceholder")}
      class="w-full min-h-[120px] rounded-[2rem] bg-muted/5 border border-border p-6 text-sm font-medium focus:border-primary/40 outline-none transition-all resize-none"
    ></textarea>
  </div>
</div>

<!-- Footer -->
<div class="p-8 bg-muted/5 border-t border-border flex items-center justify-between sticky bottom-0 z-20 backdrop-blur-xl">
  <Button 
    variant="ghost" 
    class="rounded-full h-12 px-10 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/10"
    onclick={onCancel}
  >
    {$t("common.cancel")}
  </Button>

  <Button 
    onclick={handleSave}
    class="rounded-full px-16 h-12 text-[11px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
  >
    <Save class="w-4 h-4" />
    {$t("risk.form.saveProfile")}
  </Button>
</div>

<!-- Override Modal -->
<Dialog.Root bind:open={isOverrideModalOpen}>
  <Dialog.Content class="bg-background border border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-w-xl">
    <div class="p-8 bg-muted/5 border-b border-border">
      <h3 class="text-xl font-black uppercase tracking-tight flex items-center gap-4">
        <Zap class="w-5 h-5 text-primary" />
        {editingOverrideIndex !== null ? $t("risk.form.editRule") : $t("risk.form.newAssetRule")}
      </h3>
    </div>

    <div class="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
      <!-- Tabs -->
      <div class="space-y-3">
        <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-5">{$t("risk.form.ruleType")}</span>
        <Tabs.Root value="assets" class="w-full">
          <Tabs.List class="grid grid-cols-2 bg-muted/10 rounded-full p-1.5 h-12 border border-border">
            <Tabs.Trigger value="assets" class="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{$t("risk.form.byAsset")}</Tabs.Trigger>
            <Tabs.Trigger value="types" class="rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{$t("risk.form.byAssetType")}</Tabs.Trigger>
          </Tabs.List>
  
          <Tabs.Content value="assets" class="space-y-6 pt-4">
            <SystemSelect 
              label={$t("risk.form.selectAssets")}
              options={assetsStore.assets.map(a => ({ value: a.id, label: a.symbol }))}
              placeholder={$t("risk.form.searchAssetPlaceholder")}
              onchange={(val) => val && !modalData.asset_ids.includes(val) && toggleAssetInModal(val)}
              class="px-2"
            />
            
            <div class="flex flex-wrap gap-2 p-6 bg-muted/5 rounded-[2.5rem] border border-border/50 min-h-[100px] items-start shadow-inner">
              {#each modalData.asset_ids as id}
                {@const asset = assetsStore.assets.find(a => a.id === id)}
                <div class="h-9 px-4 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in zoom-in-95 border border-primary">
                  {asset?.symbol || id}
                  <button onclick={() => toggleAssetInModal(id)} class="hover:text-white/60"><X class="w-3.5 h-3.5" /></button>
                </div>
              {:else}
                <div class="m-auto flex flex-col items-center gap-2 opacity-20">
                  <Plus class="w-5 h-5" />
                  <p class="text-[9px] font-black uppercase tracking-widest italic text-center">{$t("risk.form.bindAssetsHint")}</p>
                </div>
              {/each}
            </div>
          </Tabs.Content>
  
          <Tabs.Content value="types" class="space-y-6 pt-4">
            <SystemSelect 
              label={$t("risk.form.selectAssetTypes")}
              options={assetTypesStore.assetTypes.map(t => ({ value: t.id, label: t.name }))}
              placeholder={$t("risk.form.searchAssetTypePlaceholder")}
              onchange={(val) => val && !modalData.asset_type_ids.includes(val) && toggleAssetTypeInModal(val)}
              class="px-2"
            />
            
            <div class="flex flex-wrap gap-2 p-6 bg-muted/5 rounded-[2.5rem] border border-border/50 min-h-[100px] items-start shadow-inner">
              {#each modalData.asset_type_ids as id}
                {@const type = assetTypesStore.assetTypes.find(t => t.id === id)}
                <div class="h-9 px-4 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in zoom-in-95 border border-primary">
                  <Layers class="w-3.5 h-3.5" />
                  {type?.name || id}
                  <button onclick={() => toggleAssetTypeInModal(id)} class="hover:text-white/60"><X class="w-3.5 h-3.5" /></button>
                </div>
              {:else}
                <div class="m-auto flex flex-col items-center gap-2 opacity-20">
                  <Plus class="w-5 h-5" />
                  <p class="text-[9px] font-black uppercase tracking-widest italic text-center">{$t("risk.form.bindAssetTypesHint")}</p>
                </div>
              {/each}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <!-- Limits -->
      <div class="grid grid-cols-2 gap-8 px-2">
        <SystemInput type="number" label={$t("risk.form.minLot")} bind:value={modalData.min_lots} class="font-mono text-xs font-black focus-visible:border-primary/50" />
        <SystemInput type="number" label={$t("risk.form.maxLot")} bind:value={modalData.max_lots} class="font-mono text-xs font-black focus-visible:border-primary/50" />
      </div>

      <div class="px-2">
        <SystemInput type="number" label={$t("risk.form.defaultStop")} bind:value={modalData.default_stop_points} class="font-mono text-xs font-black focus-visible:border-primary/50" />
      </div>

      <div class="px-2">
        <SystemInput 
          multiline 
          label={$t("risk.form.ruleObservations")} 
          bind:value={modalData.observations}
          placeholder={$t("risk.form.ruleObservationsPlaceholder")}
          class="placeholder:text-muted-foreground/20 shadow-inner"
        />
      </div>
    </div>

    <div class="p-8 bg-muted/5 border-t border-border flex items-center justify-between gap-4">
      <Button variant="ghost" class="rounded-full h-12 px-10 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/10" onclick={() => isOverrideModalOpen = false}>
        {$t("common.cancel")}
      </Button>
      <Button class="rounded-full h-12 px-14 text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" onclick={saveOverride}>
        {$t("risk.form.confirmRule")}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  textarea:focus {
    border-color: var(--primary);
  }
</style>

<script lang="ts">
  import { riskSettingsStore } from "$lib/stores/risk-settings.svelte";
  import { accountsStore } from "$lib/stores/accounts.svelte";
  import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
  import { Plus, ShieldAlert, ChevronRight, Search, TrendingUp, AlertCircle, Trash2, Target, Pencil, Zap, Lock, CheckCircle2 } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { SystemListItem } from "$lib/components/ui/system";
  import { t, locale } from "svelte-i18n";
  import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
  import { toast } from "svelte-sonner";
  import type { RiskProfile } from "$lib/types";
  import RiskProfileForm from "$lib/components/settings/risk/RiskProfileForm.svelte";
  import { keyboardList } from "$lib/actions/keyboard-nav";

  let isDialogOpen = $state(false);
  let editingItem = $state<RiskProfile | undefined>(undefined);
  let searchTerm = $state("");

  // Delete Modal State
  let isDeleteOpen = $state(false);
  let deleteId = $state<string | null>(null);

  let filteredItems = $derived(
    riskSettingsStore.riskProfiles
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  function openNew() {
    editingItem = undefined;
    isDialogOpen = true;
  }

  function openEdit(item: RiskProfile) {
    editingItem = $state.snapshot(item);
    isDialogOpen = true;
  }

  async function save(data: Omit<RiskProfile, "id">) {
    try {
      if (editingItem) {
        await riskSettingsStore.updateRiskProfile(editingItem.id, data);
      } else {
        await riskSettingsStore.addRiskProfile(data);
      }
      toast.success($t("common.saveSuccess"));
      isDialogOpen = false;
    } catch (e) {
      toast.error(String(e));
    }
  }

  function requestDelete(id: string) {
    deleteId = id;
    isDeleteOpen = true;
  }

  async function confirmDelete() {
    if (deleteId) {
      const result = await riskSettingsStore.deleteRiskProfile(deleteId);
      if (!result.success) {
        toast.error(result.error || $t("common.error"));
      } else {
        toast.success($t("common.deleteSuccess"));
      }
      deleteId = null;
    }
  }

  $effect(() => {
    settingsHeaderStore.setActions(headerActions);
    return () => settingsHeaderStore.clearActions();
  });
</script>

{#snippet headerActions()}
  <div class="flex items-center gap-4">
    <div class="relative hidden md:block">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
      <input
        type="text"
        bind:value={searchTerm}
        placeholder={$t("risk.management.searchPlaceholder")}
        class="h-9 pl-10 pr-4 bg-muted/10 border border-border rounded-xl text-[10px] font-bold tracking-widest focus:border-primary/30 outline-none w-64 transition-all focus:w-80"
      />
    </div>

    <Button
      onclick={openNew}
      class="rounded-xl px-8 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
    >
      <Plus class="w-4 h-4 mr-2" />
      {$t("common.add")}
    </Button>
  </div>
{/snippet}

<div class="space-y-6 max-w-full mx-auto pb-20 px-4 pt-4">
  {#if filteredItems.length > 0}
    <div class="grid grid-cols-1 gap-4" use:keyboardList>
    {#each filteredItems as profile (profile.id)}
      <div 
        class="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/5 flex flex-col gap-4 {profile.active ? 'ring-1 ring-primary/30 bg-primary/[0.02]' : ''}"
      >
        <!-- Profile Header -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-4 flex-1 min-w-0">
            <div class="p-3 bg-muted/20 rounded-xl group-hover:bg-primary/10 transition-colors border border-border w-12 h-12 flex items-center justify-center shrink-0">
              <ShieldAlert class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-black text-sm leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors uppercase break-words pr-2">
                {profile.name}
              </h3>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-[8px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/5 px-2 py-0.5 rounded border border-border/30">
                  {profile.account_ids?.length || 0} {profile.account_ids?.length === 1 ? $t('common.account') : $t('common.accounts')}
                </span>
                {#if profile.active}
                  <span class="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                    <CheckCircle2 class="w-2.5 h-2.5" />
                    {$t("risk.management.currentlyInUse")}
                  </span>
                {/if}
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 bg-muted/10 px-4 py-2 rounded-xl border border-border shrink-0 mt-1">
            <span class="w-2.5 h-2.5 rounded-full {profile.active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/30'}"></span>
            <span class="text-[10px] font-black uppercase tracking-[0.1em] {profile.active ? 'text-emerald-500' : 'text-muted-foreground/40'}">
              {profile.active ? $t("risk.management.statusActive") : $t("risk.management.statusInactive")}
            </span>
          </div>
        </div>

        <!-- Plan / Risk Details -->
        <div class="flex-1">
          {#if profile.growth_plan_id}
            {@const plan = riskSettingsStore.growthPlans.find(p => p.id === profile.growth_plan_id)}
            {#if plan}
              {@const currentPhase = plan.phases[plan.current_phase_index]}
              <div class="bg-muted/10 rounded-[1.5rem] p-6 space-y-4 border border-border/50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-emerald-500/10 rounded-lg">
                      <TrendingUp class="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <span class="text-[11px] font-black text-emerald-600 uppercase tracking-widest block">{plan.name}</span>
                      <p class="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-0.5 opacity-50">{$t("risk.management.activeCapitalEvolution")}</p>
                    </div>
                  </div>
                  <span class="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/5 px-4 py-1 rounded-xl border border-emerald-500/10 tracking-widest">{$t("risk.management.phaseInfo", { current: plan.current_phase_index + 1, total: plan.phases.length })}</span>
                </div>

                <div class="grid grid-cols-2 gap-8 py-4 border-y border-border/50">
                  <div class="space-y-1">
                    <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block opacity-40">{$t("risk.management.currentStage")}</span>
                    <p class="text-xl font-black text-foreground uppercase tracking-tight">
                      {currentPhase?.name || $t("risk.management.defaultPhaseName")}
                    </p>
                  </div>
                  <div class="space-y-1 text-right">
                    <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block opacity-40">{$t("risk.management.handSize")}</span>
                    <p class="text-2xl font-black text-emerald-600 tabular-nums">
                      {currentPhase?.lot_size || 0} <span class="text-sm opacity-40 lowercase font-bold">{$t("common.lots")}</span>
                    </p>
                  </div>
                </div>

                {#if currentPhase?.conditions_to_advance?.length}
                  <div class="flex items-center justify-between gap-4">
                    <span class="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest shrink-0">{$t("common.requirements")}</span>
                    <div class="flex flex-wrap gap-3 justify-end flex-1">
                      {#each currentPhase.conditions_to_advance as condition}
                        <div class="bg-card px-3 py-1.5 rounded-lg border border-border flex items-center gap-3 shadow-sm group/cond hover:border-emerald-500/30 transition-all">
                          <span class="text-[8px] font-bold text-muted-foreground uppercase tracking-wider opacity-50">{condition.metric}</span>
                          <span class="text-[10px] font-black text-emerald-500 tabular-nums">{condition.operator} {condition.value}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="flex flex-col items-center justify-center p-12 bg-rose-50/50 border border-rose-100 rounded-[1.5rem] gap-3">
                <AlertCircle class="w-8 h-8 text-rose-300" />
                <span class="text-[10px] font-black uppercase tracking-widest text-rose-400">{$t("risk.management.planNotFound")}</span>
              </div>
            {/if}
          {:else}
            <div class="bg-muted/5 border border-border/50 rounded-[1.5rem] p-6 flex flex-col gap-6 group/manual hover:bg-primary/[0.01] transition-all">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-muted/20 rounded-lg group-hover/manual:bg-primary/10 transition-colors">
                    <ShieldAlert class="w-4 h-4 text-muted-foreground/40 group-hover/manual:text-primary/60" />
                  </div>
                  <div>
                    <span class="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest group-hover/manual:text-primary/40 block">{$t("risk.management.manualManagement")}</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  class="rounded-xl px-6 h-8 text-[9px] font-black uppercase tracking-widest text-primary border-primary/20 hover:bg-primary/10 transition-all"
                  onclick={() => openEdit(profile)}
                >
                  <TrendingUp class="w-3 h-3 mr-2" />
                  {$t("risk.management.bindPlan")}
                </Button>
              </div>

              <div class="grid grid-cols-2 gap-8 pb-4 border-b border-border/40">
                <div class="space-y-1 border-r border-border pr-8 overflow-hidden">
                  <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block opacity-40">{$t("risk.management.dailyRisk")}</span>
                  <span class="text-xl font-black text-rose-500 tabular-nums break-all">
                    {(profile.daily_loss_limit || profile.max_daily_loss || 0).toLocaleString($locale || "en-US", { style: "currency", currency: accountsStore.mainCurrency || "USD" })}
                  </span>
                </div>
                <div class="space-y-1 text-right overflow-hidden">
                  <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block opacity-40">{$t("risk.management.profitTarget")}</span>
                  <span class="text-xl font-black text-emerald-500 tabular-nums break-all">
                    {(profile.profit_target || 0).toLocaleString($locale || "en-US", { style: "currency", currency: accountsStore.mainCurrency || "USD" })}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-8 py-1">
                <div class="space-y-0.5">
                  <span class="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block opacity-30">{$t("risk.management.exposure")}</span>
                  <p class="text-sm font-black text-foreground uppercase tracking-tight">
                    {profile.max_exposure || 0} <span class="text-[10px] opacity-30 font-bold lowercase">{$t("common.lots")}</span>
                  </p>
                </div>
                <div class="space-y-0.5 text-right">
                  <span class="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block opacity-30">{$t("risk.management.orders")}</span>
                  <p class="text-sm font-black text-foreground uppercase tracking-tight">
                    {profile.order_limit || 0} <span class="text-[10px] opacity-30 font-bold lowercase">{$t("common.orders")}</span>
                  </p>
                </div>
              </div>

              {#if profile.block_on_daily_loss || profile.block_on_order_limit || (profile.asset_overrides && profile.asset_overrides.length > 0)}
                <div class="pt-4 flex flex-wrap gap-2">
                  {#if profile.block_on_daily_loss}
                    <div class="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                      <Lock class="w-3 h-3 text-rose-500" />
                      <span class="text-[8px] font-black text-rose-600 uppercase tracking-widest">{$t("risk.management.lossBlock")}</span>
                    </div>
                  {/if}
                  {#if profile.block_on_order_limit}
                    <div class="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                      <Lock class="w-3 h-3 text-rose-500" />
                      <span class="text-[8px] font-black text-rose-600 uppercase tracking-widest">{$t("risk.management.orderBlock")}</span>
                    </div>
                  {/if}
                  {#if profile.asset_overrides && profile.asset_overrides.length > 0}
                    <div class="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
                      <Zap class="w-3 h-3 text-primary" />
                      <span class="text-[8px] font-black text-primary uppercase tracking-widest">{$t("risk.management.assetRules", { count: profile.asset_overrides.length })}</span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Footer Actions -->
        <!-- Actions -->
        <div class="flex items-center justify-between pt-3 border-t border-border/40">
          <div class="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/30 transition-colors" 
              onclick={(e) => { e.stopPropagation(); requestDelete(profile.id); }}
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>
            
            <button 
              class="p-2 bg-muted/5 hover:bg-primary/10 rounded-lg transition-all group/edit"
              onclick={() => openEdit(profile)}
            >
              <Pencil class="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
            </button>
          </div>
          
          <div class="flex items-center gap-4">
            {#if !profile.active}
              <Button 
                variant="outline"
                class="rounded-xl px-6 h-8 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                onclick={() => riskSettingsStore.setActiveRiskProfile(profile.id)}
              >
                <Zap class="w-3 h-3 mr-2" />
                {$t("risk.management.activateStrategy")}
              </Button>
            {:else}
              <div class="px-4 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle2 class="w-3 h-3 text-emerald-500" />
                <span class="text-[8px] font-black uppercase tracking-widest text-emerald-600">{$t("risk.management.inOperation")}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
    </div>
  {:else}
      <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl mt-8">
        <ShieldAlert class="w-20 h-20 opacity-5 animate-pulse mb-8" />
        <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50 text-center">
          {searchTerm ? $t("common.noSearchResults") : $t("risk.management.noProfilesFound")}
        </span>
        <Button
          variant="link"
          onclick={() => {
            if (searchTerm) searchTerm = "";
            else openNew();
          }}
          class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors"
        >
          {searchTerm ? $t("common.clearSearch") : $t("risk.management.createNewProfile")}
        </Button>
      </div>
    {/if}
  </div>


<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<Dialog.Root bind:open={isDialogOpen}>
  <Dialog.Content
    class="max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto custom-scrollbar p-0 bg-background border-border shadow-2xl rounded-[2.5rem]"
  >
    <RiskProfileForm 
      initialData={editingItem} 
      onSave={save} 
      onCancel={() => (isDialogOpen = false)} 
    />
  </Dialog.Content>
</Dialog.Root>

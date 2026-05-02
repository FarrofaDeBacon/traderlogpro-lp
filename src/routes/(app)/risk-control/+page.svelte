<script lang="ts">
  import { onMount } from "svelte";
  import { assetsStore } from "$lib/stores/assets.svelte";
  import { accountsStore } from "$lib/stores/accounts.svelte";
  import { riskSettingsStore } from "$lib/stores/risk-settings.svelte";
  import { userProfileStore } from "$lib/stores/user-profile.svelte.ts";
  import { riskStore } from "$lib/stores/riskStore.svelte";
  import { tradesStore } from "$lib/stores/trades.svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import {
    SystemCard,
    SystemMetric,
    SystemHeader,
    SystemSelect
  } from "$lib/components/ui/system";
  import { Separator } from "$lib/components/ui/separator";
  import { t, locale } from "svelte-i18n";
  import { goto } from "$app/navigation";
  import { 
      CheckCircle2, 
      XCircle, 
      AlertTriangle, 
      ShieldAlert, 
      TrendingUp, 
      Shield, 
      Activity,
      Lock,
      Target,
      Layers,
      Brain,
      ShieldCheck,
      ChevronRight,
      ChevronDown,
      Flame,
      Info,
      Globe,
      TrendingDown,
      Timer,
      ArrowUpCircle,
      ArrowDownCircle,
      RotateCcw
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { adaptGrowthPhaseToDomain } from "$lib/domain/risk/risk-adapters";
  import * as Select from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { cn } from "$lib/utils";
  import type { GrowthPhase as AppGrowthPhase } from "$lib/types";
  import type { GrowthPhase as DomainGrowthPhase } from "$lib/domain/risk/types";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import SurvivorJourney from "$lib/components/risk/SurvivorJourney.svelte";
  
  let isRestartModalOpen = $state(false);
  
  // Derived states
  let activeProfile = $derived(riskSettingsStore.activeProfile);
  let cockpit = $derived(riskStore.riskCockpitState);
  let validation = $derived(riskStore.deskValidationResult);
  let deskProgression = $derived(riskStore.deskStageProgressionState);
  let deskFeedback = $derived(riskStore.deskProgressFeedback);
  let growthContext = $derived(riskStore.resolvedGrowthContext);

  let dailyDrawdown = $derived(cockpit?.dailyRiskStatus?.currentDailyDrawdown || 0);
  let growthEval = $derived(riskStore.riskCockpitState?.growthEvaluation || riskStore.globalGrowthEvaluation);
  let netPnL = $derived(growthEval?.metrics?.netPnL || 0);
  let isBlocked = $derived(!validation?.allowed || cockpit?.dailyRiskStatus?.isLocked || cockpit?.dailyRiskStatus?.dailyLossHit);
  let hasWarnings = $derived(validation?.warnings && validation.warnings.length > 0);
  
  let mainStatus = $derived(
      isBlocked ? "blocked" : 
      hasWarnings ? "caution" : 
      "allowed"
  );


  // Defesa de Integração HMR e Landing: Garantir dados no modulo isolado
  onMount(() => {
     if (tradesStore.trades.length === 0) {
         console.warn("[Cockpit] Trades vazios na montagem local, disparando reload defensivo!");
         tradesStore.loadTrades();
         if (!appStore.isInitialLoadComplete) appStore.loadData();
     }
  });

  let currencyCode = $derived(
      activeProfile?.capital_source === 'LinkedAccount' && activeProfile.linked_account_id 
      ? accountsStore.accounts.find(a => a.id === activeProfile?.linked_account_id)?.currency || accountsStore.mainCurrency || 'USD'
      : accountsStore.mainCurrency || userProfileStore.userProfile.main_currency || 'USD'
  );

  // Diagnostics: Context Resolution Observability (Svelte 5 safe context)
  $effect(() => {
    if (growthContext?.resolution) {
      const res = growthContext.resolution;
      console.groupCollapsed(`[Cockpit] Context Resolution: ${res.source.toUpperCase()}`);
      console.log("Ativo Contexto:", riskStore.activeAssetId || "Global");
      console.log("Motivo:", res.sourceReason);
      console.log("Meta Fase:", res.currentPhaseTarget);
      console.log("Drawdown:", res.currentPhaseDrawdown);
      console.log("Lotes:", res.currentPhaseLotLimit);
      console.log("Condições Avanço:", res.conditionsToAdvance);
      console.log("Total Fases:", res.totalPhases);
      console.groupEnd();
    }
  });

  let activePhase = $derived.by((): DomainGrowthPhase | null => {
    if (growthContext?.growthPhase) return growthContext.growthPhase;
    
    // Fallback defensivo para o plano global do perfil
    const planId = activeProfile?.growth_plan_id;
    if (!planId) return null;
    
    const plan = riskSettingsStore.growthPlans.find(p => p.id === planId);
    if (!plan || !plan.phases || plan.phases.length === 0) return null;
    
    const phaseIndex = plan.current_phase_index ?? 0;
    const dbPhase = (plan.phases[phaseIndex] || plan.phases[0]) as any;
    
    if (!dbPhase && nextPhase && growthContext?.resolution) {
        const resolution = growthContext.resolution;
        return {
            id: "next-phase-fallback",
            name: (nextPhase as any).name || $t('risk.messages.nextPhaseFallback'),
            level: (nextPhase as any).level || ((resolution.currentPhaseIndex || 0) + 2),
            lot_size: (nextPhase as any).lot_size || 0,
            conditions_to_advance: (nextPhase as any).conditions_to_advance || [],
            conditions_to_demote: (nextPhase as any).conditions_to_demote || []
        } as any;
    }
    return dbPhase ? adaptGrowthPhaseToDomain(dbPhase) || null : null;
  });
  
  let nextPhase = $derived.by((): DomainGrowthPhase | null => {
     return riskStore.nextGrowthPhase || null;
  });
  
  let profitGoal = $derived(
      activePhase?.conditionsToAdvance?.find((c: any) => 
        c.metric === 'profit' || 
        c.metric === 'profit_target' || 
        c.metric === 'totalTarget' ||
        c.metric === 'target_financial'
      )?.value || 0
  );
  
  let currentLimit = $derived(cockpit?.dailyRiskStatus?.effectiveMaxDailyLoss || activeProfile?.max_daily_loss || 0);
  let limitLabel = $derived(growthEval ? $t('risk.cockpit.stats.stageLimit') : $t('risk.cockpit.stats.globalLimit'));
  let ptcLoss = $derived(Math.min((dailyDrawdown / (currentLimit || 1)) * 100, 100));
  let isLossHot = $derived(ptcLoss > 80);

  function formatValue(val: number) {
    return new Intl.NumberFormat($locale || "en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(val);
  }

  let accountOptions = $derived([
    ...accountsStore.accounts.map(acc => ({ value: acc.id, label: acc.nickname }))
  ]);

  let activeAccountId = $state<string>("");

  $effect(() => {
    // 1. Inicia o dropdown com a conta salva na store, ou a primeira disponível
    if (!activeAccountId && accountsStore.accounts.length > 0) {
      activeAccountId = riskStore.activeAccountId || accountsStore.accounts[0].id;
    }
    
    // 2. Defesa contra IDs fantasmas: se a conta sumiu, força a primeira
    if (activeAccountId && accountsStore.accounts.length > 0) {
       const exists = accountsStore.accounts.some(a => a.id === activeAccountId);
       if (!exists) {
           activeAccountId = accountsStore.accounts[0].id;
       }
    }
  });

  $effect(() => {
    // 3. Sincroniza a escolha local com o motor global
    if (activeAccountId && riskStore.activeAccountId !== activeAccountId) {
       riskStore.activeAccountId = activeAccountId;
    }
  });

</script>

<div class="flex-1 flex flex-col space-y-8 p-4 md:p-8 animate-in fade-in duration-500 min-h-screen">
  
  <!-- TOP NAVIGATION (INSTITUTIONAL STANDARD) -->
  <SystemCard status="primary" class="p-4 shadow-2xl bg-primary/5 overflow-visible! relative z-[70]">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-6">
        <SystemHeader 
          title={cockpit?.profileName || $t('risk.cockpit.title')}
          subtitle={$t('risk.cockpit.subtitle')}
          icon={Shield}
          variant="page"
          class="mb-0"
        />
        
        <Separator orientation="vertical" class="h-10 opacity-10" />
        
        {#if activeProfile}
          <div class="flex items-center gap-3">
            <div class="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 group hover:border-indigo-500/30 transition-all whitespace-nowrap">
              <Shield class="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span class="text-foreground/90">{activeProfile?.name}</span>
            </div>
            {#if growthContext?.resolution}
              {@const res = growthContext.resolution}
              <div class={cn(
                  "px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-4 transition-all whitespace-nowrap",
                  res.source === 'scope' 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                      : "bg-indigo-500/5 border-indigo-500/10 text-indigo-400/80"
              )}>
                <div class="flex items-center gap-2">
                  <Layers class="w-3 h-3 shrink-0" />
                  <span class="whitespace-nowrap">
                      {res.source === 'scope' ? `${$t('risk.cockpit.group').toUpperCase()}: ${res.scopeName}` : `${$t('risk.cockpit.globalMode').toUpperCase()}: ${res.currentPhaseName}`}
                  </span>
                </div>
                
                {#if res.source === 'scope' && res.assetIds.length > 0}
                  <Separator orientation="vertical" class="h-3 opacity-20 bg-emerald-500" />
                  <div class="flex items-center gap-1.5 overflow-hidden max-w-[200px]">
                    <span class="text-[8px] opacity-60">{$t('risk.cockpit.assetsInScope').toUpperCase()}:</span>
                    {#each res.assetIds as aid}
                      <span class="text-[8px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                        {assetsStore.assets.find(a => a.id === aid)?.symbol}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="flex items-center gap-3 h-full ml-auto">
        <!-- Seletor de Conta (USANDO COMPONENTE OFICIAL SYSTEMSELECT) -->
        <SystemSelect 
          label={$t("common.account")}
          options={accountOptions}
          bind:value={activeAccountId}
          class="min-w-[240px]"
        />
      </div>
    </div>
  </SystemCard>

  {#if !activeProfile}
    <div class="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden group">
      <!-- Technical Background Overlay -->
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:30px_30px] animate-pulse"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent opacity-50"></div>
      
      <div class="relative z-10 text-center max-w-lg">
        <!-- Technical Label -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
          <span class="text-[9px] font-black uppercase tracking-[0.3em] text-rose-500/70">{$t("risk.cockpit.terminalOffline")}</span>
        </div>

        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl relative transition-all duration-700 group-hover:scale-110 group-hover:border-rose-500/30">
          <div class="absolute inset-0 rounded-full bg-rose-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Lock class="w-10 h-10 text-muted-foreground/40 group-hover:text-rose-400 transition-colors" />
        </div>

        <h2 class="text-2xl md:text-3xl font-black tracking-tighter uppercase mb-4 text-white leading-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          {$t('risk.cockpit.noProfile')}
        </h2>
        
        <div class="flex flex-col items-center gap-6">
          <p class="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] opacity-40 max-w-xs mx-auto leading-relaxed">
            {$t('risk.cockpit.noProfileDesc')}
          </p>

          <Button 
            variant="default" 
            class="rounded-full h-11 px-8 bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:scale-105 active:scale-95"
            onclick={() => {
              goto("/settings/risk");
            }}
          >
            <Shield class="w-4 h-4 mr-2" />
            {$t('risk.plan.activate')}
          </Button>
        </div>

        <!-- Terminal Decorator -->
        <div class="mt-12 flex items-center justify-center gap-12 text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">
          <span class="flex items-center gap-1.5"><Activity class="w-3 h-3" /> ENGINE_V4.1</span>
          <span class="flex items-center gap-1.5"><Globe class="w-3 h-3" /> NETWORK_READY</span>
        </div>
      </div>
    </div>
  {:else}
    <!-- OPERATIONAL STATUS BAR -->
    <SystemCard 
      status={mainStatus === 'blocked' ? 'danger' : mainStatus === 'caution' ? 'warning' : 'success'}
      class="relative overflow-hidden p-3 transition-all duration-700 shadow-2xl group flex items-center z-[10]"
    >
      <!-- Technical Grid Overlay -->
      <div class="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div class="relative z-10 flex flex-col lg:flex-row items-center gap-6 w-full">

        <div class="flex items-center gap-6 shrink-0">
          <div class={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-inner",
            mainStatus === 'blocked' ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/10" : 
            mainStatus === 'caution' ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/10" : 
            "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10"
          )}>
            {#if mainStatus === 'blocked'} <ShieldAlert class="w-6 h-6" />
            {:else if mainStatus === 'caution'} <AlertTriangle class="w-6 h-6" />
            {:else} <ShieldCheck class="w-6 h-6" /> {/if}
          </div>
          <SystemHeader 
            title={mainStatus === 'blocked' ? $t('risk.cockpit.status.systemLocked') : mainStatus === 'caution' ? $t('risk.cockpit.status.orangeAlert') : $t('risk.cockpit.status.clearTrack')}
            subtitle={$t('risk.cockpit.status.terminalStatus')}
            variant="compact"
            class={cn(
                "mb-0",
                mainStatus === 'blocked' ? "text-rose-400" : 
                mainStatus === 'caution' ? "text-amber-400" : 
                "text-emerald-400"
            )}
          />
        </div>

        <Separator orientation="vertical" class="hidden lg:block h-12 opacity-10" />

        <div class="flex-1">
          <p class="text-[11px] font-black uppercase tracking-widest leading-relaxed text-foreground/80 max-w-4xl">
            {#if mainStatus === 'blocked'}
              {validation?.reasons[0] ? $t(`risk.violations.${validation.reasons[0]}`, { default: validation.reasons[0] }) : $t('risk.cockpit.supervisor.blocked')}
            {:else if mainStatus === 'caution'}
              {validation?.warnings[0] ? $t(`risk.violations.${validation.warnings[0]}`, { default: validation.warnings[0] }) : $t('risk.cockpit.supervisor.caution')}
            {:else}
              {$t('risk.cockpit.status.onPlanSlogan')}
            {/if}
          </p>
        </div>

        {#if mainStatus === 'allowed'}
          <div class="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 shadow-inner">
            <div class="relative w-2 h-2">
                <div class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                <div class="relative rounded-full bg-emerald-500 w-2 h-2"></div>
            </div>
            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400/90">{$t('risk.cockpit.status.clearPath')}</span>
          </div>
        {/if}
      </div>
    </SystemCard>

      <!-- MAIN GRIDS -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      <!-- LEFT: RISK ZONE (Layer 1: Financial Daily) -->
      <SystemCard status="danger" class="flex flex-col min-h-[380px] overflow-hidden group p-4 space-y-4">
          <SystemHeader 
            title={$t('risk.cockpit.sections.ruinRisk')}
            icon={ShieldAlert}
            class="mb-0 text-xs font-black uppercase tracking-widest"
          >
            {#snippet actions()}
              <Badge variant="outline" class="text-[7px] font-black uppercase tracking-[0.2em] border-white/5 bg-white/5 text-muted-foreground/60">{$t('risk.cockpit.status.realTimeMonitor')}</Badge>
            {/snippet}
          </SystemHeader>

          <div class="space-y-6 text-foreground">
            <div class="flex items-center justify-between">
                <div class="space-y-1">
                    <div class="flex items-center gap-2 px-1">
                        <label class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                            {$t('risk.growth.metrics.drawdown').toUpperCase()} ({$t('risk.cockpit.stats.inversion').toUpperCase()})
                        </label>
                        <Badge variant="outline" class="h-4 px-1.5 text-[6px] font-black border-rose-500/30 text-rose-500 bg-rose-500/5 uppercase tracking-widest shadow-none">
                            {$t('risk.cockpit.status.realTimeMonitor').toUpperCase()}
                        </Badge>
                    </div>
                    <h3 class="text-xs font-black text-foreground/80 uppercase tracking-tight px-1">
                        {$t('risk.cockpit.stats.stageLimit')}
                    </h3>
                </div>
                <div class="text-right">
                    <span class="text-3xl font-black text-rose-500 tabular-nums tracking-tighter">
                        {formatValue(currentLimit)}
                    </span>
                </div>
            </div>
            
            <!-- Progress Bars Section -->
            <div class="space-y-4 pt-2">
                <div class="space-y-1.5">
                    <div class="flex justify-between text-[7px] font-black uppercase tracking-[0.2em] opacity-40 px-1">
                        <span>{$t('risk.cockpit.stats.drawdownProgression').toUpperCase()} ({$t('risk.cockpit.stats.intraday').toUpperCase()})</span>
                        <span>{((cockpit?.dailyRiskStatus?.maxDailyDrawdown || 0) / (currentLimit || 1) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="relative w-full h-6 bg-black/5 dark:bg-black/60 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 p-0.5 shadow-inner">
                        <div 
                            class={cn(
                                "absolute top-0.5 left-0.5 bottom-0.5 transition-all duration-1000 rounded-md flex items-center justify-end px-3",
                                isLossHot ? "bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.2)]" : "bg-gradient-to-r from-rose-500/40 to-rose-500/80"
                            )} 
                            style="width: calc({Math.min(((cockpit?.dailyRiskStatus?.maxDailyDrawdown || 0) / (currentLimit || 1) * 100), 100)}% - 4px)"
                        >
                        </div>
                    </div>
                </div>

                <div class="space-y-1.5">
                    <div class="flex justify-between text-[7px] font-black uppercase tracking-[0.2em] opacity-40 px-1">
                        <span>{$t('risk.growth.metrics.drawdown').toUpperCase()} ({$t('risk.cockpit.stats.maxPhase').toUpperCase()})</span>
                        <span>{activePhase?.maxDrawdownAmount && activePhase.maxDrawdownAmount > 0 
                            ? ((growthEval?.metrics.drawdownAmount || 0) / activePhase.maxDrawdownAmount * 100).toFixed(1) 
                            : '0.0'}%</span>
                    </div>
                    <div class="relative w-full h-6 bg-black/5 dark:bg-black/60 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 p-0.5 shadow-inner">
                        <div 
                            class={cn(
                                "absolute top-0.5 left-0.5 bottom-0.5 transition-all duration-1000 rounded-md flex items-center justify-end px-3",
                                activePhase?.maxDrawdownAmount && (growthEval?.metrics.drawdownAmount || 0) > activePhase.maxDrawdownAmount * 0.8 ? "bg-gradient-to-r from-amber-600 to-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-gradient-to-r from-amber-500/40 to-amber-500/80"
                            )} 
                            style="width: calc({activePhase?.maxDrawdownAmount && activePhase.maxDrawdownAmount > 0 ? Math.min(((growthEval?.metrics.drawdownAmount || 0) / activePhase.maxDrawdownAmount * 100), 100) : 0}% - 4px)"
                        >
                        </div>
                    </div>
                    <div class="flex justify-between px-1">
                        <span class="text-[7px] font-black text-muted-foreground/40 uppercase">{$t('risk.cockpit.stats.actual')}: {formatValue(growthEval?.metrics.drawdownAmount || 0)}</span>
                        <span class="text-[7px] font-black text-muted-foreground/40 uppercase">
                            {$t('risk.cockpit.stats.limit')}: {activePhase?.maxDrawdownAmount && activePhase.maxDrawdownAmount > 0 ? formatValue(activePhase.maxDrawdownAmount) : '(N/A)'}
                        </span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-rose-500/5 dark:bg-rose-500/10 p-5 rounded-3xl border border-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.05)]">
                  <p class="text-[9px] font-black text-rose-500/60 uppercase tracking-[0.2em] mb-2">{$t('risk.cockpit.stats.consumed')}</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-black font-mono text-rose-500 tabular-nums">
                      {formatValue(cockpit?.dailyRiskStatus?.dailyGrossLoss || 0)}
                    </span>
                  </div>
              </div>

              <div class="bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)] text-right">
                  <p class="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-2">{$t('risk.cockpit.stats.remaining')}</p>
                  <div class="flex items-baseline justify-end gap-2">
                    <span class="text-2xl font-black font-mono text-emerald-500 tabular-nums">
                      {formatValue(cockpit?.dailyRiskStatus?.remainingLossAllowance || 0)}
                    </span>
                  </div>
              </div>
            </div>
          </div>

          <!-- Operational Rules Checklist -->
          <div class="space-y-1.5 border-t border-border/10 pt-4">
              <p class="text-[8px] font-black text-rose-500/40 uppercase tracking-[0.3em] px-1 mb-1">
                {$t('risk.cockpit.sections.operationalRules')}
              </p>
              
              <div class="grid gap-1.5">
                  <div class="flex items-center justify-between p-2 rounded-xl bg-muted/5 dark:bg-secondary/30 border border-border/50 group">
                      <div class="flex items-center gap-3">
                          <div class={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center bg-background border",
                              !cockpit?.dailyRiskStatus?.dailyLossHit ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500"
                          )}>
                              {#if !cockpit?.dailyRiskStatus?.dailyLossHit}
                                  <CheckCircle2 class="w-3 h-3" />
                              {:else}
                                  <ShieldAlert class="w-3 h-3" />
                              {/if}
                          </div>
                          <span class="text-[9px] font-black uppercase tracking-widest text-foreground/80">{$t('risk.cockpit.sections.dailyLoss')}</span>
                      </div>
                      <span class={cn("text-[9px] font-black font-mono", !cockpit?.dailyRiskStatus?.dailyLossHit ? "text-emerald-500" : "text-rose-500")}>
                          {!cockpit?.dailyRiskStatus?.dailyLossHit ? $t('risk.cockpit.stats.ok') : $t('risk.cockpit.stats.hit')}
                      </span>
                  </div>

                  <div class="flex items-center justify-between p-2 rounded-xl bg-muted/5 dark:bg-secondary/30 border border-border/50 group">
                      <div class="flex items-center gap-3">
                          <div class={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center bg-background border",
                              (growthEval?.metrics.drawdownAmount || 0) < (activePhase?.maxDrawdownAmount || 1) ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500"
                          )}>
                              {#if (growthEval?.metrics.drawdownAmount || 0) < (activePhase?.maxDrawdownAmount || 1)}
                                  <CheckCircle2 class="w-3 h-3" />
                              {:else}
                                  <ShieldAlert class="w-3 h-3" />
                              {/if}
                          </div>
                          <span class="text-[9px] font-black uppercase tracking-widest text-foreground/90">{$t('risk.cockpit.sections.drawdown')}</span>
                      </div>
                      <span class={cn("text-[9px] font-black font-mono", (growthEval?.metrics.drawdownAmount || 0) < (activePhase?.maxDrawdownAmount || 1) ? "text-emerald-500" : "text-rose-500")}>
                        {(growthEval?.metrics.drawdownAmount || 0) < (activePhase?.maxDrawdownAmount || 1) ? $t('risk.cockpit.stats.ok') : $t('risk.cockpit.stats.max')}
                      </span>
                  </div>
              </div>
          </div>

          <!-- Allowed Size -->
          <div class="p-5 rounded-3xl bg-rose-500/[0.03] border border-rose-500/10 flex items-center justify-between group hover:bg-rose-500/[0.05] transition-all">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <ShieldAlert class="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p class="text-[9px] font-black text-rose-500/60 uppercase tracking-[0.3em]">{$t('risk.cockpit.stats.allowedSizing')}</p>
                  <h4 class="text-sm font-black text-foreground uppercase">{$t('risk.cockpit.stats.blockedStatus')}</h4>
                </div>
              </div>
              <Badge variant="outline" class="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-black uppercase py-1 px-3">
                {$t('risk.cockpit.stats.blockedStatus')}
              </Badge>
          </div>

          <!-- Violations list -->
          {#if validation && !validation.allowed && validation.reasons && validation.reasons.length > 0}
            <div class="mt-auto pt-4 space-y-2">
              <p class="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500 opacity-60 px-1">{$t('risk.cockpit.sections.registeredViolations')}</p>
              <div class="space-y-1">
                  {#each validation.reasons as reason}
                    <div class="flex items-center gap-2 text-[10px] font-black text-rose-400/90 uppercase tracking-widest bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 animate-in slide-in-from-left duration-300">
                      <TrendingDown class="w-3 h-3 shrink-0 text-rose-500/40" />
                      <span>{$t(`risk.violations.${reason}`, { default: reason })}</span>
                    </div>
                  {/each}
              </div>
            </div>
          {/if}
      </SystemCard>

      <!-- RIGHT: EVOLUTION ZONE (Layer 2 & 3: Growth & Progression) -->
      <SystemCard status="success" class="flex flex-col min-h-[450px] overflow-hidden group p-4">
          {#if activeProfile}
            <SurvivorJourney />
          {:else}
            <div class="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-20">
              <Layers class="w-12 h-12" />
              <p class="text-xs font-black uppercase tracking-widest">{$t('risk.cockpit.noProfile')}</p>
            </div>
          {/if}
      </SystemCard>
    </div>

    <!-- AI ADVISOR BOTTOM PANEL (PILL BAR STANDARD) -->
    <div class="w-full card-glass rounded-full p-1.5 shadow-xl border-indigo-500/10 flex items-center gap-4 group hover:border-indigo-500/20 transition-all">
      <div class="relative flex items-center justify-center shrink-0 ml-1">
          <div class="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full scale-75 group-hover:scale-110 transition-transform duration-500"></div>
          <div class="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-2xl relative z-10 transition-all duration-300 group-hover:rotate-12">
              <Brain class="w-5 h-5 text-indigo-400" />
          </div>
      </div>

      <div class="flex-1 flex flex-col md:flex-row items-center gap-1 md:gap-4">
        <span class="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] opacity-40">{$t('risk.cockpit.sections.emotionalSupervisor')}</span>
        
        <p class="text-[11px] font-black text-foreground/90 uppercase tracking-tighter leading-none line-clamp-1">
          {#if mainStatus === 'blocked'}
            {$t('risk.cockpit.supervisor.blocked')}
          {:else if mainStatus === 'caution'}
            {$t('risk.cockpit.supervisor.caution')}
          {:else if cockpit?.dailyRiskStatus?.dailyPnL && (cockpit.dailyRiskStatus.dailyPnL) > (profitGoal * 0.7) && profitGoal > 0}
            {$t('risk.cockpit.supervisor.targetHigh')}
          {:else}
            {$t('risk.cockpit.supervisor.stable')}
          {/if}
        </p>
      </div>

      <div class="hidden md:flex items-center gap-2 pr-4">
        <Badge variant="outline" class="h-5 text-[8px] border-indigo-500/10 bg-indigo-500/5 text-indigo-400 font-black uppercase tracking-widest shadow-none">{$t('risk.cockpit.status.active')}</Badge>
      </div>
    </div>
  {/if}
</div>

<AlertDialog.Root bind:open={isRestartModalOpen}>
    <AlertDialog.Content class="bg-black/90 border-white/5 backdrop-blur-xl">
        <AlertDialog.Header>
            <AlertDialog.Title class="text-sm font-black uppercase tracking-[0.2em] text-rose-500">
                {$t('risk.growthPlan.actions.restart')}
            </AlertDialog.Title>
            <AlertDialog.Description class="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-relaxed">
                {$t('risk.messages.restartConfirm')}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer class="gap-3">
            <AlertDialog.Cancel class="bg-white/5 border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 h-10 px-6">
                {$t('common.cancel')}
            </AlertDialog.Cancel>
            <AlertDialog.Action 
                class="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 h-10 px-6 shadow-lg shadow-rose-500/20"
                onclick={() => {
                    riskStore.restartGrowthPlan();
                    toast.success($t('risk.messages.restartSuccess'));
                    isRestartModalOpen = false;
                }}
            >
                {$t('risk.growthPlan.actions.restart')}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<style>
  /* Base reset for terminal fonts */
  :global(body) {
    letter-spacing: -0.01em;
  }

  @keyframes pulse-slow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>


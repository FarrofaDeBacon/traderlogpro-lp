<script lang="ts">
  import { riskStore } from "$lib/stores/riskStore.svelte";
  import { tradesStore } from "$lib/stores/trades.svelte";
  import { accountsStore } from "$lib/stores/accounts.svelte";
  import { t, locale } from "svelte-i18n";
  import { 
    Layers, 
    CheckCircle2, 
    Circle, 
    TrendingUp, 
    Info, 
    Target, 
    Calendar, 
    Wallet, 
    ShieldAlert, 
    AlertCircle, 
    History,
    RotateCcw,
    Activity
  } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";

  let growthContext = $derived(riskStore.resolvedGrowthContext);
  let growthEval = $derived(riskStore.globalGrowthEvaluation);
  let activePhase = $derived(growthContext?.growthPhase);
  let resolution = $derived(growthContext?.resolution);

  // Derived conditions for cleaner template
  let profitCond = $derived(growthEval?.advanceConditions?.find(c => c.canonical === 'net_pnl'));
  let dailyCond = $derived(growthEval?.advanceConditions?.find(c => c.canonical === 'daily_target' || c.canonical === 'today_profit'));
  let daysCond = $derived(growthEval?.advanceConditions?.find(c => c.canonical === 'positive_sessions' || c.canonical === 'operated_days' || c.metric === 'days'));
  
  let otherAdvance = $derived(growthEval?.advanceConditions?.filter(c => 
    c.canonical !== 'net_pnl' && 
    c.canonical !== 'daily_target' && 
    c.canonical !== 'today_profit' && 
    c.canonical !== 'positive_sessions' && 
    c.canonical !== 'operated_days' &&
    c.metric !== 'days'
  ) || []);

  // Calcula o progresso geral do plano (0 a 100)
  let totalProgress = $derived.by(() => {
    if (!resolution) return 0;
    const baseProgress = (resolution.currentPhaseIndex / resolution.totalPhases) * 100;
    
    // Adiciona o progresso dentro da fase atual
    if (growthEval?.advanceConditions && growthEval.advanceConditions.length > 0) {
      const currentPhaseWeight = 100 / resolution.totalPhases;
      const metConditions = growthEval.advanceConditions.filter(c => c.isMet).length;
      const conditionProgress = (metConditions / growthEval.advanceConditions.length) * currentPhaseWeight;
      return Math.min(99, baseProgress + conditionProgress);
    }
    return baseProgress;
  });

  function formatCurrency(val: number) {
    const currency = growthContext?.referenceAccount?.currency || accountsStore.mainCurrency || 'BRL';
    return new Intl.NumberFormat($locale || 'en-US', { 
      style: 'currency', 
      currency: currency 
    }).format(val);
  }

  const netPnL = $derived(growthEval?.metrics?.netPnL || 0);

  // Read the configuration directly from the Growth Plan
  let isCumulative = $derived(growthContext?.growthPlan?.phase_target_mode === 'cumulative');


</script>

<div class="flex flex-col h-full space-y-6">
  <!-- PHASE HEADER -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
        <Layers class="w-6 h-6 text-emerald-400" />
      </div>
      <div>
        <p class="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">{$t('risk.growth.title')}</p>
        <h3 class="text-sm font-black text-foreground uppercase tracking-widest">
          {$t('risk.cockpit.stats.currentPhase')} {resolution?.currentPhaseIndex + 1 || 1}
        </h3>
      </div>
    </div>


  </div>

  <div class="flex-1 space-y-8">
    <!-- TARGET STATUS -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{$t('risk.cockpit.stats.goal')}</span>
            <Badge variant="outline" class="h-5 px-2 text-[8px] font-black border-emerald-500/30 text-emerald-500 bg-emerald-500/5 uppercase tracking-widest">{$t('risk.management.phase').toUpperCase()} {resolution?.currentPhaseIndex + 1 || 1}</Badge>
          </div>
          <h4 class="text-sm font-black text-foreground/80 uppercase tracking-tight">{activePhase?.name || ($t('risk.management.phase') + ' 1')}</h4>
        </div>
        <div class="text-right">
          <span class="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">
            {formatCurrency(resolution?.currentPhaseTarget || 0)}
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Main Profit Progress -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-40 px-1">
            <span>{$t('risk.growth.metrics.profit')} ({$t('risk.cockpit.stats.currentPhase')})</span>
            <span>{Math.min(100, (netPnL / (resolution?.currentPhaseTarget || 1) * 100)).toFixed(1)}%</span>
          </div>
          <div class="relative w-full h-8 bg-black/5 dark:bg-black/60 rounded-xl overflow-hidden border border-black/5 dark:border-white/5 p-1 shadow-inner">
            <div 
              class="absolute top-1 left-1 bottom-1 bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 rounded-lg flex items-center justify-end px-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
              style="width: calc({Math.min(100, (netPnL / (resolution?.currentPhaseTarget || 1) * 100))}% - 8px)"
            >
              {#if (netPnL / (resolution?.currentPhaseTarget || 1)) > 0.1}
                <TrendingUp class="w-3 h-3 text-white/40" />
              {/if}
            </div>
          </div>
        </div>

        <!-- Consistency Days Progress -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-40 px-1">
            <span>{$t('risk.growth.metrics.days')} ({$t('risk.cockpit.stats.actual')})</span>
            <span>{daysCond ? Math.min(100, (daysCond.current / daysCond.target * 100)).toFixed(1) : 0}%</span>
          </div>
          <div class="relative w-full h-4 bg-black/5 dark:bg-black/60 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 p-0.5 shadow-inner">
            <div 
              class="absolute top-0.5 left-0.5 bottom-0.5 bg-indigo-500/40 transition-all duration-1000 rounded-md" 
              style="width: calc({daysCond ? Math.min(100, (daysCond.current / daysCond.target * 100)) : 0}% - 4px)"
            ></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-indigo-500/5 dark:bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <p class="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.2em] mb-2">{$t('risk.cockpit.stats.actual')}</p>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black font-mono text-indigo-500 tabular-nums">
                {formatCurrency(netPnL)}
              </span>
            </div>
        </div>

        <div class="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)] text-right">
            <p class="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-2">{$t('risk.cockpit.stats.pending')}</p>
            <div class="flex items-baseline justify-end gap-2">
              <span class="text-2xl font-black font-mono text-emerald-500 tabular-nums">
                {formatCurrency(Math.max(0, (resolution?.currentPhaseTarget || 0) - netPnL))}
              </span>
            </div>
        </div>
      </div>
    </div>
    <!-- REQUIREMENTS CHECKLIST -->
    <div class="space-y-4">
      <p class="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.3em] px-1">
        {$t('risk.states.evolutionRequirements')}
      </p>
      
      <div class="grid gap-1.5">
        {#if profitCond}
          <div class="flex items-center justify-between p-2 rounded-xl bg-muted/5 dark:bg-secondary/30 border border-border/50 group">
            <div class="flex items-center gap-3">
              <div class={cn(
                "w-6 h-6 rounded-full flex items-center justify-center bg-background border",
                profitCond.isMet ? "border-emerald-500/30 text-emerald-500" : "border-indigo-500/30 text-indigo-500"
              )}>
                {#if profitCond.isMet}
                  <CheckCircle2 class="w-3 h-3" />
                {:else}
                  <Target class="w-3 h-3" />
                {/if}
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-foreground/80">{$t('risk.growth.metrics.profit')}</span>
            </div>
            <div class="flex flex-col items-end">
              <span class={cn("text-[10px] font-black font-mono", profitCond.isMet ? "text-emerald-500" : "text-indigo-500")}>
                {profitCond.isMet ? $t('risk.cockpit.stats.ok') : $t('risk.cockpit.stats.pendingStatus')}
              </span>
              <span class="text-[11px] font-bold opacity-40 font-mono">
                {formatCurrency(profitCond.current)} / {formatCurrency(profitCond.target)}
              </span>
            </div>
          </div>
        {/if}

        {#if dailyCond}
          <div class="flex items-center justify-between p-2 rounded-xl bg-muted/5 dark:bg-secondary/30 border border-border/50 group">
            <div class="flex items-center gap-3">
              <div class={cn(
                "w-6 h-6 rounded-full flex items-center justify-center bg-background border",
                dailyCond.isMet ? "border-emerald-500/30 text-emerald-500" : "border-indigo-500/30 text-indigo-500"
              )}>
                {#if dailyCond.isMet}
                  <CheckCircle2 class="w-3 h-3" />
                {:else}
                  <Activity class="w-3 h-3" />
                {/if}
              </div>
              <span class="text-xs font-black uppercase tracking-widest text-foreground/80">{$t('risk.growth.metrics_labels.daily_pnl')}</span>
            </div>
            <div class="flex flex-col items-end">
              <span class={cn("text-[10px] font-black font-mono", dailyCond.isMet ? "text-emerald-500" : "text-indigo-500")}>
                {dailyCond.isMet ? $t('risk.cockpit.stats.ok') : $t('risk.cockpit.stats.pendingStatus')}
              </span>
              <span class="text-xs font-bold opacity-40 font-mono">
                {formatCurrency(dailyCond.current)} / {formatCurrency(dailyCond.target)}
              </span>
            </div>
          </div>
        {/if}

        {#each otherAdvance as cond}
          <div class="flex items-center justify-between p-2 rounded-xl bg-muted/5 dark:bg-secondary/30 border border-border/50 group">
            <div class="flex items-center gap-3">
              <div class={cn(
                "w-6 h-6 rounded-full flex items-center justify-center bg-background border",
                cond.isMet ? "border-emerald-500/30 text-emerald-500" : "border-muted-foreground/10 text-muted-foreground/30"
              )}>
                {#if cond.isMet}
                  <CheckCircle2 class="w-3 h-3" />
                {:else}
                  <Circle class="w-2 h-2" />
                {/if}
              </div>
              <span class="text-xs font-black uppercase tracking-widest text-foreground/80">
                  {cond.label_key ? $t(cond.label_key) : ($t(`risk.cockpit.engine.${cond.metric?.toLowerCase()}`) || cond.metric)}
              </span>
            </div>
            <div class="flex flex-col items-end">
              <span class={cn("text-[10px] font-black font-mono", cond.isMet ? "text-emerald-500" : "text-muted-foreground/40")}>
                {cond.isMet ? $t('risk.cockpit.stats.ok') : $t('risk.cockpit.stats.pendingStatus')}
              </span>
              <span class="text-xs font-bold opacity-40 font-mono">
                {#if cond.unit === '$'}
                  {formatCurrency(cond.current)} / {formatCurrency(cond.target)}
                {:else}
                  {cond.current.toFixed(cond.unit === '%' ? 1 : 0)}{cond.unit} / {cond.target.toFixed(cond.unit === '%' ? 1 : 0)}{cond.unit}
                {/if}
              </span>
            </div>
          </div>
        {/each}

        <!-- SAFETY / REGRESSION RULES -->
        {#if growthEval?.demoteConditions && growthEval.demoteConditions.length > 0}
          <Separator class="my-2 opacity-10" />
          {#each growthEval.demoteConditions as cond}
            <div class="flex items-center justify-between p-2 rounded-xl bg-rose-500/[0.03] border border-rose-500/10 group">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center bg-background border border-emerald-500/20 text-emerald-500">
                  <CheckCircle2 class="w-3 h-3" />
                </div>
                <span class="text-xs font-black uppercase tracking-widest text-foreground/80">
                  {cond.label_key ? $t(cond.label_key) : ($t(`risk.cockpit.engine.${cond.metric?.toLowerCase()}`) || cond.metric)}
                </span>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-[10px] font-black font-mono text-emerald-500">
                  {$t('risk.cockpit.stats.ok')}
                </span>
                <span class="text-xs font-bold opacity-40 font-mono">
                  {#if cond.unit === '$'}
                    {formatCurrency(cond.current)} &lt; {formatCurrency(cond.target)}
                  {:else}
                    {cond.current.toFixed(cond.unit === '%' ? 1 : 0)}{cond.unit} &lt; {cond.target.toFixed(cond.unit === '%' ? 1 : 0)}{cond.unit}
                  {/if}
                </span>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <div class="flex flex-col items-center gap-4 pt-8 border-t border-border/5">
    <div class="w-full max-w-sm animate-in zoom-in duration-500 space-y-2">
      {#if growthEval?.canPromote}
        <p class="text-[8px] font-bold text-emerald-500/60 uppercase tracking-widest text-center px-4">
          {isCumulative 
            ? $t('risk.messages.cumulativeDesc')
            : $t('risk.messages.resetDesc')}
        </p>
      {:else}
        <p class="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest text-center px-4">
          {$t('risk.messages.lockedDesc')}
        </p>
      {/if}

        <Button
        variant="default"
        class={cn(
            "w-full h-12 font-black uppercase tracking-[0.2em] rounded-2xl transition-all",
            growthEval?.canPromote 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02]" 
                : "bg-muted text-muted-foreground/40 cursor-not-allowed opacity-50"
        )}
        disabled={!growthEval?.canPromote}
        onclick={() => riskStore.promotePhase(!isCumulative)}
      >
        <TrendingUp class="w-4 h-4 mr-2" />
        {$t('risk.messages.advanceTo', { phase: (resolution?.currentPhaseIndex || 0) + 2 })}
      </Button>
    </div>

    <Button
      variant="ghost"
      size="sm"
      class="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 hover:text-rose-500 transition-all"
      onclick={() => riskStore.restartGrowthPlan()}
    >
      <RotateCcw class="w-4 h-4 mr-2" />
      {$t('risk.actions.restart')}
    </Button>
  </div>

</div>

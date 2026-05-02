<script lang="ts">
  import { riskSettingsStore } from "$lib/stores/risk-settings.svelte";
  import {
    Shield,
    Target,
    Lock,
    AlertTriangle,
    TrendingUp,
    Clock,
    Ban,
    CheckCircle2,
  } from "lucide-svelte";
  import { t } from "svelte-i18n";
  import type { RiskProfile } from "$lib/types";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";

  let { profile } = $props<{ profile: RiskProfile }>();

  let currentPlan = $derived(
    profile.growth_plan_id ? riskSettingsStore.getGrowthPlanForProfile(profile.id) : null
  );

  function getEffectiveLimits(p: RiskProfile) {
    let dailyLoss = p.max_daily_loss;
    let dailyTarget = p.daily_target;
    let targetUnit = '$';
    let lossUnit = '$';

    // 1. Prioridade: Plano de Crescimento Ativo (Overwrites static limits)
    if (p.growth_plan_governance_enabled && currentPlan && currentPlan.phases) {
      const phase = currentPlan.phases[currentPlan.current_phase_index];
      if (phase) {
        const normalize = (s: string) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');

        // Encontra a meta de lucro nas condições de avanço
        const targetCond = phase.conditions_to_advance?.find(c => {
          const m = normalize(c.metric);
          return ['profit', 'netpnl', 'profittarget', 'metadelucro', 'meta', 'pnl'].includes(m);
        });
        if (targetCond) {
          dailyTarget = targetCond.value;
          targetUnit = currentPlan.target_unit === 'points' ? 'pts' : '$';
        }

        // Encontra o limite de perda nas condições de regressão ou avanço (daily loss)
        const lossCond = phase.conditions_to_demote?.find(c => {
          const m = normalize(c.metric);
          return ['dailyloss', 'maxdailyloss', 'perdadiaria', 'lossdiario', 'drawdown'].includes(m);
        });
        if (lossCond) {
          dailyLoss = lossCond.value;
          lossUnit = currentPlan.drawdown_unit === 'points' ? 'pts' : '$';
        }
      }
    } else if (p.use_advanced_rules && p.risk_rules) {
      // 2. Fallback: Regras Avançadas (Risk Rules)
      const lossRule = p.risk_rules.find(r => r.enabled && r.target_type === 'max_daily_loss');
      if (lossRule) dailyLoss = Number(lossRule.value);

      const targetRule = p.risk_rules.find(r => r.enabled && r.target_type === 'profit_target');
      if (targetRule) dailyTarget = Number(targetRule.value);
    }

    return { dailyLoss, dailyTarget, targetUnit, lossUnit };
  }

  let limits = $derived(getEffectiveLimits(profile));
</script>

<div class="space-y-6">
  <!-- Identity Section -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
        <Shield class="w-6 h-6 {profile.active ? 'text-emerald-400' : 'text-muted-foreground/20'}" />
      </div>
      <div>
        <h2 class="text-xl font-black uppercase tracking-tighter text-white/90 leading-tight">
          {profile.name}
        </h2>
        <div class="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline" class="text-[8px] h-4 font-black uppercase tracking-wider bg-white/5 border-white/5 text-muted-foreground/60">
            {$t(`risk.accountTypes.${profile.account_type_applicability}`) || profile.account_type_applicability}
          </Badge>
          {#if profile.active}
            <Badge class="h-4 text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-0">
               ACTIVE PROFILE
            </Badge>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Operational Limits Card -->
    <div class="p-5 rounded-3xl bg-card/40 border border-white/5 space-y-4 shadow-xl">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
            <Shield class="w-3.5 h-3.5 text-primary opacity-40" />
            <h3 class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">LIMITES OPERACIONAIS</h3>
        </div>
        {#if profile.growth_plan_id && profile.growth_plan_id !== 'none'}
            <Badge class="h-4 px-2 text-[7px] font-black {profile.growth_plan_governance_enabled ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-white/5 text-muted-foreground/30 border-white/5'} uppercase">
                {profile.growth_plan_governance_enabled ? 'GOVERNADO' : 'VINCULADO'}
            </Badge>
        {/if}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="p-3 rounded-2xl bg-rose-500/[0.03] border border-rose-500/10 space-y-1">
          <span class="text-[7px] font-black text-rose-500/40 uppercase tracking-widest">PERDA DIÁRIA</span>
          <div class="flex items-baseline gap-1">
            <span class="text-xs font-black text-rose-500">{limits.lossUnit === '$' ? 'R$ ' : ''}</span>
            <span class="text-xl font-black {profile.growth_plan_governance_enabled ? 'text-amber-500' : 'text-rose-500'} tracking-tighter tabular-nums">
               {limits.dailyLoss.toLocaleString('pt-BR', { minimumFractionDigits: limits.lossUnit === '$' ? 2 : 0 })}
            </span>
          </div>
        </div>

         <div class="p-3 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-1 text-right">
          <span class="text-[7px] font-black text-emerald-500/40 uppercase tracking-widest">ALVO DIÁRIO</span>
          <div class="flex items-baseline gap-1 justify-end">
             <span class="text-xl font-black {profile.growth_plan_governance_enabled ? 'text-amber-500' : 'text-emerald-500'} tracking-tighter tabular-nums">
               {limits.dailyTarget.toLocaleString('pt-BR', { minimumFractionDigits: limits.targetUnit === '$' ? 2 : 0 })}
            </span>
            <span class="text-xs font-black text-emerald-500">{limits.targetUnit === '$' ? 'R$ ' : ''}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 px-1">
        <div class="flex flex-col gap-1">
          <span class="text-[7px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">RISCO/TRADE</span>
          <span class="text-xs font-black text-white/50">{profile.max_risk_per_trade_percent}% PERS</span>
        </div>
        <div class="flex flex-col gap-1 text-right">
          <span class="text-[7px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">ORDENS TETO</span>
          <span class="text-xs font-black text-white/50">{profile.max_trades_per_day} SLOTS</span>
        </div>
      </div>
    </div>

    <!-- Blocking Rules Card -->
    <div class="p-5 rounded-3xl bg-card/40 border border-white/5 space-y-4 shadow-xl">
      <div class="flex items-center gap-2 px-1">
          <Lock class="w-3.5 h-3.5 text-indigo-400 opacity-40" />
          <h3 class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">REGRAS DE BLOQUEIO</h3>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5">
            <div class="flex items-center gap-3">
                <div class="p-1.5 rounded-full {profile.lock_on_loss ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-muted-foreground/20'}">
                    <Shield class="w-3 h-3" />
                </div>
                <span class="text-[9px] font-black text-white/80 uppercase">TRAVA LOSS AUTOMÁTICA</span>
            </div>
            <Badge variant="outline" class="h-4 text-[8px] font-black {profile.lock_on_loss ? 'text-rose-500 border-rose-500/20' : 'text-muted-foreground/20 border-white/5'}">
                {profile.lock_on_loss ? 'ENABLE' : 'DISABLE'}
            </Badge>
        </div>

        <div class="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5">
             <div class="flex items-center gap-3">
                <div class="p-1.5 rounded-full bg-white/5 text-muted-foreground/20">
                    <Target class="w-3 h-3 text-indigo-400" />
                </div>
                <span class="text-[9px] font-black text-white/80 uppercase">RATIO MÍNIMO R/R</span>
            </div>
             <span class="text-xs font-black text-indigo-400 tracking-tighter">1:{profile.min_risk_reward}</span>
        </div>

        <div class="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
             <div class="flex items-center gap-3">
                <div class="p-1.5 rounded-full bg-white/5 text-muted-foreground/20">
                    <CheckCircle2 class="w-3 h-3" />
                </div>
                <span class="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">REGRAS DE INTELIGÊNCIA</span>
            </div>
             <Badge variant="outline" class="h-4 text-[7px] font-black border-white/5 text-muted-foreground/20 italic">
                {profile.use_advanced_rules ? 'PASS' : 'SKIP'}
            </Badge>
        </div>
      </div>
    </div>
  </div>

  <!-- Context & Governance Section -->
  <div class="p-5 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
    <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-primary opacity-60" />
            <div class="flex flex-col">
                <h3 class="text-[10px] font-black uppercase text-white tracking-widest">GOVERNANÇA E CONTEXTO</h3>
                <p class="text-[7px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Sincronização de Engine</p>
            </div>
        </div>
    </div>

    <div class="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
        <div class="flex flex-col gap-1">
            <span class="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">GROWTH PLAN CONECTADO</span>
            <span class="text-[11px] font-black text-white/80 uppercase tracking-tight">
                {currentPlan?.name ?? 'MODO STANDALONE'}
            </span>
        </div>
        {#if currentPlan}
            <Badge class="bg-amber-500/20 text-amber-500 border-amber-500/20 font-black text-[9px] px-3 py-1 rounded-full animate-pulse">
                GOVERNED BY PLAN
            </Badge>
        {:else}
            <Badge variant="outline" class="opacity-20 text-[8px] font-black uppercase tracking-widest">MANUAL MODE</Badge>
        {/if}
    </div>

    <div class="grid grid-cols-2 gap-4 pt-2">
        <div class="flex flex-col gap-1.5">
            <span class="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">ORIGEM CAPITAL</span>
            <span class="text-[10px] font-bold text-white/50 uppercase">
                {profile.capital_source === 'Fixed' ? 'FIXO / LIQUIDEZ' : 'CONTA VINCULADA'}
            </span>
        </div>
        <div class="flex flex-col gap-1.5 text-right">
            <span class="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">ATIVOS VINCULADOS</span>
            <span class="text-[10px] font-bold text-white/50 uppercase">
                {profile.linked_asset_risk_profile_ids?.length || 0} PERFIS ATIVOS
            </span>
        </div>
    </div>
  </div>
</div>

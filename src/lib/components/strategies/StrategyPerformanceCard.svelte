<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { TrendingUp, Activity, Target, ArrowRight, Timer, Layers, Percent, BarChart3, Clock } from "lucide-svelte";
  import type { Strategy } from "$lib/types";
  import { goto } from "$app/navigation";
  import { t } from "svelte-i18n";
  import { formatCurrency } from "$lib/utils";
  import { formatDuration } from "$lib/utils/gann";
  import { cn } from "$lib/utils";

  // Stats Interface
  export interface StrategyStats {
    total_trades: number;
    win_rate: number;
    profit_factor: number;
    total_profit: number;
    average_profit: number;
    payoff: number;
    avg_interval?: number;
    currency?: string;
  }

  // Props
  let {
    strategy,
    viewMode = "grid",
    stats = {
      total_trades: 0,
      win_rate: 0,
      profit_factor: 0,
      total_profit: 0,
      average_profit: 0,
      payoff: 0,
      avg_interval: 0,
    },
  }: { strategy: Strategy; viewMode?: "grid" | "list"; stats?: StrategyStats } = $props();

  // Derived status
  let isPositive = $derived(stats.total_profit >= 0);
  let statusColor = $derived(isPositive ? "text-emerald-500" : "text-rose-500");
  let statusBg = $derived(isPositive ? "bg-emerald-500/10" : "bg-rose-500/10");
  let statusBorder = $derived(isPositive ? "border-emerald-500/10" : "border-rose-500/10");
</script>

{#if viewMode === "grid"}
  <div class="group relative bg-card/30 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 hover:bg-card/50 hover:border-white/10 transition-all duration-500 flex flex-col h-full shadow-2xl shadow-black/20">
    <!-- Header -->
    <div class="flex justify-between items-start gap-4 mb-8">
      <div class="space-y-3 flex-1 overflow-hidden">
        <div class="flex items-center gap-2">
            <div class={cn("p-1.5 rounded-lg shrink-0", statusBg, statusColor)}>
                <Layers class="w-3 h-3" />
            </div>
            <h3 class="text-[11px] font-black uppercase tracking-[0.1em] text-foreground group-hover:text-primary transition-colors truncate">
                {strategy.name}
            </h3>
        </div>
        
        <div class="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" class="text-[8px] font-black uppercase tracking-widest bg-white/5 border-white/5 h-4 px-2 rounded-full">
            {stats.total_trades} {$t("strategies.strategyDashboard.stats.operations")}
          </Badge>
          {#if strategy.specific_assets.length > 0}
            <Badge variant="secondary" class="text-[8px] font-bold h-4 px-2 rounded-full uppercase tracking-widest opacity-40">
              {strategy.specific_assets[0]}
            </Badge>
          {/if}
        </div>
      </div>

      <div class="text-right shrink-0">
        <span class="block text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-1">
            {$t("strategies.strategyCard.totalResult")}
        </span>
        <span class={cn("text-lg font-mono font-black tracking-tighter", statusColor)}>
            {formatCurrency(stats.total_profit, stats.currency || "BRL")}
        </span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4 flex-1 mb-8">
      <!-- Win Rate -->
      <div class="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
        <div class="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
            <Percent class="w-2.5 h-2.5" />
            {$t("strategies.strategyDashboard.stats.winRate")}
        </div>
        <div class={cn("text-sm font-black font-mono", stats.win_rate >= 50 ? "text-emerald-400" : "text-rose-400")}>
            {stats.win_rate.toFixed(1)}%
        </div>
      </div>

      <!-- Profit Factor -->
      <div class="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
        <div class="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
            <BarChart3 class="w-2.5 h-2.5" />
            {$t("strategies.strategyDashboard.stats.profitFactor")}
        </div>
        <div class={cn("text-sm font-black font-mono", stats.profit_factor >= 1.2 ? "text-emerald-400" : stats.profit_factor >= 1 ? "text-amber-400" : "text-rose-400")}>
            {stats.profit_factor.toFixed(2)}
        </div>
      </div>

      <!-- Payoff -->
      <div class="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
        <div class="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
            <Target class="w-2.5 h-2.5" />
            {$t("strategies.strategyDashboard.stats.payoff")}
        </div>
        <div class="text-sm font-black font-mono text-foreground/80">
            {stats.payoff.toFixed(2)}
        </div>
      </div>

      <!-- Avg Interval -->
      <div class="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
        <div class="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
            <Clock class="w-2.5 h-2.5" />
            {$t("strategies.strategyDashboard.stats.avgInterval")}
        </div>
        <div class="text-sm font-black font-mono text-foreground/80 truncate">
            {formatDuration(stats.avg_interval || 0)}
        </div>
      </div>
    </div>

    <!-- Action -->
    <div class="mt-auto">
      <Button
        variant="ghost"
        size="sm"
        class="w-full h-11 rounded-full text-[9px] font-black uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 justify-between px-6 border border-white/5 hover:border-transparent group-hover:shadow-lg group-hover:shadow-primary/20"
        onclick={() => goto(`/strategies/${strategy.id}`)}
      >
        {$t("strategies.strategyCard.viewAnalysis")}
        <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  </div>
{:else}
  <!-- List View Mode -->
  <div class="group flex items-center gap-6 p-4 bg-card/20 backdrop-blur-md border border-white/5 rounded-3xl hover:bg-card/40 hover:border-white/10 transition-all duration-300">
    <div class={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", statusBg, statusColor)}>
        <Layers class="w-6 h-6" />
    </div>

    <div class="flex-1 min-w-0">
        <h3 class="text-xs font-black uppercase tracking-widest text-foreground mb-1 truncate">
            {strategy.name}
        </h3>
        <div class="flex items-center gap-3">
            <Badge variant="outline" class="text-[8px] font-bold uppercase tracking-widest bg-white/5 border-white/5 px-2 rounded-full h-4">
                {stats.total_trades} TRADES
            </Badge>
            {#if strategy.specific_assets.length > 0}
                <span class="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                    {strategy.specific_assets.join(', ')}
                </span>
            {/if}
        </div>
    </div>

    <div class="flex items-center gap-8 shrink-0">
        <div class="grid grid-cols-3 gap-6">
            <div class="text-center">
                <span class="block text-[8px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">WR</span>
                <span class={cn("text-[11px] font-black font-mono", stats.win_rate >= 50 ? "text-emerald-400" : "text-rose-400")}>
                    {stats.win_rate.toFixed(1)}%
                </span>
            </div>
            <div class="text-center">
                <span class="block text-[8px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">PF</span>
                <span class={cn("text-[11px] font-black font-mono", stats.profit_factor >= 1.2 ? "text-emerald-400" : "text-amber-400")}>
                    {stats.profit_factor.toFixed(2)}
                </span>
            </div>
            <div class="text-center">
                <span class="block text-[8px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">PAYOFF</span>
                <span class="text-[11px] font-black font-mono text-foreground/80">
                    {stats.payoff.toFixed(2)}
                </span>
            </div>
        </div>

        <div class="text-right min-w-[120px]">
            <span class="block text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mb-0.5">
                {$t("strategies.strategyCard.totalResult")}
            </span>
            <span class={cn("text-sm font-black font-mono tracking-tight", statusColor)}>
                {formatCurrency(stats.total_profit, stats.currency || "BRL")}
            </span>
        </div>

        <Button
            variant="ghost"
            size="icon"
            class="h-10 w-10 rounded-full border border-white/5 hover:bg-primary hover:text-primary-foreground transition-all"
            onclick={() => goto(`/strategies/${strategy.id}`)}
        >
            <ArrowRight class="w-4 h-4" />
        </Button>
    </div>
  </div>
{/if}

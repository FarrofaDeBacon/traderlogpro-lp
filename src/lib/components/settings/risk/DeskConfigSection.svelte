<script lang="ts">
    import { t, locale } from "svelte-i18n";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import * as Select from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import type { DeskConfig, AssetRiskProfile } from "$lib/types";
    import { riskStore } from "$lib/stores/riskStore.svelte";
    import { CheckCircle2, XCircle, Clock, AlertTriangle, Info } from "lucide-svelte";
    import { cn } from "$lib/utils";

    let { 
        config = $bindable(),
        availableAssetProfiles = []
    } = $props<{
        config: DeskConfig | undefined;
        availableAssetProfiles: AssetRiskProfile[];
    }>();

    // In case the config is completely missing from older DB entries, initialize it when enabled
    function ensureInitialized() {
        if (!config) {
            config = {
                enabled: true,
                plan_name: "",
                allowed_asset_ids: [],
                max_combined_exposure: 0,
                max_total_loss: 0,
                profit_target: 0,
                day_trade_only: true,
                close_before_market_close_minutes: 0,
                consistency_mode: "none",
                max_single_day_profit_share: 0,
                mdr_mode: "none",
                stages: [
                    { id: 'margin_building', name: $t("risk.rules.desk.stages.margin_building"), enabled: true, mdr_mode: 'none', rule_50_percent_enabled: false, consistency_enabled: false },
                    { id: 'real_phase_1', name: $t("risk.rules.desk.stages.real_phase_1"), enabled: true, mdr_mode: 'percent_of_margin', rule_50_percent_enabled: true, consistency_enabled: true },
                    { id: 'real_final', name: $t("risk.rules.desk.stages.real_final"), enabled: true, mdr_mode: 'percent_of_margin', rule_50_percent_enabled: false, consistency_enabled: true }
                ],
                current_stage_index: 0
            };
            return;
        }
        if (!config.plan_name) config.plan_name = "";
        if (!config.allowed_asset_ids) config.allowed_asset_ids = [];
        if (!config.max_combined_exposure) config.max_combined_exposure = 0;
        if (!config.max_total_loss) config.max_total_loss = 0;
        if (!config.profit_target) config.profit_target = 0;
        if (config.day_trade_only === undefined) config.day_trade_only = true;
        if (!config.close_before_market_close_minutes) config.close_before_market_close_minutes = 0;
        if (!config.consistency_mode) config.consistency_mode = "none";
        if (!config.max_single_day_profit_share) config.max_single_day_profit_share = 0;
        if (!config.mdr_mode) config.mdr_mode = "none";
        if (!config.stages || config.stages.length === 0) {
            config.stages = [
                { id: 'margin_building', name: $t("risk.rules.desk.stages.margin_building"), enabled: true, mdr_mode: 'none', rule_50_percent_enabled: false, consistency_enabled: false },
                { id: 'real_phase_1', name: $t("risk.rules.desk.stages.real_phase_1"), enabled: true, mdr_mode: 'percent_of_margin', rule_50_percent_enabled: true, consistency_enabled: true },
                { id: 'real_final', name: $t("risk.rules.desk.stages.real_final"), enabled: true, mdr_mode: 'percent_of_margin', rule_50_percent_enabled: false, consistency_enabled: true }
            ];
        }
        if (config.current_stage_index === undefined) config.current_stage_index = 0;
    }

    $effect(() => {
        if (config.enabled) {
            ensureInitialized();
        }
    });

    function toggleAssetProfile(profileId: string) {
        if (!config.allowed_asset_ids) config.allowed_asset_ids = [];
        if (config.allowed_asset_ids.includes(profileId)) {
            config.allowed_asset_ids = config.allowed_asset_ids.filter((id: string) => id !== profileId);
        } else {
            config.allowed_asset_ids = [...config.allowed_asset_ids, profileId];
        }
    }

    const audit = $derived(riskStore.historicalAudit);
    const progression = $derived(riskStore.deskStageProgressionState);
    const feedback = $derived(riskStore.deskProgressFeedback);

</script>

<div class="space-y-6">
    <div class="flex items-center justify-between p-4 rounded-lg border bg-background/50">
        <div class="space-y-0.5">
            <Label class="text-base font-semibold">{$t("risk.rules.desk.title")}</Label>
            <p class="text-sm text-muted-foreground">{$t("risk.rules.desk.enable")}</p>
        </div>
        <Switch checked={config?.enabled ?? false} onCheckedChange={(c: boolean) => {
            if (c) {
                ensureInitialized();
                if (config) config.enabled = true;
            } else if (config) {
                config.enabled = false;
            }
        }} />
    </div>

    {#if config?.enabled}
        <div class="p-8 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 mb-8 flex gap-6 items-center group relative overflow-hidden">
            <div class="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            <div class="w-14 h-14 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Info class="w-7 h-7 text-emerald-500" />
            </div>
            <div class="space-y-1 relative z-10">
                <p class="text-sm font-black text-emerald-500 uppercase tracking-widest">{$t("risk.rules.desk.title")}</p>
                <p class="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] leading-relaxed opacity-60">
                    {$t("risk.rules.desk.desc")}
                </p>
            </div>
        </div>

        <div class="p-10 rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-3xl space-y-10 shadow-2xl relative">
                <!-- Nome do Plano -->
                <div class="space-y-3">
                    <Label class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.rules.desk.planName")}</Label>
                    <Input bind:value={config.plan_name} placeholder={$t("risk.rules.desk.planNamePlaceholder")} class="h-12 bg-white/5 border-white/5 rounded-full px-8 text-sm font-black uppercase tracking-tight focus-visible:border-emerald-500/40" />
                </div>

                <!-- MDR Mode -->
                <div class="space-y-3">
                    <Label class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.rules.targetType.max_daily_loss")}</Label>
                    <Select.Root
                        type="single"
                        bind:value={config.mdr_mode}
                        portal={null}
                    >
                        <Select.Trigger class="h-12 bg-white/5 border-white/5 rounded-full px-8 font-black text-[11px] uppercase tracking-widest focus:border-emerald-500/40">
                            {#if config.mdr_mode === "fixed"}
                                {$t("risk.rules.desk.modes.fixed")}
                            {:else if config.mdr_mode === "percent_of_margin"}
                                {$t("risk.rules.desk.modes.percent_of_margin")}
                            {:else}
                                {$t("common.none")}
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="none" class="text-[10px] font-black uppercase tracking-widest">{$t("common.none")}</Select.Item>
                            <Select.Item value="fixed" class="text-[10px] font-black uppercase tracking-widest">{$t("risk.rules.desk.modes.fixed")}</Select.Item>
                            <Select.Item value="percent_of_margin" class="text-[10px] font-black uppercase tracking-widest">{$t("risk.rules.desk.modes.percent_of_margin")}</Select.Item>
                        </Select.Content>
                    </Select.Root>
                </div>

                <!-- Estágio Atual -->
                {#if config.stages && config.stages.length > 0}
                    <div class="space-y-3 pt-10 border-t border-white/5">
                        <Label class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">{$t("risk.rules.desk.currentStage")}</Label>
                        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                            <Select.Root
                                type="single"
                                value={config.current_stage_index?.toString() ?? "0"}
                                onValueChange={(v: string) => { if(config) config.current_stage_index = parseInt(v); }}
                                portal={null}
                            >
                                <Select.Trigger class="h-12 bg-emerald-500/10 border-emerald-500/20 rounded-full px-8 font-black text-[11px] uppercase tracking-widest text-emerald-500 w-full md:w-[400px]">
                                    {config.stages[config.current_stage_index ?? 0]?.name || $t("risk.cockpit.noProfile")}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each config.stages as stage, i}
                                        <Select.Item value={i.toString()} class="text-[10px] font-black uppercase tracking-widest">{stage.name}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Auditoria Histórica -->
            {#if audit}
                <div class="mt-8 space-y-4">
                    <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {$t("risk.rules.desk.auditTitle")}
                    </h3>
                    
                    <div class={cn(
                        "p-10 rounded-[2.5rem] border flex flex-col gap-6 shadow-2xl backdrop-blur-md relative overflow-hidden",
                        audit.status === 'passed' ? "bg-emerald-500/10 border-emerald-500/20" :
                        audit.status === 'failed' ? "bg-rose-500/10 border-rose-500/20" :
                        "bg-white/5 border-white/10"
                    )}>
                        <div class="flex items-center gap-4 font-black text-lg uppercase tracking-tight relative z-10">
                            {#if audit.status === 'passed'}
                                <div class="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                    <CheckCircle2 class="w-6 h-6" /> 
                                </div>
                                <span class="text-emerald-500">{$t("risk.rules.desk.status.passed")}</span>
                            {:else if audit.status === 'failed'}
                                <div class="w-10 h-10 rounded-full bg-rose-500 text-black flex items-center justify-center shadow-lg shadow-rose-500/40">
                                    <XCircle class="w-6 h-6" />
                                </div>
                                <span class="text-rose-500">{$t("risk.rules.desk.status.failed")}</span>
                            {:else}
                                <div class="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                                    <Clock class="w-6 h-6" />
                                </div>
                                <span class="text-muted-foreground">{$t("risk.rules.desk.status.pending")}</span>
                            {/if}
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm mt-2 relative z-10">
                            <div class="flex flex-col gap-1">
                                <span class="text-[9px] font-black uppercase tracking-widest opacity-40">{$t("risk.rules.desk.metrics.operatedDays")}</span>
                                <span class="font-black text-base">{audit.metrics.operated_days}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[9px] font-black uppercase tracking-widest opacity-40">{$t("risk.rules.desk.metrics.positiveDays")}</span>
                                <span class="font-black text-base text-emerald-500">{audit.metrics.positive_days}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[9px] font-black uppercase tracking-widest opacity-40">{$t("risk.rules.desk.metrics.bestDayShare")}</span>
                                <span class="font-black text-base">{audit.metrics.best_day_share_percent.toFixed(1)}%</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[9px] font-black uppercase tracking-widest opacity-40">{$t("risk.rules.desk.metrics.totalProfit")}</span>
                                <span class="font-black text-base font-mono">{$t("common.currency")} {audit.metrics.total_net_profit.toLocaleString($locale || 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        {#if audit.reasons.length > 0}
                            <div class="mt-4 pt-6 border-t border-white/5 space-y-2 relative z-10">
                                {#each audit.reasons as reason}
                                    <p class="text-[10px] font-black uppercase tracking-widest flex items-start gap-3 opacity-60">
                                        <div class="w-1.5 h-1.5 rounded-full bg-current mt-1"></div> {reason}
                                    </p>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Progressão de Estágio -->
            {#if progression}
                <div class="mt-4 p-4 rounded-lg border bg-background/50 space-y-3">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="space-y-0.5">
                            <h4 class="font-semibold text-sm">{$t("risk.rules.desk.progression.title")}</h4>
                            <p class="text-xs text-muted-foreground uppercase tracking-widest">
                                {$t("risk.rules.desk.progression.current")}: <span class="font-mono font-bold text-primary">{config.stages.find((s: any) => s.id.toLowerCase() === progression.currentPhaseId.toLowerCase())?.name || progression.currentPhaseId}</span>
                            </p>
                        </div>
                        {#if progression.canPromote}
                            <Badge variant="default" class="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                                {$t("risk.rules.desk.progression.can_advance")}
                            </Badge>
                        {:else}
                            <Badge variant="secondary" class="text-muted-foreground">
                                {$t("risk.rules.desk.progression.should_remain")}
                            </Badge>
                        {/if}
                    </div>

                    {#if progression.advanceConditions.length > 0}
                        <div class="space-y-2 mt-2 pt-2 border-t border-current/10">
                            {#each progression.advanceConditions as check}
                                <div class="flex items-center gap-2 text-xs">
                                    {#if check.isMet}
                                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                        <span class="text-muted-foreground">{$t(`risk.growth.metrics.${check.metric}`, { default: $t(`risk.violations.${check.metric}`, { default: $t(`risk.rules.targetType.${check.metric}`, { default: check.metric }) }) })}: {check.current}/{check.target}</span>
                                    {:else}
                                        <div class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                                        <span class="text-amber-500/90">{$t(`risk.growth.metrics.${check.metric}`, { default: $t(`risk.violations.${check.metric}`, { default: $t(`risk.rules.targetType.${check.metric}`, { default: check.metric }) }) })}: {check.current}/{check.target}</span>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                    {#if progression.regressionConditions.length > 0 && !progression.canPromote}
                        <div class="pt-2">
                            {#each progression.regressionConditions as r}
                                <p class="text-[10px] text-amber-500 italic flex items-center gap-1">
                                    <span class="mt-0.5">•</span> {$t(`risk.growth.metrics.${r.metric}`, { default: $t(`risk.violations.${r.metric}`, { default: $t(`risk.rules.targetType.${r.metric}`, { default: r.metric }) }) })}: {r.current} (Max: {r.target})
                                </p>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
    {/if}
</div>

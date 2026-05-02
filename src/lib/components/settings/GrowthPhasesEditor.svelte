<script lang="ts">
    import type { GrowthPhase } from "$lib/types";
    import { Plus, Trash2, TrendingUp, Zap, ChevronRight, Target, Activity, ShieldAlert, Layers, Copy } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { t } from "svelte-i18n";
    import { fade, slide } from "svelte/transition";
    import { cn } from "$lib/utils";
    import SystemListItem from "$lib/components/ui/system/SystemListItem.svelte";
    import SystemInput from "$lib/components/ui/system/SystemInput.svelte";

    let { 
        phases = $bindable([]), 
        activePhaseIndex = $bindable(null), 
        simpleMode = false, 
        wizardMode = false, 
        targetUnit = 'financial',
        drawdownUnit = 'financial',
        onChange 
    } = $props<{ 
        phases?: GrowthPhase[], 
        activePhaseIndex?: number | null, 
        simpleMode?: boolean, 
        wizardMode?: boolean, 
        targetUnit?: 'financial' | 'points',
        drawdownUnit?: 'financial' | 'points',
        onChange?: () => void 
    }>();

    const advanceMetrics: Record<string, string> = {
        profit: 'risk.growth.metrics.profit',
        totalTarget: 'risk.growth.metrics.totalTarget',
        dailyTarget: 'risk.growth.metrics.dailyTarget',
        days: 'risk.growth.metrics.days',
        winRate: 'risk.growth.metrics.winRate',
        consistency: 'risk.growth.metrics.consistency'
    };

    const demoteMetrics: Record<string, string> = {
        drawdown: 'risk.growth.metrics.drawdown',
        dailyLoss: 'risk.growth.metrics.dailyLoss',
        lossStreak: 'risk.growth.metrics.lossStreak'
    };

    function addPhase() {
        if (!phases) phases = [];
        phases = [
            ...phases,
            {
                level: phases.length + 1,
                name: `${$t('risk.management.phase')} ${phases.length + 1}`,
                lot_size: 1,
                conditions_to_advance: [],
                conditions_to_demote: [],
            },
        ];
        activePhaseIndex = phases.length - 1;
        onChange?.();
    }

    function removePhase(index: number) {
        if (!phases) return;
        phases = phases.filter((_: unknown, i: number) => i !== index);
        phases = phases.map((p: GrowthPhase, i: number) => ({ ...p, level: i + 1 }));
        if (activePhaseIndex >= phases.length) {
            activePhaseIndex = Math.max(0, phases.length - 1);
        }
        onChange?.();
    }

    function duplicatePhase(index: number) {
        const source = phases[index];
        if (!source) return;
        
        // Deep clone the phase
        const copy = JSON.parse(JSON.stringify(source));
        copy.level = phases.length + 1;
        copy.name = `${copy.name} (${$t('risk.messages.copySuffix')})`;
        
        phases = [...phases, copy];
        activePhaseIndex = phases.length - 1;
        
        if (onChange) onChange();
    }

    let isRulesModalOpen = $state(false);
    let rulesModalMode = $state<'advance' | 'demote'>('advance');
    let tempRules = $state<any[]>([]);

    function openRulesModal(mode: 'advance' | 'demote') {
        const phase = phases[activePhaseIndex];
        if (!phase) return;
        rulesModalMode = mode;
        tempRules = JSON.parse(JSON.stringify(mode === 'advance' ? phase.conditions_to_advance : phase.conditions_to_demote));
        isRulesModalOpen = true;
    }

    function addRule() {
        tempRules = [...tempRules, { metric: rulesModalMode === 'advance' ? 'profit' : 'drawdown', operator: rulesModalMode === 'advance' ? '>=' : '<=', value: 0 }];
    }

    function applyRules() {
        const phase = phases[activePhaseIndex];
        if (!phase) return;
        if (rulesModalMode === 'advance') {
            phase.conditions_to_advance = tempRules;
        } else {
            phase.conditions_to_demote = tempRules;
        }
        isRulesModalOpen = false;
        onChange?.();
    }

    function removeRule(mode: 'advance' | 'demote', index: number) {
        if (activePhaseIndex === null) return;
        const phase = phases[activePhaseIndex];
        if (!phase) return;
        if (mode === 'advance') {
            phase.conditions_to_advance = phase.conditions_to_advance.filter((_, i) => i !== index);
        } else {
            phase.conditions_to_demote = phase.conditions_to_demote.filter((_, i) => i !== index);
        }
        onChange?.();
    }

    function togglePhase(index: number) {
        if (activePhaseIndex === index) {
            activePhaseIndex = null;
        } else {
            activePhaseIndex = index;
        }
    }

    function getMetricLabel(metric: string, isAdvance: boolean): string {
        const key = isAdvance ? advanceMetrics[metric] : demoteMetrics[metric];
        return key ? $t(key) : metric;
    }

    function getRuleUnit(metric: string, isAdvance: boolean): string {
        if (isAdvance) {
            if (['profit', 'totalTarget', 'dailyTarget'].includes(metric)) return targetUnit === 'points' ? 'pts' : 'R$';
            if (metric === 'winRate') return '%';
            if (['days', 'consistency'].includes(metric)) return 'dias';
        } else {
            if (['drawdown', 'dailyLoss'].includes(metric)) return drawdownUnit === 'points' ? 'pts' : 'R$';
            if (metric === 'lossStreak') return 'dias';
        }
        return '';
    }
</script>

<Dialog.Root bind:open={isRulesModalOpen}>
    <Dialog.Content class="sm:max-w-[600px] bg-black/80 border-white/5 rounded-[3rem] p-0 overflow-hidden shadow-2xl backdrop-blur-3xl flex flex-col max-h-[85vh]">
        <Dialog.Header class="p-8 bg-white/[0.02] border-b border-white/5">
            <div class="flex items-center gap-4">
                <div class={cn(
                    "p-3 rounded-2xl border",
                    rulesModalMode === 'advance' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                    {#if rulesModalMode === 'advance'}
                        <TrendingUp class="w-6 h-6" />
                    {:else}
                        <ShieldAlert class="w-6 h-6" />
                    {/if}
                </div>
                <div>
                    <Dialog.Title class="text-xl font-bold tracking-tight text-foreground uppercase">
                        {rulesModalMode === 'advance' ? "Configurar Metas de Avanço" : "Configurar Regras de Recuo"}
                    </Dialog.Title>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">
                        Estágio {(activePhaseIndex ?? 0) + 1} • {activePhaseIndex !== null ? phases[activePhaseIndex]?.name : '' || 'Sem Nome'}
                    </p>
                </div>
            </div>
        </Dialog.Header>

        <div class="p-8 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {#each tempRules as rule, ri}
                {@const isAdvance = rulesModalMode === 'advance'}
                {@const isCurrency = isAdvance 
                    ? (['profit', 'totalTarget', 'dailyTarget'].includes(rule.metric) && targetUnit !== 'points')
                    : ((rule.metric === 'drawdown' || rule.metric === 'dailyLoss') && drawdownUnit !== 'points')
                }
                <div class="flex items-center gap-3 p-3 bg-black/40 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group/rule" in:fade={{ duration: 200 }}>
                    <div class="flex-1">
                        <Select.Root type="single" bind:value={rule.metric}>
                            <Select.Trigger class="h-11 bg-white/5 border-none text-[11px] font-black uppercase px-5 rounded-2xl focus:ring-emerald-500/30 w-full text-left">
                                {getMetricLabel(rule.metric, isAdvance)}
                            </Select.Trigger>
                            <Select.Content portal={null} class="min-w-[240px] rounded-[1.5rem] border-white/10 bg-black/95 backdrop-blur-3xl shadow-2xl">
                                {#if isAdvance}
                                    <Select.Item value="profit" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.profit")}</Select.Item>
                                    <Select.Item value="dailyTarget" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.dailyTarget")}</Select.Item>
                                    <Select.Separator />
                                    <Select.Item value="days" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.days")}</Select.Item>
                                    <Select.Item value="winRate" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.winRate")}</Select.Item>
                                    <Select.Item value="consistency" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.consistency")}</Select.Item>
                                {:else}
                                    <Select.Item value="drawdown" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.drawdown")}</Select.Item>
                                    <Select.Item value="dailyLoss" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.dailyLoss")}</Select.Item>
                                    <Select.Item value="lossStreak" class="text-[10px] font-black uppercase">{$t("risk.growth.metrics.lossStreak")}</Select.Item>
                                {/if}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="w-20">
                        <Select.Root type="single" bind:value={rule.operator}>
                            <Select.Trigger class="h-11 bg-transparent border-none text-sm font-black font-mono text-center rounded-2xl focus:ring-emerald-500/30 text-emerald-500">
                                {rule.operator}
                            </Select.Trigger>
                            <Select.Content portal={null} class="min-w-[80px] rounded-xl border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl">
                                <Select.Item value="=" class="font-mono text-sm">=</Select.Item>
                                <Select.Item value="!=" class="font-mono text-sm">!=</Select.Item>
                                <Select.Item value=">" class="font-mono text-sm">&gt;</Select.Item>
                                <Select.Item value=">=" class="font-mono text-sm">&gt;=</Select.Item>
                                <Select.Item value="<" class="font-mono text-sm">&lt;</Select.Item>
                                <Select.Item value="<=" class="font-mono text-sm">&lt;=</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="relative w-36 shrink-0">
                        <Input type="number" step="0.1" class="h-11 bg-white/5 border-none text-[13px] font-black font-mono text-right {isCurrency ? 'pl-12 pr-4' : 'pl-4 pr-16'} focus-visible:ring-emerald-500/30 rounded-2xl" bind:value={rule.value} />
                        <span class="absolute {isCurrency ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-500/40 uppercase tracking-widest pointer-events-none">
                            {isCurrency ? 'R$' : (rule.metric === 'winRate' ? '%' : (rule.metric === 'days' || rule.metric === 'consistency' || rule.metric === 'lossStreak' ? 'DIAS' : 'PTS'))}
                        </span>
                    </div>
                    
                    <Button variant="ghost" size="icon" class="h-10 w-10 text-muted-foreground/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all" onclick={() => { 
                        tempRules = tempRules.filter((_, i) => i !== ri);
                    }}>
                        <Trash2 class="w-4 h-4" />
                    </Button>
                </div>
            {/each}

            {#if tempRules.length === 0}
                <div class="py-16 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-6 group/empty transition-all hover:border-emerald-500/20">
                    <div class="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 group-hover/empty:bg-emerald-500/10 group-hover/empty:border-emerald-500/30 transition-all duration-500">
                        {#if rulesModalMode === 'advance'}
                            <Target class="w-10 h-10 text-emerald-500/40 group-hover/empty:text-emerald-500 group-hover/empty:scale-110 transition-all duration-500" />
                        {:else}
                            <ShieldAlert class="w-10 h-10 text-rose-500/40 group-hover/empty:text-rose-500 group-hover/empty:scale-110 transition-all duration-500" />
                        {/if}
                    </div>
                    <div class="space-y-2 text-center">
                        <p class="text-[11px] font-black text-foreground/80 uppercase tracking-[0.4em]">REGRA INEXISTENTE</p>
                        <p class="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed mx-auto">
                            Nenhuma diretriz de {rulesModalMode === 'advance' ? 'avanço' : 'recuo'} configurada para este estágio.
                        </p>
                    </div>
                </div>
            {/if}
        </div>

        <div class="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <Button variant="outline" class="rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5" onclick={addRule}>
                <Plus class="w-4 h-4 mr-2" /> ADICIONAR REGRA
            </Button>
            <div class="flex items-center gap-3">
                <Button variant="ghost" class="rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white" onclick={() => isRulesModalOpen = false}>
                    CANCELAR
                </Button>
                <Button class="rounded-full px-12 h-12 text-[11px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20" onclick={applyRules}>
                    APLICAR REGRAS
                </Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

<div class={cn(wizardMode ? "space-y-6" : "mt-8 space-y-6 h-full", "p-1")}>
    {#if phases && phases.length > 0}
        {#if simpleMode}
            <div class="space-y-3">
                {#each phases as phase, index}
                    <SystemListItem 
                        title={phase.name || `${$t('risk.management.phase')} ${index + 1}`}
                        subtitle={`${phase.lot_size} lotes • ${phase.conditions_to_advance.length + phase.conditions_to_demote.length} regras`}
                        icon={Layers}
                        onDelete={() => removePhase(index)}
                        onclick={() => activePhaseIndex = index}
                    >
                        {#snippet extra()}
                            <div class="flex items-center gap-4 mr-4">
                                <div class="flex flex-col items-end">
                                    <span class="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">Exposição</span>
                                    <span class="text-[12px] font-black text-foreground">{phase.lot_size}</span>
                                </div>
                            </div>
                        {/snippet}
                    </SystemListItem>
                {/each}
            </div>
        {:else}
        <div class="flex flex-col gap-3">
            {#each phases as phase, index}
                <div class="space-y-3">
                    <SystemListItem 
                        title={phase.name || `${$t('risk.management.phase')} ${index + 1}`}
                        subtitle={`${phase.lot_size} lotes • ${phase.conditions_to_advance.length} metas • ${phase.conditions_to_demote.length} recuos`}
                        icon={Layers}
                        class={cn(
                            "transition-all duration-300",
                            activePhaseIndex === index ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20" : ""
                        )}
                        onDelete={() => removePhase(index)}
                        onclick={() => togglePhase(index)}
                    >
                        {#snippet extra()}
                            <div class="flex items-center gap-4 mr-4">
                                <div class="flex flex-col items-end">
                                    <span class="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">Exposição</span>
                                    <span class={cn("text-[12px] font-black", activePhaseIndex === index ? "text-primary" : "text-foreground")}>{phase.lot_size}</span>
                                </div>
                                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" onclick={(e) => { e.stopPropagation(); duplicatePhase(index); }}>
                                       <Copy class="w-3.5 h-3.5" />
                                   </Button>
                                </div>
                                <ChevronRight class={cn("w-4 h-4 text-muted-foreground/40 transition-transform duration-300", activePhaseIndex === index ? "rotate-90 text-primary" : "")} />
                            </div>
                        {/snippet}
                    </SystemListItem>

                    {#if activePhaseIndex === index}
                        <div transition:slide={{ duration: 300 }} class="px-2 pb-2">
                            <div class="p-8 rounded-[2rem] border border-primary/20 bg-primary/[0.02] shadow-inner space-y-8 relative overflow-hidden group/edit">
                                <!-- Subtle background decoration -->
                                <div class="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div class="space-y-2">
                                        <Label class="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-1">NOME DO ESTÁGIO</Label>
                                        <Input bind:value={phase.name} class="h-12 rounded-2xl bg-background/50 border-white/5 focus-visible:ring-primary/30 font-bold uppercase tracking-tight text-sm" />
                                    </div>
                                    <div class="space-y-2">
                                        <Label class="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-1">LOTES / CONTRATOS</Label>
                                        <Input type="number" bind:value={phase.lot_size} class="h-12 rounded-2xl bg-background/50 border-white/5 focus-visible:ring-primary/30 font-mono font-bold text-lg text-primary" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    <button 
                                        type="button"
                                        class="group/btn flex items-center justify-between p-6 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left outline-none"
                                        onclick={() => { activePhaseIndex = index; openRulesModal('advance'); }}
                                    >
                                        <div class="flex items-center gap-4">
                                            <div class="p-3 bg-emerald-500/10 rounded-xl group-hover/btn:bg-emerald-500/20 transition-colors">
                                                <TrendingUp class="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-1">METAS DE AVANÇO</p>
                                                <p class="text-lg font-black text-emerald-500 tabular-nums">{phase.conditions_to_advance.length}</p>
                                            </div>
                                        </div>
                                        <div class="p-2 bg-emerald-500/10 rounded-lg group-hover/btn:translate-x-1 transition-transform">
                                            <Plus class="w-4 h-4 text-emerald-500" />
                                        </div>
                                    </button>

                                    <button 
                                        type="button"
                                        class="group/btn flex items-center justify-between p-6 rounded-[1.5rem] border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all text-left outline-none"
                                        onclick={() => { activePhaseIndex = index; openRulesModal('demote'); }}
                                    >
                                        <div class="flex items-center gap-4">
                                            <div class="p-3 bg-rose-500/10 rounded-xl group-hover/btn:bg-rose-500/20 transition-colors">
                                                <ShieldAlert class="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60 mb-1">REGRAS DE RECUO</p>
                                                <p class="text-lg font-black text-rose-500 tabular-nums">{phase.conditions_to_demote.length}</p>
                                            </div>
                                        </div>
                                        <div class="p-2 bg-rose-500/10 rounded-lg group-hover/btn:translate-x-1 transition-transform">
                                            <Plus class="w-4 h-4 text-rose-500" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}

            <Button 
                variant="outline"
                class="w-full h-16 rounded-[1.5rem] border-dashed border-2 bg-muted/5 border-border/50 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm"
                onclick={addPhase}
            >
                <Plus class="w-5 h-5 mr-3 stroke-[3px]" />
                Adicionar Novo Estágio
            </Button>
        </div>
        {/if}
    {:else}
        <div class="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[3rem] bg-black/40 backdrop-blur-md gap-10 group transition-all duration-700 shadow-2xl relative overflow-hidden">
            <!-- Decorative background elements -->
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full group-hover:bg-emerald-500/10 transition-all duration-700"></div>
            <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all duration-700"></div>

            <div class="w-24 h-24 rounded-[2.5rem] bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:scale-110 transition-all duration-700 shadow-xl relative z-10">
                <Layers class="w-12 h-12 text-muted-foreground/20 group-hover:text-emerald-500 transition-colors" />
            </div>
            
            <div class="space-y-4 text-center relative z-10">
                <h3 class="text-sm font-black uppercase text-foreground tracking-[0.5em] ml-[0.5em]">VAZIO ESTRUTURAL</h3>
                <div class="w-12 h-1 bg-emerald-500/20 mx-auto rounded-full group-hover:w-24 group-hover:bg-emerald-500/50 transition-all duration-700"></div>
                <p class="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] max-w-[300px] leading-relaxed mx-auto">
                    A ARQUITETURA DE CRESCIMENTO EXIGE AO MENOS UM ESTÁGIO OPERACIONAL DEFINIDO.
                </p>
            </div>

            {#if !simpleMode}
                <Button 
                    variant="outline" 
                    class="h-14 px-16 bg-emerald-500 text-black border-none font-black uppercase text-[11px] tracking-[0.3em] rounded-full hover:bg-emerald-400 shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.4)] transition-all active:scale-95 relative z-10" 
                    onclick={addPhase}
                >
                    <Plus class="w-5 h-5 mr-3 stroke-[3px]" /> CRIAR PRIMEIRA FASE
                </Button>
            {/if}
        </div>
    {/if}
</div>

<style>
    /* Custom scrollbar for better fit */
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
</style>

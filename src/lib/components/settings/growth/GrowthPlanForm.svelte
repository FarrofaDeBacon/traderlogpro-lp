<script lang="ts">
    import { onMount } from "svelte";
    import { TrendingUp, Zap, ChevronRight, CheckCircle2 } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import { Badge } from "$lib/components/ui/badge";
    import SystemInput from "$lib/components/ui/system/SystemInput.svelte";
    import GrowthPhasesEditor from "$lib/components/settings/GrowthPhasesEditor.svelte";
    import type { GrowthPlan } from "$lib/types";
    import { t } from "svelte-i18n";
    import { cn } from "$lib/utils";

    let {
        initialData,
        onSave,
        onCancel
    } = $props();

    let activeSection = $state<'general' | 'phases' | 'review'>('general');

    let plan = $state<Omit<GrowthPlan, "id">>({
        name: initialData?.name || "",
        enabled: initialData?.enabled ?? true,
        profit_metric: initialData?.profit_metric || "currency",
        risk_metric: initialData?.risk_metric || "currency",
        daily_loss_is_cumulative: initialData?.daily_loss_is_cumulative ?? true,
        drawdown_is_static: initialData?.drawdown_is_static ?? false,
        goal_is_cumulative: initialData?.goal_is_cumulative ?? false,
        phase_target_mode: initialData?.phase_target_mode || 'reset_each_phase',
        phases: initialData?.phases ? JSON.parse(JSON.stringify(initialData.phases)) : [
            {
                name: "Fase 1",
                lot_size: 1,
                conditions_to_advance: [],
                conditions_to_demote: []
            }
        ]
    });

    function handleSubmit() {
        onSave(plan);
    }
</script>

<div class="flex flex-col h-full bg-white dark:bg-[#0a0c10] text-foreground">
    <!-- Header Section -->
    <div class="px-8 py-7 border-b border-border bg-muted/5">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-5">
                <div class="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <TrendingUp class="w-6 h-6 text-primary" />
                </div>
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <h1 class="text-[13px] font-bold uppercase tracking-[0.3em] text-foreground">
                            {initialData ? "Configurar Plano" : "Nova Arquitetura"}
                        </h1>
                        <Badge variant="outline" class="h-4 border-primary/20 bg-primary/5 text-primary text-[8px] font-bold uppercase tracking-widest px-2">
                            {initialData ? "Revision" : "Draft"}
                        </Badge>
                    </div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-none">
                        Evolução e Escalabilidade Operacional
                    </p>
                </div>
            </div>
            <Button variant="ghost" onclick={onCancel} class="h-9 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all">
                {$t("common.cancel")}
            </Button>
        </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="px-8 py-4 border-b border-border bg-muted/[0.02]">
        <div class="flex items-center bg-muted/10 p-1 rounded-full w-fit gap-1 border border-border">
            <button 
                onclick={() => activeSection = 'general'}
                class="px-8 py-2 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full transition-all duration-300 {activeSection === 'general' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm border border-border' : 'text-muted-foreground/40 hover:text-foreground'}"
            >
                Geral
            </button>
            <button 
                onclick={() => activeSection = 'phases'}
                class="px-8 py-2 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full transition-all duration-300 {activeSection === 'phases' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm border border-border' : 'text-muted-foreground/40 hover:text-foreground'}"
            >
                Fases
            </button>
            <button 
                onclick={() => activeSection = 'review'}
                class="px-8 py-2 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full transition-all duration-300 {activeSection === 'review' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm border border-border' : 'text-muted-foreground/40 hover:text-foreground'}"
            >
                Revisão
            </button>
        </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {#if activeSection === 'general'}
            <div class="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <section class="space-y-8">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-primary/10 text-primary">
                            <Zap class="w-4 h-4" />
                        </div>
                        <div>
                            <h3 class="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Configurações Gerais</h3>
                            <p class="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Dados base para o funcionamento do seu roadmap de crescimento.</p>
                        </div>
                    </div>
                    
                    <div class="grid gap-8">
                        <SystemInput 
                            label="Identificação do Plano"
                            placeholder="Ex: Mesa 10k, Plano Individual Pro..."
                            bind:value={plan.name}
                        />

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="space-y-3">
                                <Label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Métrica de Lucro</Label>
                                <div class="flex p-1 bg-muted/10 rounded-full border border-border h-11">
                                    <button 
                                        class="flex-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all {plan.profit_metric === 'currency' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm border border-border' : 'text-muted-foreground/40 hover:text-foreground'}"
                                        onclick={() => plan.profit_metric = 'currency'}
                                    >
                                        Financeiro
                                    </button>
                                    <button 
                                        class="flex-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all {plan.profit_metric === 'points' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm border border-border' : 'text-muted-foreground/40 hover:text-foreground'}"
                                        onclick={() => plan.profit_metric = 'points'}
                                    >
                                        Pontos
                                    </button>
                                </div>
                            </div>
                            
                            <div class="space-y-3">
                                <Label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Métrica de Risco</Label>
                                <div class="flex p-1 bg-muted/10 rounded-full border border-border h-11">
                                    <button 
                                        class="flex-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all {plan.risk_metric === 'currency' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm border border-border' : 'text-muted-foreground/40 hover:text-foreground'}"
                                        onclick={() => plan.risk_metric = 'currency'}
                                    >
                                        Financeiro
                                    </button>
                                    <button 
                                        class="flex-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all {plan.risk_metric === 'points' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm border border-border' : 'text-muted-foreground/40 hover:text-foreground'}"
                                        onclick={() => plan.risk_metric = 'points'}
                                    >
                                        Pontos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="grid gap-4">
                    <div class="p-6 rounded-[1.5rem] bg-white dark:bg-[#0a0c10] border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                        <div class="space-y-1">
                            <h4 class="text-[11px] font-bold uppercase tracking-tight text-foreground">Contabilização de Perda Diária</h4>
                            <p class="text-[9px] font-bold text-muted-foreground/30 uppercase leading-relaxed max-w-sm">
                                Método acumulado: apenas as perdas somam no limite diário.
                            </p>
                        </div>
                        <Switch bind:checked={plan.daily_loss_is_cumulative} />
                    </div>

                    <div class="p-6 rounded-[1.5rem] bg-white dark:bg-[#0a0c10] border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                        <div class="space-y-1">
                            <h4 class="text-[11px] font-bold uppercase tracking-tight text-foreground">Método Drawdown</h4>
                            <p class="text-[9px] font-bold text-muted-foreground/30 uppercase leading-relaxed max-w-sm">
                                Risco fixo: o drawdown não se altera com o lucro da fase.
                            </p>
                        </div>
                        <Switch bind:checked={plan.drawdown_is_static} />
                    </div>

                    <div class="p-6 rounded-[1.5rem] bg-white dark:bg-[#0a0c10] border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                        <div class="space-y-1">
                            <h4 class="text-[11px] font-bold uppercase tracking-tight text-foreground">Progressão de Metas</h4>
                            <p class="text-[9px] font-bold text-muted-foreground/30 uppercase leading-relaxed max-w-sm">
                                Total do plano: o lucro acumulado entre fases conta para a meta.
                            </p>
                        </div>
                        <Switch bind:checked={plan.goal_is_cumulative} />
                    </div>

                    <div class="p-6 rounded-[1.5rem] bg-white dark:bg-[#0a0c10] border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                        <div class="space-y-1">
                            <h4 class="text-[11px] font-bold uppercase tracking-tight text-foreground">Modo de Transição de Fase</h4>
                            <p class="text-[9px] font-bold text-muted-foreground/30 uppercase leading-relaxed max-w-sm">
                                Zerar: recomeça do zero a cada avanço. Acumular: carrega ganhos para a nova fase.
                            </p>
                        </div>
                        <div class="flex p-1 bg-muted/10 rounded-full border border-border h-10 w-48">
                            <button 
                                class="flex-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all {plan.phase_target_mode !== 'cumulative' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm' : 'text-muted-foreground/40 hover:text-foreground'}"
                                onclick={() => plan.phase_target_mode = 'reset_each_phase'}
                            >
                                Zerar
                            </button>
                            <button 
                                class="flex-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all {plan.phase_target_mode === 'cumulative' ? 'bg-white dark:bg-primary text-primary dark:text-primary-foreground shadow-sm' : 'text-muted-foreground/40 hover:text-foreground'}"
                                onclick={() => plan.phase_target_mode = 'cumulative'}
                            >
                                Acumular
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {:else if activeSection === 'phases'}
            <div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <GrowthPhasesEditor bind:phases={plan.phases} />
            </div>
        {:else if activeSection === 'review'}
             <div class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="p-8 rounded-[2.5rem] bg-muted/5 border border-border">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="p-3 rounded-2xl bg-primary/10 text-primary">
                            <TrendingUp class="w-6 h-6" />
                        </div>
                        <div>
                            <h3 class="text-sm font-bold uppercase tracking-[0.3em] text-foreground">{plan.name || "Plano Sem Nome"}</h3>
                            <p class="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Resumo da Estrutura Operacional</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-8">
                         <div class="space-y-2">
                            <span class="text-[9px] font-bold uppercase text-muted-foreground/40 tracking-widest">Estágios</span>
                            <p class="text-xl font-black text-foreground">{plan.phases.length}</p>
                        </div>
                        <div class="space-y-2">
                            <span class="text-[9px] font-bold uppercase text-muted-foreground/40 tracking-widest">Lote Inicial</span>
                            <p class="text-xl font-black text-foreground">{plan.phases[0]?.lot_size || 0} <span class="text-xs text-muted-foreground/30 ml-1">ctts</span></p>
                        </div>
                        <div class="space-y-2">
                            <span class="text-[9px] font-bold uppercase text-muted-foreground/40 tracking-widest">Lote Final</span>
                            <p class="text-xl font-black text-primary">{plan.phases[plan.phases.length - 1]?.lot_size || 0} <span class="text-xs text-muted-foreground/30 ml-1">ctts</span></p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Footer Section -->
    <div class="px-8 py-6 border-t border-border bg-muted/5 flex items-center justify-end gap-3">
        {#if activeSection === 'general'}
            <Button onclick={() => activeSection = 'phases'} class="h-11 px-10 rounded-full bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Próximo: Fases
                <ChevronRight class="w-4 h-4" />
            </Button>
        {:else if activeSection === 'phases'}
            <div class="flex items-center gap-3 w-full">
                <Button variant="ghost" onclick={() => activeSection = 'general'} class="h-10 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                    Voltar
                </Button>
                <div class="flex-1"></div>
                <Button onclick={() => activeSection = 'review'} class="h-11 px-10 rounded-full bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    Revisar Plano
                    <ChevronRight class="w-4 h-4" />
                </Button>
            </div>
        {:else if activeSection === 'review'}
            <div class="flex items-center gap-3 w-full">
                <Button variant="ghost" onclick={() => activeSection = 'phases'} class="h-10 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                    Voltar
                </Button>
                <div class="flex-1"></div>
                <Button onclick={handleSubmit} class="h-11 px-10 rounded-full bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <CheckCircle2 class="w-4 h-4" />
                    Finalizar Plano
                </Button>
            </div>
        {/if}
    </div>
</div>

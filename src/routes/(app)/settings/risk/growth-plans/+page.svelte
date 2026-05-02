<script lang="ts">
  import { riskSettingsStore } from "$lib/stores/risk-settings.svelte";
  import { Plus, Trophy, Trash2 } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { t } from "svelte-i18n";
  import { toast } from "svelte-sonner";
  import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
  import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
  import { goto } from "$app/navigation";
  import SystemListItem from "$lib/components/ui/system/SystemListItem.svelte";

  let isDeleteOpen = $state(false);
  let deleteId = $state<string | null>(null);

  function requestDelete(id: string) {
    deleteId = id;
    isDeleteOpen = true;
  }

  async function confirmDelete() {
    if (deleteId) {
      const result = await riskSettingsStore.deleteGrowthPlan(deleteId);
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
        <Button 
            onclick={() => goto('/settings/risk/growth-plans/new')}
            class="rounded-xl px-8 h-10 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
        >
            <Plus class="w-4 h-4 mr-2" />
            {$t("risk.growthPlans.new") || "Novo Plano"}
        </Button>
    </div>
{/snippet}

<div class="space-y-6 max-w-5xl mx-auto pb-20 px-4 md:px-0 pt-4">

    <!-- Header Summary -->
    <div class="bg-black/40 backdrop-blur-3xl border border-white/5 p-8 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/15 transition-all duration-700"></div>
        
        <div class="space-y-3 relative z-10">
            <h1 class="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-4">
                <Trophy class="w-10 h-10 text-emerald-500" />
                EVOLUÇÃO ESTRATÉGICA
            </h1>
            <p class="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] max-w-xl leading-relaxed">
                Gerencie seus planos de evolução de lote e metas automáticas com foco em escalabilidade operacional e disciplina técnica.
            </p>
        </div>

        <div class="flex items-center gap-3 bg-white/5 border border-white/5 px-6 py-3 rounded-xl relative z-10">
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">GROWTH ENGINE v2.0</span>
        </div>
    </div>

    <!-- Growth Plans List -->
    <div class="space-y-3">
        <div class="flex items-center justify-between px-6 mb-4">
            <h2 class="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">Roadmaps de Escalabilidade</h2>
            <Badge variant="outline" class="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black px-2 py-0.5 rounded-md">
                {riskSettingsStore.growthPlans.length} PLANOS
            </Badge>
        </div>

        {#each riskSettingsStore.growthPlans as plan}
            <SystemListItem 
                title={plan.name}
                subtitle={`${plan.phases.length} ${$t("risk.management.phases") || "Fases de Evolução"}`}
                icon={Trophy}
                onclick={() => goto(`/settings/risk/growth-plans/edit/${plan.id}`)}
                onDelete={() => requestDelete(plan.id)}
                class="hover:border-emerald-500/40"
            >
                {#snippet extra()}
                    <div class="flex items-center gap-8 ml-12 border-l border-white/5 pl-12 hidden lg:flex flex-1">
                        <div class="flex flex-col gap-2 flex-1 max-w-[200px]">
                            <div class="flex justify-between items-center">
                                <span class="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest leading-none">Progresso</span>
                                <span class="text-[8px] font-black text-emerald-500 uppercase leading-none">Fase {plan.current_phase_index + 1}/{plan.phases.length}</span>
                            </div>
                            <div class="w-full h-1 bg-white/5 rounded-xl overflow-hidden">
                                <div 
                                    class="h-full bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                    style="width: {((plan.current_phase_index + 1) / plan.phases.length) * 100}%"
                                ></div>
                            </div>
                        </div>

                        {#if plan.phases[plan.current_phase_index + 1]}
                            <div class="flex flex-col gap-1">
                                <span class="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest leading-none">Próxima Meta</span>
                                <span class="text-[10px] font-black text-foreground/60 leading-none uppercase truncate max-w-[120px]">
                                    {plan.phases[plan.current_phase_index + 1]?.name}
                                </span>
                            </div>
                        {/if}
                    </div>
                {/snippet}
            </SystemListItem>
        {:else}
            <div class="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-black/20 gap-8">
                <div class="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
                    <Trophy class="w-10 h-10 text-muted-foreground/10" />
                </div>
                <div class="space-y-2 text-center">
                    <h3 class="text-sm font-black uppercase tracking-[0.4em] text-foreground/30">Nenhum Plano de Crescimento</h3>
                    <p class="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/20 max-w-[300px] leading-relaxed mx-auto">Sua estratégia de escalabilidade ainda não possui roadmaps configurados.</p>
                </div>
                <Button 
                    class="rounded-xl px-12 h-12 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 shadow-xl shadow-emerald-500/20" 
                    onclick={() => goto('/settings/risk/growth-plans/new')}
                >
                    <Plus class="w-4 h-4 mr-2 stroke-[3px]" />
                    {$t("risk.growthPlans.new") || "Novo Plano"}
                </Button>
            </div>
        {/each}
    </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

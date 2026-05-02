<script lang="ts">
  import { riskSettingsStore } from "$lib/stores/risk-settings.svelte";
  import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";
  import { Plus, Search, TrendingUp, ChevronRight } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import type { GrowthPlan } from "$lib/types";
  import GrowthPlanForm from "$lib/components/settings/growth/GrowthPlanForm.svelte";
  import { t } from "svelte-i18n";
  import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
  import { toast } from "svelte-sonner";
  import { SystemListItem } from "$lib/components/ui/system";

  let isDialogOpen = $state(false);
  let editingItem = $state<GrowthPlan | undefined>(undefined);
  let searchTerm = $state("");

  // Delete Modal State
  let isDeleteOpen = $state(false);
  let deleteId = $state<string | null>(null);

  let filteredItems = $derived(
    riskSettingsStore.growthPlans
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  function openNew() {
    editingItem = undefined;
    isDialogOpen = true;
  }

  function openEdit(item: GrowthPlan) {
    editingItem = $state.snapshot(item);
    isDialogOpen = true;
  }

  async function save(data: Omit<GrowthPlan, "id">) {
    try {
      if (editingItem) {
        await riskSettingsStore.updateGrowthPlan(editingItem.id, data);
      } else {
        await riskSettingsStore.addGrowthPlan(data);
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
    <div class="relative hidden md:block">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
      <input
        type="text"
        bind:value={searchTerm}
        placeholder={$t("settings.growthPlans.searchPlaceholder")}
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

<div class="space-y-8 max-w-7xl mx-auto pb-20 px-4 md:px-0 pt-4">
  <div class="flex flex-col gap-3">
    {#each filteredItems as plan (plan.id)}
      <SystemListItem
        title={plan.name}
        subtitle={$t("settings.growthPlans.evolutionStages", { count: plan.phases.length })}
        icon={TrendingUp}
        onclick={() => openEdit(plan)}
        onDelete={() => requestDelete(plan.id)}
      >
        {#snippet extra()}
          <div class="flex items-center gap-8 mr-6">
            <div class="flex flex-col items-end">
              <span class="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">{$t("settings.growthPlans.scalability")}</span>
              <div class="flex items-center gap-2">
                <span class="text-[12px] font-black text-foreground">{plan.phases[0]?.lot_size || 0}</span>
                <ChevronRight class="w-3 h-3 text-muted-foreground/20" />
                <span class="text-[12px] font-black text-emerald-500">{plan.phases[plan.phases.length - 1]?.lot_size || 0}</span>
                <span class="text-[9px] font-bold text-muted-foreground/40 lowercase ml-1">{$t("settings.growthPlans.contracts")}</span>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1 border-l border-white/5 pl-6 min-w-[80px]">
              <span class="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">{$t("settings.growthPlans.status")}</span>
              <div class="flex items-center gap-2">
                <span
                  class="w-1.5 h-1.5 rounded-full {plan.enabled
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-muted-foreground/30'}"
                ></span>
                <span
                  class="text-[9px] font-black uppercase tracking-tight {plan.enabled
                    ? 'text-emerald-500/80'
                    : 'text-muted-foreground/40'}"
                >
                  {plan.enabled ? $t("settings.growthPlans.active") : $t("settings.growthPlans.paused")}
                </span>
              </div>
            </div>
          </div>
        {/snippet}
      </SystemListItem>
    {:else}
      <div class="flex flex-col items-center justify-center p-32 border-2 border-dashed rounded-[2.5rem] border-border bg-muted/5 text-muted-foreground animate-in zoom-in-95 duration-1000 shadow-2xl mt-8">
        <TrendingUp class="w-20 h-20 opacity-5 animate-pulse mb-8" />
        <span class="text-[10px] font-bold uppercase tracking-[0.5em] opacity-50 text-center">
          {searchTerm ? $t("settings.growthPlans.noSearchResults") : $t("settings.growthPlans.noPlansFound")}
        </span>
        <Button
          variant="link"
          onclick={() => {
            if (searchTerm) searchTerm = "";
            else openNew();
          }}
          class="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-primary hover:text-primary/80 transition-colors"
        >
          {searchTerm ? $t("settings.growthPlans.clearSearch") : $t("settings.growthPlans.createFirst")}
        </Button>
      </div>
    {/each}
  </div>
</div>

<DeleteConfirmationModal bind:open={isDeleteOpen} onConfirm={confirmDelete} />

<Dialog.Root bind:open={isDialogOpen}>
  <Dialog.Content
    class="max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-[#0a0c10] border-border shadow-2xl rounded-[2.5rem]"
  >
    <GrowthPlanForm initialData={editingItem} onSave={save} onCancel={() => (isDialogOpen = false)} />
  </Dialog.Content>
</Dialog.Root>

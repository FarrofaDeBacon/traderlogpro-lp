<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { SystemInput, SystemSelect } from "$lib/components/ui/system";
    import type { ChartType } from "$lib/types";
    import { BarChart3, Info, Hash } from "lucide-svelte";
    import { t } from "svelte-i18n";

    let { initialData, onSave, onCancel } = $props<{
        initialData?: ChartType;
        onSave: (data: Omit<ChartType, "id">) => void;
        onCancel: () => void;
    }>();

    let formData = $state<Omit<ChartType, "id">>({
        name: initialData?.name ?? "",
        base_type: initialData?.base_type ?? "TimeBased",
        parameter: initialData?.parameter ?? ""
    });

    function handleSubmit() {
        onSave($state.snapshot(formData));
    }
</script>

<div class="space-y-6 py-4">
    <div class="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 items-start mb-2">
        <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p class="text-[10px] text-primary/70 font-medium leading-relaxed">
            Defina como os preços são plotados. Gráficos temporais (Candles) usam minutos, enquanto Renko e Range usam ticks de variação.
        </p>
    </div>

    <div class="grid gap-5">
        <SystemInput 
            label={$t("chartTypes.name")} 
            bind:value={formData.name} 
            placeholder={$t("chartTypes.namePlaceholder")} 
        >
            {#snippet icon()}
                <BarChart3 class="w-3.5 h-3.5" />
            {/snippet}
        </SystemInput>

        <SystemSelect 
            label={$t("chartTypes.methodology")}
            bind:value={formData.base_type}
            options={[
                { value: "TimeBased", label: $t("chartTypes.types.TimeBased") },
                { value: "Renko", label: $t("chartTypes.types.Renko") },
                { value: "Range", label: $t("chartTypes.types.Range") }
            ]}
        />
        
        <SystemInput 
            label={$t("chartTypes.parameter")} 
            bind:value={formData.parameter} 
            placeholder={$t("chartTypes.parameterPlaceholder")}
        >
            {#snippet icon()}
                <Hash class="w-3.5 h-3.5" />
            {/snippet}
        </SystemInput>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
        <Button variant="ghost" onclick={onCancel} class="rounded-full px-6 h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {$t("common.cancel")}
        </Button>
        <Button onclick={handleSubmit} class="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            {initialData ? $t("chartTypes.form.save") : $t("chartTypes.new")}
        </Button>
    </div>
</div>

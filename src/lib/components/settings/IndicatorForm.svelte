<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { SystemInput, SystemSelect } from "$lib/components/ui/system";
    import type { Indicator } from "$lib/types";
    import { Activity, Plus, Trash2, Info, Palette } from "lucide-svelte";
    import { t } from "svelte-i18n";

    let { initialData, onSave, onCancel } = $props<{
        initialData?: Indicator;
        onSave: (data: Omit<Indicator, "id">) => void;
        onCancel: () => void;
    }>();

    let formData = $state<Omit<Indicator, "id">>({
        name: initialData?.name ?? "",
        category: initialData?.category ?? "Trend",
        plot_type: initialData?.plot_type ?? "Overlay",
        default_color: initialData?.default_color ?? "#3b82f6",
        usage_description: initialData?.usage_description ?? "",
        parameters: initialData?.parameters ? [...$state.snapshot(initialData.parameters)] : []
    });

    function addParam() {
        formData.parameters = [...formData.parameters, { key: "", value: "" }];
    }

    function removeParam(index: number) {
        formData.parameters = formData.parameters.filter((_, i) => i !== index);
    }

    function handleSubmit() {
        onSave($state.snapshot(formData));
    }
</script>

<div class="space-y-6 py-4">
    <div class="p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3 items-start mb-2">
        <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p class="text-[10px] text-primary/70 font-medium leading-relaxed">
            {$t("indicators.description")}
        </p>
    </div>

    <div class="grid grid-cols-2 gap-5">
        <div class="col-span-2">
            <SystemInput 
                label={$t("indicators.name")} 
                bind:value={formData.name} 
                placeholder={$t("indicators.namePlaceholder")} 
            >
                {#snippet icon()}
                    <Activity class="w-3.5 h-3.5" />
                {/snippet}
            </SystemInput>
        </div>

        <div class="space-y-2">
            <SystemSelect 
                label={$t("indicators.category")}
                bind:value={formData.category}
                options={[
                    { value: "Trend", label: $t("indicators.categories.Trend") },
                    { value: "Oscillator", label: $t("indicators.categories.Oscillator") },
                    { value: "Volume", label: $t("indicators.categories.Volume") },
                    { value: "Other", label: $t("indicators.categories.Other") }
                ]}
            />
        </div>

        <div class="space-y-2">
            <SystemSelect 
                label={$t("indicators.plotType")}
                bind:value={formData.plot_type}
                options={[
                    { value: "Overlay", label: $t("indicators.plotTypes.Overlay") },
                    { value: "SubWindow", label: $t("indicators.plotTypes.SubWindow") }
                ]}
            />
        </div>

        <div class="col-span-2 space-y-2">
            <label class="text-[10px] font-black text-primary uppercase tracking-widest px-1">
                {$t("indicators.defaultColor")}
            </label>
            <div class="flex items-center gap-3">
                <input 
                    type="color" 
                    bind:value={formData.default_color}
                    class="w-10 h-9 rounded-xl border border-border bg-muted/5 p-1 cursor-pointer overflow-hidden"
                />
                <div class="flex-1">
                    <SystemInput bind:value={formData.default_color} placeholder="#000000" />
                </div>
            </div>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
            <label class="text-[10px] font-black text-primary uppercase tracking-widest">
                {$t("indicators.parameters")}
            </label>
            <Button variant="ghost" size="sm" onclick={addParam} class="h-7 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary">
                <Plus class="w-3 h-3 mr-1" /> {$t("indicators.add")}
            </Button>
        </div>
        
        <div class="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            {#each formData.parameters as param, i}
                <div class="flex gap-2 items-end group animate-in fade-in slide-in-from-right-2 duration-300">
                    <div class="flex-1">
                        <SystemInput bind:value={param.key} placeholder={$t("indicators.paramNamePlaceholder")} />
                    </div>
                    <div class="flex-1">
                        <SystemInput bind:value={param.value} placeholder={$t("indicators.paramValue")} />
                    </div>
                    <Button variant="ghost" size="icon" onclick={() => removeParam(i)} class="h-9 w-10 rounded-xl text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10">
                        <Trash2 class="w-4 h-4" />
                    </Button>
                </div>
            {/each}
            {#if formData.parameters.length === 0}
                <div class="text-center py-4 border border-dashed border-border rounded-xl bg-muted/5">
                    <span class="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">{$t("indicators.noParams")}</span>
                </div>
            {/if}
        </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
        <Button variant="ghost" onclick={onCancel} class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {$t("indicators.form.cancel")}
        </Button>
        <Button onclick={handleSubmit} class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-9 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            {initialData ? $t("indicators.edit") : $t("indicators.new")}
        </Button>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
</style>

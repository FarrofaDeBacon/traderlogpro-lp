<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { SystemInput, SystemSelect } from "$lib/components/ui/system";
    import type { EmotionalState } from "$lib/types";
    import { HeartPulse, Info, MessageSquare } from "lucide-svelte";
    import { t } from "svelte-i18n";

    let { initialData, onSave, onCancel } = $props<{
        initialData?: EmotionalState;
        onSave: (data: Omit<EmotionalState, "id">) => void;
        onCancel: () => void;
    }>();

    let formData = $state<Omit<EmotionalState, "id">>({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        impact: initialData?.impact ?? "Neutral",
        weight: initialData?.weight ?? 5,
        potential_impact: initialData?.potential_impact ?? ""
    });

    function handleSubmit() {
        onSave($state.snapshot(formData));
    }
</script>

<div class="space-y-6 py-4">
    <div class="p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3 items-start mb-2">
        <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p class="text-[10px] text-primary/70 font-medium leading-relaxed uppercase tracking-wider">
            {$t("emotionalStates.description")}
        </p>
    </div>

    <div class="grid gap-5">
        <SystemInput 
            label={$t("emotionalStates.form.name")} 
            bind:value={formData.name} 
            placeholder={$t("emotionalStates.form.namePlaceholder")} 
        >
            {#snippet icon()}
                <HeartPulse class="w-3.5 h-3.5" />
            {/snippet}
        </SystemInput>

        <div class="grid grid-cols-2 gap-5">
            <SystemSelect 
                label={$t("emotionalStates.form.impact")}
                bind:value={formData.impact}
                options={[
                    { value: "Positive", label: $t("emotionalStates.form.impactOptions.Positive") },
                    { value: "Neutral", label: $t("emotionalStates.form.impactOptions.Neutral") },
                    { value: "Negative", label: $t("emotionalStates.form.impactOptions.Negative") }
                ]}
            />
            <SystemInput 
                label={$t("emotionalStates.form.weight")} 
                type="number"
                bind:value={formData.weight}
                min="0"
                max="10"
                step="0.1"
            />
        </div>
        
        <SystemInput 
            label={$t("emotionalStates.form.description")} 
            bind:value={formData.description} 
            placeholder={$t("emotionalStates.form.descriptionPlaceholder")}
            multiline={true}
            class="min-h-[120px]"
        >
            {#snippet icon()}
                <MessageSquare class="w-3.5 h-3.5" />
            {/snippet}
        </SystemInput>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
        <Button variant="ghost" onclick={onCancel} class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {$t("emotionalStates.form.cancel")}
        </Button>
        <Button onclick={handleSubmit} class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-9 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            {initialData ? $t("emotionalStates.form.save") : $t("emotionalStates.new")}
        </Button>
    </div>
</div>

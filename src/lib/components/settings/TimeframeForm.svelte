<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Button } from "$lib/components/ui/button";
    import { SystemInput } from "$lib/components/ui/system";
    import type { Timeframe } from "$lib/types";
    import { Clock, Info } from "lucide-svelte";
    import { t } from "svelte-i18n";

    let { initialData, onSave, onCancel } = $props<{
        initialData?: Timeframe;
        onSave: (data: Omit<Timeframe, "id">) => void;
        onCancel: () => void;
    }>();

    let formData = $state<Omit<Timeframe, "id">>({
        name: initialData?.name ?? "",
        value: initialData?.value ?? ""
    });

    function handleSubmit() {
        onSave($state.snapshot(formData));
    }
</script>

<div class="space-y-6 py-4">
    <div class="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 items-start mb-2">
        <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p class="text-[10px] text-primary/70 font-medium leading-relaxed">
            {$t("timeframes.description")}
        </p>
    </div>

    <div class="grid gap-5">
        <SystemInput 
            label={$t("timeframes.displayName")} 
            bind:value={formData.name} 
            placeholder={$t("timeframes.namePlaceholder")} 
        >
            {#snippet icon()}
                <Clock class="w-3.5 h-3.5" />
            {/snippet}
        </SystemInput>
        
        <SystemInput 
            label={$t("timeframes.value")} 
            bind:value={formData.value} 
            placeholder={$t("timeframes.valuePlaceholder")}
        />
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
        <Button variant="ghost" onclick={onCancel} class="rounded-full px-6 h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {$t("timeframes.form.cancel")}
        </Button>
        <Button onclick={handleSubmit} class="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            {initialData ? $t("timeframes.edit") : $t("timeframes.new")}
        </Button>
    </div>
</div>

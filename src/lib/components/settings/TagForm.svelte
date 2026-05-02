<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { SystemInput } from "$lib/components/ui/system";
    import type { Tag } from "$lib/types";
    import { Tag as TagIcon, Palette, Info } from "lucide-svelte";
    import { t } from "svelte-i18n";
    import { Badge } from "$lib/components/ui/badge";
    import { keyboardForm } from "$lib/actions/keyboard-nav";

    let { initialData, onSave, onCancel } = $props<{
        initialData?: Tag;
        onSave: (data: Omit<Tag, "id">) => void;
        onCancel: () => void;
    }>();

    let formData = $state<Omit<Tag, "id">>({
        name: initialData?.name ?? "",
        color: initialData?.color ?? "#3b82f6"
    });

    function handleSubmit() {
        onSave($state.snapshot(formData));
    }
</script>

<div class="space-y-6 py-4" use:keyboardForm>
    <div class="p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3 items-start mb-2">
        <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p class="text-[10px] text-primary/70 font-medium leading-relaxed uppercase tracking-wider">
            {$t("tags.description")}
        </p>
    </div>

    <div class="grid gap-6">
        <SystemInput 
            label={$t("tags.form.name")} 
            bind:value={formData.name} 
            placeholder={$t("tags.form.namePlaceholder")} 
        >
            {#snippet icon()}
                <TagIcon class="w-3.5 h-3.5" />
            {/snippet}
        </SystemInput>

        <div class="space-y-3 p-4 rounded-xl bg-muted/5 border border-white/5">
            <div class="flex items-center justify-between">
                <label class="text-[10px] font-black text-primary uppercase tracking-widest px-1">
                    {$t("tags.form.color")}
                </label>
                <Badge variant="secondary" style="background-color: {formData.color}20; color: {formData.color}; border-color: {formData.color}40;" class="text-[10px] font-bold px-3 py-1 rounded-full border">
                    {formData.name || "PREVIEW TAG"}
                </Badge>
            </div>
            
            <div class="flex items-center gap-3">
                <input 
                    type="color" 
                    bind:value={formData.color}
                    class="w-10 h-9 rounded-xl border border-border bg-muted/5 p-1 cursor-pointer overflow-hidden"
                />
                <div class="flex-1">
                    <SystemInput bind:value={formData.color} placeholder="#000000" />
                </div>
            </div>
        </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
        <Button variant="ghost" onclick={onCancel} class="rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {$t("tags.form.cancel")}
        </Button>
        <Button onclick={handleSubmit} class="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-9 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            {initialData ? $t("tags.form.save") : $t("tags.new")}
        </Button>
    </div>
</div>

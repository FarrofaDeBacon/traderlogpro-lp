<script lang="ts">
    import { Root as SelectRoot, Trigger as SelectTrigger, Content as SelectContent, Item as SelectItem } from "$lib/components/ui/select";
    import { cn } from "$lib/utils";

    type Option = {
        value: string;
        label: string;
    };

    let { 
        value = $bindable(), 
        options = [], 
        placeholder = "Selecione...",
        label = "",
        class: className = "",
        onchange
    } = $props<{
        value: string | undefined;
        options: Option[];
        placeholder?: string;
        label?: string;
        class?: string;
        onchange?: (value: string) => void;
    }>();

    let selectedLabel = $derived(
        options?.find(o => o.value === value)?.label ?? placeholder
    );
    
    let selectId = `system-select-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class={cn("flex flex-col gap-2 w-full", className)}>
    {#if label}
        <label for={selectId} class="text-[9px] font-black uppercase tracking-[var(--letter-spacing-institutional)] text-muted-foreground/80 px-1 ml-1 block">
            {label}
        </label>
    {/if}
    
    <SelectRoot type="single" bind:value portal={null} onValueChange={(v) => onchange?.(v)}>
        <SelectTrigger id={selectId} class="w-full bg-white dark:bg-muted/10 border border-border rounded-xl h-10 text-foreground px-6 shadow-sm text-[13px] font-bold tracking-tight focus:ring-1 focus:ring-primary/20 transition-all text-left group">
            <span class="truncate group-hover:translate-x-0.5 transition-transform duration-300">{selectedLabel}</span>
        </SelectTrigger>
        <SelectContent 
            class="bg-white dark:bg-[#0a0c10] border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[var(--bits-select-trigger-width)] ring-1 ring-black/5 dark:ring-white/10"
            style="opacity: 1 !important;"
        >
            <div class="max-h-[300px] overflow-y-auto custom-scrollbar">
                {#each options as option}
                    <SelectItem 
                        value={option.value} 
                        class="text-[11px] font-bold uppercase tracking-wider py-3.5 px-6 rounded-none cursor-pointer data-[highlighted]:text-blue-500 dark:data-[highlighted]:text-blue-400 data-[highlighted]:bg-blue-500/5 data-[selected]:text-primary transition-all outline-none border-b border-border/5 last:border-0"
                        style="background-color: transparent !important;"
                    >
                        {option.label}
                    </SelectItem>
                {/each}
            </div>
        </SelectContent>
    </SelectRoot>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); }
</style>

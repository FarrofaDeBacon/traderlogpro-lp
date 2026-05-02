<script lang="ts">
    import * as Select from "$lib/components/ui/select";
    import { CalendarIcon, ChevronDown } from "lucide-svelte";
    import { t } from "svelte-i18n";
    import { cn } from "$lib/utils";

    let {
        value = $bindable("today"),
        startDate = $bindable(""),
        endDate = $bindable(""),
        label = $t("filters.date.period"),
    } = $props();

    const presets = [
        { value: "today", label: "filters.date.today" },
        { value: "yesterday", label: "filters.date.yesterday" },
        { value: "this_week", label: "filters.date.this_week" },
        { value: "last_week", label: "filters.date.last_week" },
        { value: "this_month", label: "filters.date.this_month" },
        { value: "last_month", label: "filters.date.last_month" },
        { value: "this_year", label: "filters.date.this_year" },
        { value: "last_year", label: "filters.date.last_year" },
        { value: "all", label: "filters.date.all" },
        { value: "custom", label: "filters.date.custom" },
    ];

    const triggerContent = $derived(
        presets.find((p) => p.value === value)?.label ?? "filters.date.select",
    );
</script>

<div class={cn("flex flex-col gap-2")}>
    {#if label}
        <label class="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 px-1 ml-1 block">
            {label}
        </label>
    {/if}
    
    <div class="flex items-center gap-2">
        <Select.Root type="single" bind:value>
            <Select.Trigger class="h-10 px-4 bg-muted/10 dark:bg-white/[0.03] border border-border rounded-xl hover:border-primary/20 transition-all text-[11px] font-black shadow-sm flex items-center justify-between gap-2 w-[220px] text-foreground/80 ring-0 focus:ring-1 focus:ring-primary/20">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <CalendarIcon class="w-3.5 h-3.5 text-primary/40 shrink-0" />
                    <span class="truncate uppercase tracking-wider text-left">
                        {$t(triggerContent)}
                    </span>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            </Select.Trigger>
            <Select.Content portal={null} class="bg-white dark:bg-[#0c0d10] border border-border rounded-2xl p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[9999] min-w-[220px]">
                {#each presets as preset}
                    <Select.Item 
                        value={preset.value}
                        class="text-[11px] font-black uppercase tracking-wider px-4 py-3 rounded-lg cursor-pointer transition-all data-[selected]:bg-primary/10 data-[selected]:text-primary data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary outline-none"
                    >
                        {$t(preset.label)}
                    </Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>

        {#if value === "custom"}
            <div
                class="flex items-center gap-2 animate-in fade-in slide-in-from-left-5"
            >
                <div class="relative">
                    <input 
                        type="date" 
                        bind:value={startDate} 
                        class="h-10 px-4 bg-muted/10 dark:bg-white/[0.03] border border-border rounded-xl text-[11px] font-black outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-sm w-[140px]" 
                    />
                </div>
                <span class="text-[9px] font-black text-muted-foreground/30 px-1 italic">TO</span>
                <div class="relative">
                    <input 
                        type="date" 
                        bind:value={endDate} 
                        class="h-10 px-4 bg-muted/10 dark:bg-white/[0.03] border border-border rounded-xl text-[11px] font-black outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-sm w-[140px]" 
                    />
                </div>
            </div>
        {/if}
    </div>
</div>

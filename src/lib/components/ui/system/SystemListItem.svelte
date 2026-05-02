<script lang="ts">
    import { cn } from "$lib/utils";
    import { Pencil, Trash2, ChevronRight } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";

    let { 
        class: className = "", 
        title,
        subtitle,
        icon: Icon,
        onEdit,
        onDelete,
        onclick, 
        onkeydown,
        children,
        extra,
        raw = false
    } = $props<{
        class?: string;
        title?: string;
        subtitle?: string;
        icon?: any;
        onEdit?: () => void;
        onDelete?: () => void;
        onclick?: () => void;
        onkeydown?: (e: KeyboardEvent) => void;
        children?: any;
        extra?: any;
        raw?: boolean;
    }>();
</script>

<div
    class={cn(
        "group relative bg-card dark:bg-white/[0.02] border border-border dark:border-white/5 rounded-xl px-4 py-3 hover:border-primary/30 dark:hover:border-primary/30 hover:bg-muted/10 dark:hover:bg-white/[0.04] transition-all duration-500 cursor-pointer flex items-center justify-between overflow-hidden shadow-sm hover:shadow-primary/5",
        className
    )}
    {onclick}
    {onkeydown}
    role="button"
    tabindex={0}
>
    {#if raw}
        {#if children}
            {@render children()}
        {/if}
    {:else}
        <div class="flex items-center gap-4 flex-1 min-w-0">
            {#if Icon}
                <div class="p-3 bg-muted/20 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-border dark:border-white/5 w-12 h-12 flex items-center justify-center shadow-sm shrink-0">
                    <Icon class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            {/if}

            <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                {#if title}
                    <h4 class="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors uppercase truncate">
                        {title}
                    </h4>
                {/if}
                {#if subtitle}
                    <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                        {subtitle}
                    </span>
                {/if}
                {#if children}
                    {@render children()}
                {/if}
            </div>

            {#if extra}
                {@render extra()}
            {/if}
        </div>

        <div class="flex items-center gap-3 ml-4">
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {#if onDelete}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        class="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60" 
                        onclick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                        <Trash2 class="w-4 h-4" />
                    </Button>
                {/if}
                
                {#if onEdit}
                    <div class="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Pencil class="w-3.5 h-3.5 text-primary" />
                    </div>
                {/if}
            </div>
            <ChevronRight class="w-5 h-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
        </div>
    {/if}
</div>

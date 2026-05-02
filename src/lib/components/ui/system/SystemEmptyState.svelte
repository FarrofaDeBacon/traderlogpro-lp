<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Search } from "lucide-svelte";

  let {
    title = "",
    description = "",
    icon: Icon = Search,
    actionLabel = "",
    onAction = () => {},
    colSpanFull = false,
    class: className = "",
  }: {
    title?: string;
    description?: string;
    icon?: any;
    actionLabel?: string;
    onAction?: () => void;
    colSpanFull?: boolean;
    class?: string;
  } = $props();
</script>

<div
  class={cn(
    "flex flex-col items-center justify-center p-20 md:p-32",
    "border-2 border-dashed rounded-[3rem]",
    "border-border/30 bg-muted/5",
    "text-muted-foreground",
    "animate-in zoom-in-95 duration-700",
    colSpanFull && "col-span-full",
    className
  )}
>
  <!-- Icon Circle -->
  <div class="p-6 bg-muted/10 rounded-full mb-8">
    <Icon class="w-12 h-12 opacity-20" />
  </div>

  <!-- Title -->
  {#if title}
    <h3 class="text-xs font-black uppercase tracking-[0.4em] text-foreground/40 mb-2 text-center">
      {title}
    </h3>
  {/if}

  <!-- Description -->
  {#if description}
    <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-8 text-center max-w-xs">
      {description}
    </p>
  {/if}

  <!-- Action Button -->
  {#if actionLabel}
    <Button
      variant="outline"
      class="rounded-full px-10 h-12 border-border/50 hover:bg-muted/20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
      onclick={onAction}
    >
      <Plus class="w-4 h-4 mr-2" />
      {actionLabel}
    </Button>
  {/if}
</div>

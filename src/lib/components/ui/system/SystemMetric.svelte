<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    status?: "success" | "warning" | "danger" | "info" | "none";
    weight?: "black" | "bold";
    subvalue?: string | Snippet;
    variant?: "default" | "compact";
    valueClass?: string;
  }

  let { 
    label, 
    value, 
    status = "none", 
    weight = "bold",
    subvalue = "",
    variant = "default",
    valueClass = "",
    class: className,
    ...rest 
  }: Props = $props();

  const valueColors = {
    success: "text-status-success",
    warning: "text-status-warning",
    danger: "text-status-danger",
    info: "text-status-info",
    none: "text-foreground"
  };
</script>

<div class={cn("flex flex-col", variant === "default" ? "gap-1.5" : "gap-1", className)} {...rest}>
  <div class="flex items-center justify-between gap-2">
    <span class={cn(
      "font-black uppercase tracking-[var(--letter-spacing-institutional)] text-foreground/70 leading-none truncate",
      variant === "compact" ? "text-[9px]" : "text-[10px]"
    )}>
      {label}
    </span>
  </div>
  
  <div class="flex flex-col">
    <span class={cn(
      "font-mono tabular-nums tracking-tighter leading-none",
      variant === "compact" ? "text-sm" : "text-base",
      weight === "black" ? "font-black" : "font-bold",
      valueColors[status],
      valueClass
    )}>
      {value}
    </span>
    
    {#if subvalue}
      <div class={cn(
        "text-foreground/50 font-bold leading-none truncate uppercase tracking-widest",
        variant === "compact" ? "text-[9px] mt-1" : "text-[10px] mt-1.5"
      )}>
        {#if typeof subvalue === "string"}
          {subvalue}
        {:else}
          {@render subvalue()}
        {/if}
      </div>
    {/if}
  </div>
</div>

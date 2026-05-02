<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    label?: string;
    value?: string | number | null;
    class?: string;
    containerClass?: string;
    error?: string;
    multiline?: boolean;
  }

  let { 
    label, 
    value = $bindable(), 
    class: className,
    containerClass,
    error,
    multiline,
    ...rest 
  }: Props = $props();
</script>

<div class={cn("flex flex-col gap-2 w-full", containerClass)}>
  {#if label}
    <label 
      class="text-[9px] font-black uppercase tracking-[var(--letter-spacing-institutional)] text-muted-foreground/80 px-1 ml-1"
      for={rest.id}
    >
      {label}
    </label>
  {/if}
  
  <div class="relative group">
    {#if multiline}
      <textarea
        bind:value={value as string}
        class={cn(
          "flex min-h-20 w-full rounded-[2rem] border border-border bg-white dark:bg-muted/10 px-5 py-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:bg-white dark:focus-visible:bg-muted/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/20 resize-none shadow-sm",
          error && "border-destructive/50 focus-visible:border-destructive/70",
          className
        )}
        {...rest as any}
      ></textarea>
    {:else}
      <input
        bind:value={value}
        class={cn(
          "flex h-10 w-full rounded-xl border border-border bg-white dark:bg-muted/10 px-6 py-2 text-[13px] transition-all duration-300 placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:bg-white dark:focus-visible:bg-muted/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/20 shadow-sm",
          error && "border-destructive/50 focus-visible:border-destructive/70",
          className
        )}
        {...rest}
      />
    {/if}
    
    {#if error}
      <p class="text-[9px] font-bold uppercase tracking-widest text-destructive mt-1.5 ml-4 animate-in fade-in slide-in-from-top-1">
        {error}
      </p>
    {/if}
  </div>
</div>

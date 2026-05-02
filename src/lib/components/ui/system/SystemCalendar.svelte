<script lang="ts">
  import { DatePicker } from "bits-ui";
  import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { t } from "svelte-i18n";
  import {
    CalendarDate,
    getLocalTimeZone,
    today,
    parseDate
  } from "@internationalized/date";

  type Props = {
    value?: string | null;
    label?: string;
    placeholder?: string;
    class?: string;
    containerClass?: string;
    onchange?: (value: string | null) => void;
  };

  let {
    value = $bindable(null),
    label,
    placeholder = "DD/MM/YYYY",
    class: className = "",
    containerClass = "",
    onchange
  }: Props = $props();

  let internalDate = $state<CalendarDate | undefined>(undefined);

  $effect(() => {
    if (value && typeof value === 'string') {
      try {
        const datePart = value.split('T')[0];
        internalDate = parseDate(datePart);
      } catch (e) {
        internalDate = undefined;
      }
    } else {
      internalDate = undefined;
    }
  });

  function handleDateChange(newDate: CalendarDate | undefined) {
    internalDate = newDate;
    const newValue = newDate ? newDate.toString() : null;
    value = newValue;
    onchange?.(newValue);
  }

  function setToday() {
    handleDateChange(today(getLocalTimeZone()));
  }

  function clear() {
    handleDateChange(undefined);
  }
  
  let inputId = `system-calendar-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class={cn("flex flex-col gap-1.5 w-full", containerClass)}>
  {#if label}
    <label for={inputId} class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1 ml-1">
      {label}
    </label>
  {/if}

  <DatePicker.Root
    value={internalDate}
    onValueChange={handleDateChange}
    weekdayFormat="short"
  >
    <div class="relative group">
      <DatePicker.Input
        id={inputId}
        class={cn(
          "flex h-10 w-full rounded-xl border border-border bg-white dark:bg-muted/10 px-4 py-2 text-[13px] font-bold transition-all focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-muted/20 hover:border-primary/20 shadow-sm items-center",
          className
        )}
      >
        {#snippet children({ segments })}
          {#each segments as { part, value }}
            <DatePicker.Segment {part} class="focus:text-primary focus:bg-primary/10 rounded-sm px-0.5 outline-none tabular-nums">
              {value}
            </DatePicker.Segment>
          {/each}
          
          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {#if internalDate}
                <button 
                  type="button" 
                  onclick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }} 
                  class="p-1 text-muted-foreground/30 hover:text-rose-500 rounded-md transition-colors"
                >
                    <X class="w-3.5 h-3.5" />
                </button>
            {/if}
            <DatePicker.Trigger class="p-1.5 bg-primary/5 hover:bg-primary/15 text-primary rounded-lg transition-all border border-primary/10 active:scale-90">
              <CalendarDays class="w-4 h-4" />
            </DatePicker.Trigger>
          </div>
        {/snippet}
      </DatePicker.Input>
    </div>

    <DatePicker.Content
      sideOffset={8}
      class="z-[100] bg-white dark:bg-[#0c0d10] border border-black/10 dark:border-white/5 rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      <DatePicker.Calendar class="w-full">
        {#snippet children({ months, weekdays })}
          <DatePicker.Header class="flex items-center justify-between pb-4">
            <DatePicker.PrevButton class="p-2 hover:bg-muted/10 rounded-xl transition-colors">
              <ChevronLeft class="w-4 h-4" />
            </DatePicker.PrevButton>
            <DatePicker.Heading class="text-[11px] font-black uppercase tracking-widest text-foreground/80" />
            <DatePicker.NextButton class="p-2 hover:bg-muted/10 rounded-xl transition-colors">
              <ChevronRight class="w-4 h-4" />
            </DatePicker.NextButton>
          </DatePicker.Header>

          <div class="flex flex-col gap-4">
            {#each months as month}
              <DatePicker.Grid class="w-full border-collapse">
                <DatePicker.GridHead>
                  <DatePicker.GridRow class="flex w-full justify-between pb-2">
                    {#each weekdays as day}
                      <DatePicker.HeadCell class="w-8 text-[9px] font-black text-muted-foreground/40 uppercase text-center">
                        {day.slice(0, 2)}
                      </DatePicker.HeadCell>
                    {/each}
                  </DatePicker.GridRow>
                </DatePicker.GridHead>
                <DatePicker.GridBody>
                  {#each month.weeks as weekDates}
                    <DatePicker.GridRow class="flex w-full justify-between">
                      {#each weekDates as date}
                        <DatePicker.Cell {date} class="relative p-0 text-center text-sm">
                          <DatePicker.Day
                            {date}
                            class={cn(
                              "h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all duration-200 outline-none select-none",
                              "hover:bg-primary/10 hover:text-primary cursor-pointer",
                              "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-lg data-[selected]:shadow-primary/20",
                              "data-[outside-month]:opacity-20 data-[outside-month]:pointer-events-none",
                              "data-[today]:border data-[today]:border-primary/30 data-[today]:text-primary"
                            )}
                          >
                            {date.day}
                          </DatePicker.Day>
                        </DatePicker.Cell>
                      {/each}
                    </DatePicker.GridRow>
                  {/each}
                </DatePicker.GridBody>
              </DatePicker.Grid>
            {/each}
          </div>

          <div class="flex items-center gap-2 mt-4 pt-4 border-t border-border/10">
            <button 
              type="button" 
              onclick={(e) => { e.preventDefault(); e.stopPropagation(); setToday(); }} 
              class="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-primary/5 transition-all"
            >
              {$t('common.today') || 'Hoje'}
            </button>
            <button 
              type="button" 
              onclick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); }} 
              class="flex-1 bg-muted/5 hover:bg-muted/10 text-muted-foreground text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-border/5 transition-all" 
            >
              {$t('common.clear') || 'Limpar'}
            </button>
          </div>
        {/snippet}
      </DatePicker.Calendar>
    </DatePicker.Content>
  </DatePicker.Root>
</div>

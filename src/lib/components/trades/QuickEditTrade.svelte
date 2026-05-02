<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { tradesStore } from "$lib/stores/trades.svelte";
    import { t } from "svelte-i18n";
    import * as Dialog from "$lib/components/ui/dialog";
    import { TrendingUp, TrendingDown, Loader2, Edit3, Target, Save } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { SystemInput } from "$lib/components/ui/system";

    let { open = $bindable(false), trade, onsave, onadvanced } = $props<{
        open: boolean;
        trade: any;
        onsave: () => void;
        onadvanced: () => void;
    }>();

    let asset = $state("");
    let direction = $state<"Buy" | "Sell">("Buy");
    let resultInput = $state("");
    let dateInput = $state("");
    let isSubmitting = $state(false);

    $effect(() => {
        if (open && trade) {
            asset = trade.asset_symbol || "";
            direction = trade.direction || "Buy";
            resultInput = trade.result?.toString() || "0";
            dateInput = trade.date
                ? trade.date.slice(0, 16)
                : new Date().toISOString().slice(0, 16);
        }
    });

    async function handleSave() {
        if (!trade || !asset || !resultInput || !dateInput) return;
        const resParsed = parseFloat(resultInput.replace(",", "."));
        if (isNaN(resParsed)) {
            toast.error($t("trades.quick_edit.invalid_result"));
            return;
        }

        isSubmitting = true;

        try {
            const updatedTrade = {
                ...trade,
                asset_symbol: asset.toUpperCase(),
                direction,
                result: resParsed,
                date: dateInput,
                exit_date: dateInput,
            };

            const res = await tradesStore.updateTrade(trade.id, updatedTrade);
            if (res.success) {
                toast.success($t("trades.quick_edit.save_success"));
                open = false;
                onsave();
            } else {
                toast.error($t("trades.quick_edit.save_error") + res.error);
            }
        } catch (e) {
            toast.error($t("trades.quick_edit.network_fail"));
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-md bg-background/95 backdrop-blur-2xl border-border/50 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
        <!-- Header Section -->
        <div class="p-6 border-b border-border/10 bg-muted/5">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-4">
                    <div class="p-3 bg-primary/10 rounded-2xl text-primary shadow-2xl shadow-primary/20 border border-primary/20">
                        <Edit3 class="w-5 h-5" />
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xl font-black uppercase tracking-tight text-foreground/90">{$t("trades.quick_edit.title")}</span>
                        <span class="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] leading-none">{$t("trades.quick_edit.description")}</span>
                    </div>
                </Dialog.Title>
            </Dialog.Header>
        </div>

        {#if trade}
            <div class="p-8 space-y-8">
                <div class="grid grid-cols-1 gap-8">
                    <!-- Date & Time -->
                    <SystemInput 
                        label={$t("trades.quick_edit.date_time")}
                        type="datetime-local"
                        bind:value={dateInput}
                        class="bg-muted/10 border-border/20 focus:bg-muted/20 transition-all h-11"
                    />
                    
                    <div class="grid grid-cols-2 gap-6">
                        <!-- Asset -->
                        <SystemInput 
                            label={$t("trades.quick_edit.asset")}
                            bind:value={asset}
                            class="uppercase font-mono font-black tracking-widest bg-muted/10 border-border/20 focus:bg-muted/20 h-11"
                        />
                        
                        <!-- Direction (Bias) -->
                        <div class="space-y-2">
                            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-1 ml-1">{$t("trades.quick_edit.bias")}</span>
                            <div class="grid grid-cols-2 gap-2 h-11 bg-muted/10 p-1.5 rounded-full border border-border/20">
                                <button 
                                    onclick={() => direction = "Buy"} 
                                    class="rounded-full flex items-center justify-center gap-2 transition-all duration-300 {direction === 'Buy' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 font-black' : 'text-muted-foreground/30 hover:bg-muted/10'}"
                                >
                                    <TrendingUp class="w-3.5 h-3.5" />
                                    <span class="text-[9px] font-black uppercase tracking-widest">{$t('trades.quicklog.buy_upper')}</span>
                                </button>
                                <button 
                                    onclick={() => direction = "Sell"} 
                                    class="rounded-full flex items-center justify-center gap-2 transition-all duration-300 {direction === 'Sell' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 font-black' : 'text-muted-foreground/30 hover:bg-muted/10'}"
                                >
                                    <TrendingDown class="w-3.5 h-3.5" />
                                    <span class="text-[9px] font-black uppercase tracking-widest">{$t('trades.quicklog.sell_upper')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Result PnL -->
                    <div class="space-y-2">
                        <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-1 ml-1">{$t("trades.quick_edit.result")}</span>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <span class="text-muted-foreground/20 font-mono font-black text-xl">$</span>
                            </div>
                            <input 
                                bind:value={resultInput}
                                class="h-16 w-full rounded-3xl bg-muted/20 border border-border/20 px-12 text-3xl font-black tabular-nums transition-all duration-500 focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 {resultInput.toString().startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}"
                            />
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="flex items-center gap-4 pt-4 border-t border-border/10">
                    <Button 
                        variant="outline" 
                        class="rounded-full flex-1 border-border/20 bg-muted/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-foreground hover:bg-muted/10 h-12 transition-all" 
                        onclick={() => { open = false; onadvanced(); }}
                    >
                        <Target class="w-3.5 h-3.5 mr-2 opacity-40" />
                        {$t("trades.quick_edit.full_mode")}
                    </Button>
                    
                    <Button 
                        disabled={isSubmitting} 
                        class="rounded-full flex-1 bg-primary text-primary-foreground font-black tracking-[0.2em] uppercase text-[9px] h-12 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center gap-3" 
                        onclick={handleSave}
                    >
                        {#if isSubmitting} 
                            <Loader2 class="w-4 h-4 animate-spin" /> 
                        {:else} 
                            <Save class="w-4 h-4" />
                            {$t("trades.quick_edit.save")} 
                        {/if}
                    </Button>
                </div>
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>

<style>
    :global(.glass) {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
</style>

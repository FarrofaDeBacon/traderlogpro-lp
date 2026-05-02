<script lang="ts">
    import { llmService } from "$lib/services/llmService";
    import { SystemAICard } from "$lib/components/ui/system";
    import { Button } from "$lib/components/ui/button";
    import { BrainCircuit, CheckCircle2, ShieldAlert } from "lucide-svelte";
    import { onDestroy } from "svelte";
    import { t } from "svelte-i18n";

    let { 
        periodStr = "Últimos 30 Dias",
        metricsPayload = {},
        hasActiveAiProvider = false
    } = $props();

    let loading = $state(false);
    let insight: any = $state(null);
    let error: string | null = $state(null);
    let componentMounted = true;

    onDestroy(() => { componentMounted = false; });

    export async function generateInsight() {
        if (!hasActiveAiProvider) {
            error = $t("psychology.ai.noProvider"); return;
        }
        loading = true;
        error = null;
        try {
            const result = await llmService.generatePsychologyInsight(periodStr, metricsPayload);
            if (componentMounted) insight = result;
        } catch (e: any) {
            if (componentMounted) error = e.message || $t("psychology.ai.error");
        } finally {
            if (componentMounted) loading = false;
        }
    }

    let status: "loading" | "error" | "success" | "idle" = $derived(loading ? "loading" : error ? "error" : insight ? "success" : "idle");
</script>

{#snippet idleActions()}
    <Button 
        variant="outline" 
        size="sm" 
        onclick={generateInsight} 
        disabled={!hasActiveAiProvider}
        class="h-7 text-[10px] px-3 border-primary/20 hover:bg-primary/5 text-primary font-black uppercase tracking-widest"
    >
        {$t("psychology.ai.generateAction")}
    </Button>
{/snippet}

{#snippet retryAction()}
    <Button 
        size="sm" 
        variant="ghost" 
        class="h-6 text-[10px] text-rose-500 hover:bg-rose-500/10 font-black uppercase tracking-widest" 
        onclick={generateInsight}
    >
        {$t("psychology.ai.retryAction")}
    </Button>
{/snippet}

{#snippet content()}
    <div class="flex items-center gap-1.5 mb-1.5 text-primary/80">
        <BrainCircuit class="w-3.5 h-3.5" />
        <h4 class="font-black text-[10px] uppercase tracking-[0.2em]">{$t("psychology.ai.dominantPattern")}</h4>
    </div>
    <p class="text-xs leading-relaxed text-foreground/90 font-medium line-clamp-2 italic">
        "{insight.dominantPattern || $t("psychology.ai.patternPlaceholder")}"
    </p>
{/snippet}

{#snippet matrix()}
    <div class="grid grid-cols-2 gap-3 w-full">
        <div class="p-3 rounded-md border border-status-danger/20 bg-status-danger/[0.03]">
            <div class="flex items-center gap-1.5 mb-1.5 text-status-danger">
                <ShieldAlert class="w-3.5 h-3.5" />
                <h4 class="font-black text-[10px] uppercase tracking-widest">{$t("psychology.ai.majorRisk")}</h4>
            </div>
            <p class="text-[11px] text-foreground font-bold leading-snug">{insight.majorRisk || $t("psychology.ai.riskPlaceholder")}</p>
        </div>

        <div class="p-3 rounded-md border border-status-success/20 bg-status-success/[0.03]">
            <div class="flex items-center gap-1.5 mb-1.5 text-status-success">
                <CheckCircle2 class="w-3.5 h-3.5" />
                <h4 class="font-black text-[10px] uppercase tracking-widest">{$t("psychology.ai.suggestedProtocol")}</h4>
            </div>
            <p class="text-[11px] text-foreground font-bold leading-snug">{insight.practicalActions?.[0] || $t("psychology.ai.defaultProtocol")}</p>
        </div>
    </div>
{/snippet}

<SystemAICard 
    {status}
    title={$t("psychology.ai.cardTitle")}
    description={$t("psychology.ai.cardDescription")}
    errorText={error || $t("psychology.ai.error")}
    origin={insight?._meta?.origin}
    responseTimeMs={insight?._meta?.responseTimeMs}
    {idleActions}
    {retryAction}
    {content}
    {matrix}
/>

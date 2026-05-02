<script lang="ts">
    import DetailModal from "$lib/components/shared/DetailModal.svelte";
    import DarfDetailView from "./DarfDetailView.svelte";
    import { Button } from "$lib/components/ui/button";
    import { irpfStore, type TaxDarf } from "$lib/stores/irpfStore.svelte";
    import { FileText, Undo2 } from "lucide-svelte";
    import { t } from "svelte-i18n";
    import { toast } from "svelte-sonner";

    let {
        transactionId = "",
        darfId = "",
        appraisalId = "",
        open = $bindable(false),
    } = $props();

    let darf = $state<TaxDarf | null>(null);
    let appraisal = $state<any>(null);
    let loading = $state(false);
    let isComplementary = $state(false);

    $effect(() => {
        if (open && (transactionId || darfId || appraisalId)) {
            loadDarf();
        }
    });

    async function loadDarf() {
        loading = true;
        darf = null;
        appraisal = null;
        try {
            console.log("[DARF DIALOG] loadDarf event triggered", {
                darfId,
                transactionId,
                appraisalId,
            });

            if (darfId) {
                darf = await irpfStore.getDarfById(darfId).catch(() => null);
            } else if (transactionId) {
                darf = await irpfStore.getDarfByTransaction(transactionId).catch(() => null);
            }

            if (darf) {
                if (darf.appraisal_id) {
                    appraisal = await irpfStore.getAppraisalById(darf.appraisal_id).catch(() => null);
                }
                isComplementary = darf.is_complementary;
            } else if (appraisalId) {
                appraisal = await irpfStore.getAppraisalById(appraisalId).catch(() => null);
                if (appraisal) {
                    isComplementary = appraisal.is_complementary;
                }
            }

            if (!darf && !appraisal && open) {
                console.warn("[DARF DIALOG] No valid data found for displayed identifiers");
            }

        } catch (e) {
            console.error("[DARF DIALOG] CRITICAL: Unexpected error in loadDarf:", e);
            toast.error($t("finance.darfDetails.errorMessage"));
        } finally {
            loading = false;
        }
    }

    let showUnpayConfirm = $state(false);

    async function confirmUnpay() {
        if (!darf) return;
        try {
            await irpfStore.unpayDarf(irpfStore.getId(darf.id));
            open = false; 
            showUnpayConfirm = false;
        } catch (error) {
            console.error("[DARF DIALOG] Error undoing payment:", error);
        }
    }
</script>

<DetailModal
    bind:open
    title={$t("finance.darfDetails.title")}
    description={$t("finance.darfDetails.description")}
    icon={FileText}
    {loading}
>
    {#if darf || appraisal}
        <DarfDetailView {darf} {appraisal} {isComplementary} />
    {:else}
        <div class="py-12 text-center space-y-2 opacity-50">
            <FileText class="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {$t("finance.darfDetails.errorMessage")}
            </p>
        </div>
    {/if}

    {#snippet footer()}
        {#if showUnpayConfirm}
            <div class="flex items-center gap-2 mr-auto">
                <Undo2 class="w-4 h-4 text-rose-500 animate-pulse" />
                <span class="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                    {$t("finance.darfDetails.unpayTitle")}
                </span>
            </div>
            <Button
                variant="destructive"
                onclick={confirmUnpay}
                class="bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-[10px]"
            >
                {$t("finance.darfDetails.unpayConfirm")}
            </Button>
            <Button
                variant="outline"
                onclick={() => (showUnpayConfirm = false)}
                class="border-border text-muted-foreground hover:bg-accent font-bold uppercase text-[10px]"
            >
                {$t("finance.darfDetails.unpayCancel")}
            </Button>
        {:else}
            {#if darf && darf.status === "Paid"}
                <Button
                    variant="destructive"
                    onclick={() => showUnpayConfirm = true}
                    class="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 mr-auto transition-all font-black uppercase text-[10px] shadow-sm shadow-rose-500/10"
                >
                    <Undo2 class="w-3.5 h-3.5 mr-2" />
                    {$t("finance.darfDetails.unpayAction")}
                </Button>
            {/if}
            <Button
                variant="secondary"
                onclick={() => (open = false)}
                class="bg-muted hover:bg-accent text-foreground border-border font-bold uppercase text-[10px]"
            >
                {$t("common.close")}
            </Button>
        {/if}
    {/snippet}
</DetailModal>

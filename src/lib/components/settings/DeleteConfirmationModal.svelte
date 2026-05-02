<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { t } from "svelte-i18n";
    import { userProfileStore } from "$lib/stores/user-profile.svelte.ts";
    import { safeInvoke } from "$lib/services/tauri";
    import { SystemInput } from "$lib/components/ui/system";
    import { toast } from "svelte-sonner";
    import { cn } from "$lib/utils";

    let {
        open = $bindable(false),
        onConfirm,
        onCancel,
        title,
        description,
        confirmLabel,
        requirePassword = false,
        variant = "danger"
    } = $props<{
        open: boolean;
        onConfirm: () => void | Promise<void>;
        onCancel?: () => void;
        title?: string;
        description?: string;
        confirmLabel?: string;
        requirePassword?: boolean;
        variant?: "danger" | "confirm";
    }>();

    let password = $state("");
    let isVerifying = $state(false);
    let isProcessing = $state(false);
    let hasPassword = $derived(!!userProfileStore.userProfile.password_hash);

    async function handleConfirm() {
        if (requirePassword && hasPassword) {
            if (!password) {
                toast.error($t("common.passwordRequired") || "Password required");
                return;
            }
            isVerifying = true;
            try {
                const isValid = await safeInvoke<boolean>("check_password_only", { password });
                if (!isValid) {
                    toast.error($t("common.invalidPassword") || "Invalid password");
                    return;
                }
            } catch (e) {
                toast.error($t("common.errorVerifyingPassword") || "Error verifying password");
                return;
            } finally {
                isVerifying = false;
            }
        }

        isProcessing = true;
        try {
            await onConfirm();
            open = false;
            password = "";
        } catch (e) {
            console.error("Confirm action failed:", e);
        } finally {
            isProcessing = false;
        }
    }

    function handleCancel() {
        if (onCancel) onCancel();
        open = false;
        password = "";
    }

    $effect(() => {
        if (open) {
            password = "";
            isProcessing = false;
            isVerifying = false;
        }
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-[425px] w-full bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2rem] shadow-2xl overflow-hidden">
        <div class="px-8 py-6 border-b border-border bg-muted/5">
            <Dialog.Header>
                <Dialog.Title class="text-[13px] font-bold uppercase tracking-[0.2em] text-foreground">
                    {title || $t("common.confirmDeleteTitle") || "Are you sure?"}
                </Dialog.Title>
                <Dialog.Description class="text-[11px] text-muted-foreground/70 uppercase tracking-widest pt-1">
                    {description || $t("common.confirmDeleteDescription") || "This action cannot be undone."}
                </Dialog.Description>
            </Dialog.Header>
        </div>

        {#if requirePassword && hasPassword}
            <div class="px-8 py-6 space-y-4">
                <div class="space-y-2">
                    <SystemInput 
                        type="password" 
                        label={$t("common.confirmWithPassword") || "CONFIRM WITH PASSWORD"} 
                        bind:value={password} 
                        placeholder="••••••••"
                        class="h-12 font-bold"
                    />
                    <p class="text-[9px] text-muted-foreground/50 uppercase tracking-widest px-1">
                        {variant === 'danger' 
                            ? ($t("common.passwordProtectionHint") || "Security measure to prevent accidental deletions.")
                            : ($t("common.passwordConfirmHint") || "Security measure to confirm sensitive database actions.")}
                    </p>
                </div>
            </div>
        {/if}
 
        <Dialog.Footer class="px-8 py-6 bg-muted/5 border-t border-border flex flex-row items-center justify-end gap-3">
            <Button variant="ghost" onclick={handleCancel} class="rounded-full px-6 h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {$t("common.cancel")}
            </Button>
            <Button 
                variant={variant === 'danger' ? 'destructive' : 'default'} 
                onclick={handleConfirm} 
                disabled={isVerifying || isProcessing}
                class={cn(
                    "rounded-full text-white px-8 h-10 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95",
                    variant === 'danger' 
                        ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                        : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                )}
            >
                {#if isProcessing}
                    {$t("common.processing") || "PROCESSING..."}
                {:else if isVerifying}
                    {$t("common.verifying") || "VERIFYING..."}
                {:else}
                    {confirmLabel || (variant === 'danger' ? ($t("common.delete") || "DELETE") : ($t("common.confirm") || "CONFIRM"))}
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

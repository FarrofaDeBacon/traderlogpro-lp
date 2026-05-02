<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import { t } from "svelte-i18n";
</script>

<div class="space-y-6">
    <div>
        <h3 class="text-lg font-medium">{$t("emotionalStates.title")}</h3>
        <p class="text-sm text-muted-foreground">
            {$t("emotionalStates.description")}
        </p>
    </div>
    <Separator />
    <p class="text-muted-foreground">{$t("common.underDevelopment")}</p>
</div>

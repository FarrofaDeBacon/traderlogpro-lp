<script lang="ts">
    import { t, locale } from "svelte-i18n";
    import { page } from "$app/stores";
    import SettingsSidebar from "./SettingsSidebar.svelte";
    import { SystemHeader } from "$lib/components/ui/system";
    import { settingsHeaderStore } from "$lib/stores/settings-header.svelte";

    let { children } = $props();

    let section = $derived(
        $page.url.pathname.includes("/fiscal/rules")
            ? "fiscal.rules"
            : $page.url.pathname.includes("/fiscal/profiles")
              ? "fiscal.profiles"
              : $page.url.pathname.includes("/fiscal/assignments")
                ? "fiscal.assignments"
                : $page.url.pathname.includes("/risk/asset-profiles")
                  ? "risk.assetProfiles"
                  : $page.url.pathname.split("/").pop() || "general",
    );

    let navKey = $derived(
        section === "settings"
            ? "general"
            : section === "asset-types"
              ? "assetTypes"
              : section === "emotional-states"
                ? "emotionalStates"
                : section === "chart-types"
                  ? "chartTypes"
            : section === "api-integrations"
              ? "integrations"
              : section,
    );

    // Dynamic title and description from i18n
    let title = $derived.by(() => {
        const _ = $locale;
        return $t(`settings.nav.${navKey}`);
    });
    let description = $derived.by(() => {
        const _ = $locale;
        return $t(`settings.nav.descriptions.${navKey}`);
    });
</script>

<div class="hidden space-y-6 px-8 py-6 pb-16 md:block">
    <SystemHeader 
        {title}
        subtitle={description}
        variant="page"
        actions={settingsHeaderStore.actions}
    />

    <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-10 lg:space-y-0 pt-4">
        <aside class="lg:w-60 overflow-visible shrink-0">
            <SettingsSidebar />
        </aside>
        <main class="flex-1 min-w-0">
            {@render children()}
        </main>
    </div>
</div>

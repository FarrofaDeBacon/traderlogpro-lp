<script lang="ts">
    import QuickLog from "$lib/components/trades/QuickLog.svelte";
    import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
    import { userProfileStore } from "$lib/stores/user-profile.svelte.ts";

    const closeWindow = () => {
        getCurrentWebviewWindow().close();
    };

    // Apply and keep in sync the theme class on the document root
    $effect(() => {
        const theme = userProfileStore.userProfile.theme || 'dark';
        document.documentElement.classList.toggle('dark', theme === 'dark');
    });
</script>

<div class="h-screen w-full bg-background flex items-stretch p-2">
    <div class="w-full">
        <QuickLog detached={true} />
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        overflow: hidden;
        background: transparent;
    }
</style>

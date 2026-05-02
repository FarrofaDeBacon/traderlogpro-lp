<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { save, open } from "@tauri-apps/plugin-dialog";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import {
        RefreshCw,
        Search,
        Database,
        Trash2,
        AlertCircle,
        Download,
        Upload,
        HardDrive,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { t } from "svelte-i18n";
    import DeleteConfirmationModal from "$lib/components/settings/DeleteConfirmationModal.svelte";
    import { userProfileStore } from "$lib/stores/user-profile.svelte";

    let isChecking = $state(false);
    let statusMessage = $state("");

    async function checkDatabase() {
        isChecking = true;
        statusMessage = "";
        try {
            const status = await invoke<any>("check_database_status");
            // Format object as readable lines
            const lines = Object.entries(status)
                .map(([table, count]) => `${table.toUpperCase()}: ${count}`)
                .join("\n");
            statusMessage = lines;
            toast.success($t("settings.database.status.success"));
        } catch (e) {
            const errorMsg = typeof e === "string" ? e : (e as Error).message;
            statusMessage = "ERRO: " + errorMsg;
            toast.error($t("settings.database.status.error") + ": " + errorMsg);
        } finally {
            isChecking = false;
        }
    }

    let isRestoring = $state(false);
    let isRestoreModalOpen = $state(false);

    function triggerRestoreDefaults() {
        isRestoreModalOpen = true;
    }

    async function executeRestoreDefaults() {
        isRestoring = true;
        try {
            await invoke("force_reseed");
            toast.success($t("common.success"));
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            isRestoring = false;
        }
    }

    // --- Backup & Restore ---
    let isBackingUp = $state(false);
    let isRestoringBackup = $state(false);

    async function handleBackup() {
        isBackingUp = true;
        try {
            const now = new Date();
            const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
            const defaultName = `traderlog_backup_${ts}.json`;

            const path = await save({
                title: $t("settings.database.backup.saveTitle"),
                defaultPath: defaultName,
                filters: [{ name: "JSON Backup", extensions: ["json"] }],
            });

            if (!path) {
                isBackingUp = false;
                return; // user cancelled
            }

            await invoke("backup_database", { path });
            toast.success($t("settings.database.backup.successExport"));
        } catch (e) {
            const errorMsg = typeof e === "string" ? e : String(e);
            console.error("Backup failed:", e);
            toast.error(
                $t("settings.database.backup.errorExport") + ": " + errorMsg,
            );
        } finally {
            isBackingUp = false;
        }
    }

    let isRestoreBackupModalOpen = $state(false);
    let pendingRestorePath = $state<string | null>(null);

    function triggerRestore() {
        open({
            title: $t("settings.database.backup.openTitle"),
            filters: [{ name: "JSON Backup", extensions: ["json"] }],
            multiple: false,
            directory: false,
        }).then(path => {
            if (path && !Array.isArray(path)) {
                pendingRestorePath = path;
                isRestoreBackupModalOpen = true;
            }
        });
    }

    async function executeRestore() {
        if (!pendingRestorePath) return;
        isRestoringBackup = true;
        try {
            const count = await invoke<number>("restore_database", { path: pendingRestorePath });
            toast.success(
                $t("settings.database.backup.successImport").replace(
                    "{count}",
                    String(count),
                ),
            );
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            const errorMsg = typeof e === "string" ? e : String(e);
            console.error("Restore failed:", e);
            toast.error(
                $t("settings.database.backup.errorImport") + ": " + errorMsg,
            );
        } finally {
            isRestoringBackup = false;
            pendingRestorePath = null;
        }
    }

    // Simplified Demo Data Management
    const DEMO_ACCOUNTS = [
        "account:demo_forex",
        "account:demo_b3_acoes",
        "account:demo_b3_futuros",
        "account:demo_nasdaq",
        "account:demo_crypto",
    ];

    let isGenerating = $state(false);
    let isCleaning = $state(false);

    let isCleanModalOpen = $state(false);

    function triggerCleanAll() {
        isCleanModalOpen = true;
    }

    async function executeCleanAll() {
        isCleaning = true;
        try {
            await invoke("delete_all_demo_trades");
            toast.success($t("settings.database.demo.successClean"));
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            isCleaning = false;
        }
    }

    async function handleGenerateDemo() {
        isGenerating = true;
        try {
            await invoke("reseed_selective", { 
                items: ["cadastros", "fiscal", "ativos", "analise", "risco", "trades"] 
            });
            toast.success($t("settings.database.demo.successGenerate"));
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            isGenerating = false;
        }
    }

    let isResetReseed = $state(false);
    let isResetModalOpen = $state(false);

    function triggerForceReseed() {
        isResetModalOpen = true;
    }

    async function executeForceReseed() {
        isResetReseed = true;
        try {
            await invoke("force_reseed");
            toast.success($t("common.success"));
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            isResetReseed = false;
        }
    }

    // --- Selective Data Management ---
    let categories = $state<any[]>([]);
    let selectedItems = $state<string[]>([]);
    let expandedCategory = $state<string | null>(null);
    let isSelectiveProcessing = $state(false);

    async function loadCategories() {
        try {
            categories = await invoke("get_seed_categories_cmd");
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    }

    $effect(() => {
        loadCategories();
    });

    function toggleCategory(catId: string) {
        const category = categories.find(c => c.id === catId);
        if (!category) return;

        const itemIds = category.items.map((i: any) => i.id);
        const allSelected = itemIds.every((id: string) => selectedItems.includes(id));

        if (allSelected) {
            selectedItems = selectedItems.filter(id => !itemIds.includes(id));
        } else {
            selectedItems = [...new Set([...selectedItems, ...itemIds])];
        }
    }

    function toggleItem(itemId: string) {
        if (selectedItems.includes(itemId)) {
            selectedItems = selectedItems.filter(id => id !== itemId);
        } else {
            selectedItems = [...selectedItems, itemId];
        }
    }

    let isSelectiveDeleteModalOpen = $state(false);
    let isSelectiveReseedModalOpen = $state(false);

    function triggerSelectiveDelete() {
        if (selectedItems.length === 0) {
            toast.error($t("settings.database.demo.selectAccount"));
            return;
        }
        isSelectiveDeleteModalOpen = true;
    }

    async function executeSelectiveDelete() {
        isSelectiveProcessing = true;
        try {
            await invoke("delete_selective", { items: selectedItems });
            toast.success($t("common.success"));
            selectedItems = [];
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            toast.error(String(e));
        } finally {
            isSelectiveProcessing = false;
        }
    }

    function triggerSelectiveReseed() {
        if (selectedItems.length === 0) {
            toast.error($t("settings.database.demo.selectAccount"));
            return;
        }
        isSelectiveReseedModalOpen = true;
    }

    async function executeSelectiveReseed() {
        isSelectiveProcessing = true;
        try {
            await invoke("reseed_selective", { items: selectedItems });
            toast.success($t("common.success"));
            selectedItems = [];
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            toast.error(String(e));
        } finally {
            isSelectiveProcessing = false;
        }
    }

    async function handleGenerateSmartDemo() {
        try {
            const res = await invoke<string>("generate_smart_demo_trades");
            toast.info(res);
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            toast.error(String(e));
        }
    }
</script>

<DeleteConfirmationModal
    bind:open={isRestoreModalOpen}
    onConfirm={executeRestoreDefaults}
    title={$t("settings.database.defaults.title")}
    description={$t("settings.database.defaults.confirm")}
    requirePassword={true}
/>

<DeleteConfirmationModal
    bind:open={isCleanModalOpen}
    onConfirm={executeCleanAll}
    title={$t("settings.database.demo.confirmDeleteTitle")}
    description={$t("settings.database.demo.confirmDeleteDescription")}
    requirePassword={true}
/>

<DeleteConfirmationModal
    bind:open={isResetModalOpen}
    onConfirm={executeForceReseed}
    title={$t("settings.database.danger.title")}
    description={$t("settings.database.danger.confirm")}
    requirePassword={true}
/>

<DeleteConfirmationModal
    bind:open={isSelectiveDeleteModalOpen}
    onConfirm={executeSelectiveDelete}
    title={$t("settings.database.selective.title")}
    description={$t("settings.database.selective.description")}
    requirePassword={true}
/>

<DeleteConfirmationModal
    bind:open={isSelectiveReseedModalOpen}
    onConfirm={executeSelectiveReseed}
    title={$t("settings.database.selective.title")}
    description={$t("settings.database.selective.reseedDescription")}
    confirmLabel={$t("settings.database.selective.reseedButton")}
    requirePassword={true}
    variant="confirm"
/>

<DeleteConfirmationModal
    bind:open={isRestoreBackupModalOpen}
    onConfirm={executeRestore}
    title={$t("settings.database.backup.title")}
    description={$t("settings.database.backup.description")}
    requirePassword={true}
/>

<div
    class="container max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500"
>
    <div>
        <h1 class="text-3xl font-black tracking-tight flex items-center gap-3">
            <Database class="w-8 h-8 text-primary" />
            {$t("settings.database.title")}
        </h1>
        <p class="text-muted-foreground mt-2 font-medium">
            {$t("settings.database.description")}
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Status Card -->
        <Card.Root class="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <Card.Header>
                <div class="flex items-center gap-2">
                    <Search class="w-5 h-5 text-blue-500" />
                    <Card.Title
                        >{$t("settings.database.status.title")}</Card.Title
                    >
                </div>
                <Card.Description>
                    {$t("settings.database.status.description")}
                </Card.Description>
            </Card.Header>
            <Card.Content class="space-y-4">
                <Button
                    onclick={checkDatabase}
                    disabled={isChecking}
                    variant="outline"
                    class="w-full rounded-xl"
                >
                    {#if isChecking}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.status.checking")}
                    {:else}
                        <Search class="w-4 h-4 mr-2" />
                        {$t("settings.database.status.button")}
                    {/if}
                </Button>

                {#if statusMessage}
                    <div
                        class="rounded-xl border border-border bg-muted/30 p-4 overflow-auto max-h-40"
                    >
                        <pre
                            class="text-[10px] font-mono whitespace-pre-wrap">{statusMessage}</pre>
                    </div>
                {/if}
            </Card.Content>
        </Card.Root>

        <!-- Defaults Card -->
        <Card.Root class="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <Card.Header>
                <div class="flex items-center gap-2">
                    <RefreshCw class="w-5 h-5 text-emerald-500" />
                    <Card.Title
                        >{$t("settings.database.defaults.title")}</Card.Title
                    >
                </div>
                <Card.Description>
                    {$t("settings.database.defaults.description")}
                </Card.Description>
            </Card.Header>
            <Card.Content class="space-y-4">
                <div
                    class="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
                >
                    {$t("settings.database.defaults.warning")}
                </div>
                <Button
                    onclick={triggerRestoreDefaults}
                    disabled={isRestoring}
                    class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                    {#if isRestoring}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.defaults.restoring")}
                    {:else}
                        <RefreshCw class="w-4 h-4 mr-2" />
                        {$t("settings.database.defaults.button")}
                    {/if}
                </Button>
            </Card.Content>
        </Card.Root>
    </div>

    {#if userProfileStore.activeProfile === "demo"}
    <!-- Gerenciador Seletivo -->
    <Card.Root class="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <Card.Header>
            <div class="flex items-center gap-2">
                <HardDrive class="w-5 h-5 text-amber-500" />
                <Card.Title>{$t("settings.database.selective.title")}</Card.Title>
            </div>
            <Card.Description>
                {$t("settings.database.selective.description")}
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="space-y-2">
                {#each categories as cat}
                    <div class="border border-border rounded-xl overflow-hidden transition-all {expandedCategory === cat.id ? 'ring-1 ring-amber-500/20 shadow-lg' : ''}">
                        <!-- Category Header -->
                        <div class="flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/40 transition-colors">
                            <button 
                                onclick={() => toggleCategory(cat.id)}
                                class="flex items-center justify-center w-6 h-6 rounded-full border 
                                {cat.items.every(i => selectedItems.includes(i.id)) ? 'bg-amber-500 border-amber-500 text-white' : 'border-muted-foreground/30 bg-background'}"
                            >
                                {#if cat.items.every(i => selectedItems.includes(i.id))}
                                    <div class="w-2 h-2 bg-white rounded-full"></div>
                                {:else if cat.items.some(i => selectedItems.includes(i.id))}
                                    <div class="w-2 h-0.5 bg-amber-500 rounded-full"></div>
                                {/if}
                            </button>
                            
                            <button 
                                onclick={() => expandedCategory = expandedCategory === cat.id ? null : cat.id}
                                class="flex-1 flex items-center justify-between text-left"
                            >
                                <span class="text-xs font-black uppercase tracking-wider">{cat.name}</span>
                                <span class="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-xl">
                                    {$t("settings.database.selective.selectedCount", { 
                                        values: {
                                            selected: cat.items.filter(i => selectedItems.includes(i.id)).length,
                                            total: cat.items.length
                                        }
                                    })}
                                </span>
                            </button>
                        </div>

                        <!-- Sub-items (Expanded) -->
                        {#if expandedCategory === cat.id}
                            <div class="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background/50 animate-in slide-in-from-top-2 duration-200">
                                {#each cat.items as item}
                                    <button
                                        onclick={() => toggleItem(item.id)}
                                        class="flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all
                                        {selectedItems.includes(item.id) 
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                                            : 'bg-muted/10 border-transparent hover:border-border text-muted-foreground'}"
                                    >
                                        <div class="w-4 h-4 rounded-full border flex items-center justify-center
                                            {selectedItems.includes(item.id) ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/30'}">
                                            {#if selectedItems.includes(item.id)}
                                                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            {/if}
                                        </div>
                                        <span class="text-[11px] font-medium">{item.name}</span>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <div class="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
                <Button
                    onclick={triggerSelectiveDelete}
                    disabled={isSelectiveProcessing || selectedItems.length === 0}
                    variant="outline"
                    class="flex-1 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                >
                    {#if isSelectiveProcessing}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.selective.processing")}
                    {:else}
                        <Trash2 class="w-4 h-4 mr-2" />
                        {$t("settings.database.selective.deleteAll", { values: { count: selectedItems.length } })}
                    {/if}
                </Button>

                <Button
                    onclick={triggerSelectiveReseed}
                    disabled={isSelectiveProcessing || selectedItems.length === 0}
                    class="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                >
                    {#if isSelectiveProcessing}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.selective.processing")}
                    {:else}
                        <Download class="w-4 h-4 mr-2" />
                        {$t("settings.database.selective.reseedAll", { values: { count: selectedItems.length } })}
                    {/if}
                </Button>
            </div>
        </Card.Content>
    </Card.Root>
    {/if}

    <!-- Demo Section (Simplified) -->
    <Card.Root class="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <Card.Header>
            <div class="flex items-center gap-2">
                <Database class="w-5 h-5 text-indigo-500" />
                <Card.Title>{$t("settings.database.demo.title")}</Card.Title>
            </div>
            <Card.Description>
                Gere dados de exemplo para testar as funcionalidades do sistema.
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-4">
                <Button
                    onclick={handleGenerateDemo}
                    disabled={isGenerating}
                    class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                    {#if isGenerating}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.demo.generating")}
                    {:else}
                        <Database class="w-4 h-4 mr-2" />
                        {$t("settings.database.demo.populateAll")}
                    {/if}
                </Button>

                <Button
                    onclick={triggerCleanAll}
                    disabled={isCleaning}
                    variant="outline"
                    class="flex-1 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 rounded-xl"
                >
                    {#if isCleaning}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.demo.cleaning")}
                    {:else}
                        <Trash2 class="w-4 h-4 mr-2" />
                        {$t("settings.database.demo.removeTrades")}
                    {/if}
                </Button>
            </div>

            <Button
                onclick={handleGenerateSmartDemo}
                variant="outline"
                class="w-full border-indigo-500/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-bold tracking-wide rounded-xl shadow-sm"
            >
                <RefreshCw class="w-4 h-4 mr-2" />
                {$t("settings.database.demo.smartGenerate")}
            </Button>
        </Card.Content>
    </Card.Root>

    <!-- Backup & Restore -->
    <Card.Root class="bg-emerald-500/5 backdrop-blur-xl border-emerald-500/10 shadow-2xl">
        <Card.Header>
            <div class="flex items-center gap-2">
                <HardDrive class="w-5 h-5 text-emerald-500" />
                <Card.Title>{$t("settings.database.backup.title")}</Card.Title>
            </div>
            <Card.Description>
                {$t("settings.database.backup.description")}
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <div class="flex flex-col sm:flex-row gap-4">
                <!-- Export -->
                <Button
                    onclick={handleBackup}
                    disabled={isBackingUp}
                    class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                    {#if isBackingUp}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.backup.exporting")}
                    {:else}
                        <Download class="w-4 h-4 mr-2" />
                        {$t("settings.database.backup.export")}
                    {/if}
                </Button>

                <!-- Import/Restore -->
                <Button
                    onclick={triggerRestore}
                    disabled={isRestoringBackup}
                    variant="outline"
                    class="flex-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 rounded-xl"
                >
                    {#if isRestoringBackup}
                        <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                        {$t("settings.database.backup.importing")}
                    {:else}
                        <Upload class="w-4 h-4 mr-2" />
                        {$t("settings.database.backup.import")}
                    {/if}
                </Button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-3">
                {$t("settings.database.backup.hint")}
            </p>
        </Card.Content>
    </Card.Root>

    <!-- Danger Zone -->
    <Card.Root class="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
        <Card.Header>
            <div class="flex items-center gap-2">
                <AlertCircle class="w-5 h-5 text-destructive" />
                <Card.Title class="text-destructive"
                    >{$t("settings.database.danger.title")}</Card.Title
                >
            </div>
            <Card.Description>
                {$t("settings.database.danger.description")}
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <p
                class="text-xs text-destructive font-black uppercase tracking-widest"
            >
                {$t("settings.database.danger.warning")}
            </p>
            <Button
                onclick={triggerForceReseed}
                disabled={isResetReseed}
                variant="destructive"
                class="w-full font-bold rounded-xl"
            >
                {#if isResetReseed}
                    <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                    {$t("settings.database.danger.resetting")}
                {:else}
                    <Trash2 class="w-4 h-4 mr-2" />
                    {$t("settings.database.danger.button")}
                {/if}
            </Button>
        </Card.Content>
    </Card.Root>
</div>

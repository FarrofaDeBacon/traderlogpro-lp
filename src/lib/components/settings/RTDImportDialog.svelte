<script lang="ts">
    import { assetTypesStore } from "$lib/stores/asset-types.svelte";
    import { assetsStore } from "$lib/stores/assets.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select";
    import * as Table from "$lib/components/ui/table";
    import { rtdStore } from "$lib/stores/rtd.svelte";
    import { appStore } from "$lib/stores/app.svelte";
    import { t } from "svelte-i18n";
    import { RefreshCcw, FileSpreadsheet, Check, Activity } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { untrack } from "svelte";
    import { cn } from "$lib/utils";
    import { keyboardForm, keyboardList } from "$lib/actions/keyboard-nav";

    let { open = $bindable(false) } = $props();

    interface ImportItem {
        symbol: string;
        name: string;
        typeId: string;
        selected: boolean;
        exists: boolean;
    }

    let items = $state<ImportItem[]>([]);

    $effect(() => {
        if (open) {
            // Acessamos apenas os símbolos e o cadastro de ativos.
            // Isso evita que o efeito rode a cada mudança de PREÇO (que ocorre várias vezes por segundo).
            const symbols = rtdStore.symbols;
            const currentAssets = assetsStore.assets;
            
            untrack(() => {
                const currentSymbols = currentAssets.map((a) => a.symbol);
                
                // Atualiza a lista preservando o estado de seleção atual e evitando loops
                const newItems = symbols.map((sym) => {
                    const exists = currentSymbols.includes(sym);
                    const existingItem = items.find((i) => i.symbol === sym);

                    return {
                        symbol: sym,
                        name: existingItem?.name || sym,
                        typeId: existingItem?.typeId || detectType(sym),
                        selected: existingItem?.selected ?? !exists,
                        exists,
                    };
                });

                // Só atualizamos se o tamanho da lista mudou ou se é a primeira carga
                if (newItems.length !== items.length || items.length === 0) {
                    items = newItems;
                }
            });
        } else {
            if (items.length > 0) items = [];
        }
    });

    function detectType(symbol: string): string {
        const sym = symbol.toUpperCase();
        const typeMatches = (pattern: string) =>
            assetTypesStore.assetTypes.find((t) =>
                t.name.toLowerCase().includes(pattern.toLowerCase()),
            );

        if (/^(WIN|WDO|WSP|DI1|BGI|CCM|IND|DOL|BIT)/i.test(sym) || sym.endsWith('FUT')) {
            return typeMatches("Futuro")?.id || assetTypesStore.assetTypes[0]?.id || "";
        }

        if (/^[A-Z]{4}\d/i.test(sym)) {
            return typeMatches("Aç")?.id || typeMatches("Stock")?.id || assetTypesStore.assetTypes[1]?.id || "";
        }

        return assetTypesStore.assetTypes[0]?.id ?? "";
    }

    let bulkTypeId = $state("");
    let showBulkBar = $derived(items.filter(i => i.selected && !i.exists).length >= 2);

    function applyBulkType(typeId: string) {
        items = items.map(i => {
            if (i.selected && !i.exists) {
                return { ...i, typeId };
            }
            return i;
        });
        toast.success($t("common.saveSuccess"));
    }

    let allSelected = $derived(
        items.filter((i) => !i.exists).length > 0 &&
            items.filter((i) => !i.exists).every((i) => i.selected),
    );
    let selectedCount = $derived(
        items.filter((i) => i.selected && !i.exists).length,
    );

    function getTypeName(id: string) {
        return assetTypesStore.assetTypes.find(t => t.id === id)?.name || "---";
    }

    let bulkTypeLabel = $derived(getTypeName(bulkTypeId) || "Classe...");

    function toggleAll() {
        const target = !allSelected;
        items = items.map((i) => (i.exists ? i : { ...i, selected: target }));
    }

    async function handleImport() {
        const toImport = items.filter((i) => i.selected && !i.exists);
        if (toImport.length === 0) return;

        for (const item of toImport) {
            let pointValue = 1.0;
            if (item.symbol.startsWith("WDO")) pointValue = 10.0;
            else if (item.symbol.startsWith("WIN")) pointValue = 0.2;
            else if (item.symbol.startsWith("DOL")) pointValue = 50.0;
            else if (item.symbol.startsWith("IND")) pointValue = 1.0;

            let sectorId = "sector:stocks";
            if (item.symbol.startsWith("WDO") || item.symbol.startsWith("WIN") || item.symbol.startsWith("DOL") || item.symbol.startsWith("IND") || item.symbol.startsWith("BIT")) {
                sectorId = "sector:futures";
            }

            await assetsStore.addAsset({
                symbol: item.symbol.toUpperCase(),
                name: item.name === item.symbol ? `${item.symbol} (RTD)` : item.name,
                asset_type_id: item.typeId,
                sector_id: sectorId,
                point_value: pointValue,
                default_fee_id: "",
                is_root: false,
            }, false);
        }

        await assetsStore.saveAssets();
        await appStore.loadData(true);
        toast.success($t("settings.assets.importDialog.success", { count: toImport.length }));
        open = false;
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[850px] h-[80vh] flex flex-col overflow-hidden bg-white dark:bg-[#0a0c10] border-border p-0 rounded-[2rem] shadow-2xl">
        <!-- HEADER PADRÃO DO APP -->
        <div class="px-8 py-6 border-b border-border bg-muted/5">
            <div class="flex items-center justify-between">
                <Dialog.Header class="space-y-1">
                    <Dialog.Title class="text-[13px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-foreground">
                        <Activity class="w-5 h-5 text-primary" />
                        SINCRONIZAÇÃO TERMINAL RTD
                    </Dialog.Title>
                    <Dialog.Description class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Importação direta de ativos via DDE/RTD de baixa latência
                    </Dialog.Description>
                </Dialog.Header>
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                     <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span class="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Live Feed</span>
                </div>
            </div>
        </div>

        <!-- CONTEÚDO COM TABLE PADRÃO -->
        <div class="flex-1 overflow-y-auto px-8 py-6 relative">
            {#if items.length === 0}
                <div class="flex flex-col items-center justify-center py-16 text-center">
                    <div class="relative mb-6">
                        <RefreshCcw class="w-12 h-12 text-primary/20 animate-spin" />
                        <div class="absolute inset-0 flex items-center justify-center">
                            <Activity class="w-5 h-5 text-primary animate-pulse" />
                        </div>
                    </div>
                    
                    <h3 class="text-sm font-bold uppercase tracking-widest text-slate-200 mb-2">
                        Aguardando sinal do Profit/Excel
                    </h3>
                    <p class="text-xs text-slate-400 max-w-xs mx-auto mb-8">
                        Certifique-se de que o Profit Chart está aberto e exportando dados para o Excel via RTD.
                    </p>

                    <div class="grid grid-cols-1 gap-3 text-left max-w-sm mx-auto p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h4 class="text-[10px] font-bold uppercase tracking-tighter text-emerald-400 flex items-center gap-2">
                            <div class="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></div>
                            Checklist de Conexão:
                        </h4>
                        
                        <div class="space-y-2">
                            <div class="flex items-start gap-2">
                                <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400 border border-white/5">1</div>
                                <p class="text-[10px] text-slate-300 leading-tight">O Excel deve estar aberto com as abas <span class="text-emerald-400 font-mono">DADOS</span> e <span class="text-emerald-400 font-mono">BOOK</span>.</p>
                            </div>
                            <div class="flex items-start gap-2">
                                <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400 border border-white/5">2</div>
                                <p class="text-[10px] text-slate-300 leading-tight">Verifique se os dados estão "oscilando" dentro do Excel.</p>
                            </div>
                            <div class="flex items-start gap-2">
                                <div class="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400 border border-white/5">3</div>
                                <p class="text-[10px] text-slate-300 leading-tight">Ambos (Terminal e Excel) devem estar com o mesmo nível de permissão (não rode um como Admin e outro não).</p>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div use:keyboardForm use:keyboardList>
                    <Table.Root>
                        <Table.Header>
                            <Table.Row class="hover:bg-transparent border-border/50">
                                <Table.Head class="w-12 text-center">
                                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                                </Table.Head>
                                <Table.Head class="w-32 text-[10px] font-bold uppercase tracking-widest">Ticker</Table.Head>
                                <Table.Head class="text-[10px] font-bold uppercase tracking-widest">Identificação</Table.Head>
                                <Table.Head class="w-48 text-[10px] font-bold uppercase tracking-widest">Classe</Table.Head>
                                <Table.Head class="w-24 text-right text-[10px] font-bold uppercase tracking-widest">Status</Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each items as item}
                                <Table.Row class={cn("border-border/40", item.exists && "opacity-40 grayscale bg-muted/5")}>
                                    <Table.Cell class="text-center">
                                        <Checkbox bind:checked={item.selected} disabled={item.exists} />
                                    </Table.Cell>
                                    <Table.Cell class="font-bold text-sm tracking-tight text-foreground uppercase">
                                        {item.symbol}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Input 
                                            bind:value={item.name} 
                                            placeholder={item.symbol}
                                            disabled={item.exists}
                                            class="h-8 text-xs bg-transparent border-none focus-visible:ring-0 px-0 font-medium"
                                        />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Select.Root type="single" bind:value={item.typeId} disabled={item.exists}>
                                            <Select.Trigger class="h-8 text-[10px] font-bold uppercase tracking-widest border-border bg-background">
                                                {getTypeName(item.typeId)}
                                            </Select.Trigger>
                                            <Select.Content>
                                                {#each assetTypesStore.assetTypes as type}
                                                    <Select.Item value={type.id} class="text-[10px] font-bold uppercase tracking-widest">
                                                        {type.name}
                                                    </Select.Item>
                                                {/each}
                                            </Select.Content>
                                        </Select.Root>
                                    </Table.Cell>
                                    <Table.Cell class="text-right">
                                        {#if item.exists}
                                            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                <Check class="w-3 h-3" />
                                                <span class="text-[8px] font-black uppercase">Ativo</span>
                                            </div>
                                        {:else}
                                             <span class="text-[9px] font-bold text-muted-foreground/30 uppercase">Pendente</span>
                                        {/if}
                                    </Table.Cell>
                                </Table.Row>
                            {/each}
                        </Table.Body>
                    </Table.Root>
                </div>
            {/if}
        </div>

        <!-- BARRA DE AÇÕES EM MASSA (FIXA ACIMA DO FOOTER) -->
        {#if showBulkBar}
            <div class="px-8 py-4 bg-primary/5 border-t border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div class="flex items-center gap-4">
                    <div class="bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                        <span class="text-[10px] font-black uppercase tracking-widest text-primary">
                            {selectedCount} selecionados
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-foreground uppercase tracking-widest">Ações em Massa</span>
                        <span class="text-[9px] font-medium text-muted-foreground uppercase tracking-tight">Alterar classe de todos os selecionados</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-3">
                    <div class="w-56">
                         <Select.Root type="single" bind:value={bulkTypeId} onValueChange={applyBulkType}>
                            <Select.Trigger class="h-10 text-[10px] font-bold uppercase tracking-widest border-border bg-background shadow-sm">
                                {bulkTypeLabel}
                            </Select.Trigger>
                            <Select.Content portal={null}>
                                {#each assetTypesStore.assetTypes as type}
                                    <Select.Item value={type.id} class="text-[10px] font-bold uppercase tracking-widest">
                                        {type.name}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>
            </div>
        {/if}

        <!-- FOOTER PADRÃO -->
        <div class="p-8 bg-muted/5 border-t border-border flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-border">
                    <Activity class="w-5 h-5 text-primary/30" />
                </div>
                <div class="flex flex-col">
                    <span class="text-[11px] font-bold text-foreground uppercase tracking-widest">
                         {selectedCount} Ativos Sincronizáveis
                    </span>
                    <span class="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        Clique em sincronizar para confirmar
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <Button variant="ghost" onclick={() => (open = false)} class="h-11 px-8 rounded-full font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground text-[10px]">
                    {$t("common.cancel")}
                </Button>
                <Button
                    disabled={selectedCount === 0}
                    onclick={handleImport}
                    class="h-11 px-10 rounded-full bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <FileSpreadsheet class="w-4 h-4 mr-2" />
                    SINCRONIZAR TERMINAL
                </Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

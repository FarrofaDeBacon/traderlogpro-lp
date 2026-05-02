<script lang="ts">
    import { cn } from "$lib/utils";
    import { SystemInput, SystemSelect } from "$lib/components/ui/system";
    import { modalitiesStore } from "$lib/stores/modalities.svelte";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import type { TaxRule } from "$lib/types";
    import { Scale, Info, ShieldCheck, Percent, Receipt, Target } from "lucide-svelte";

    let { initialData } = $props<{ initialData?: TaxRule }>();

    let formData = $state<Omit<TaxRule, "id">>({
        name: initialData?.name || "",
        tax_rate: initialData?.tax_rate || 15,
        withholding_rate: initialData?.withholding_rate || 0.005,
        exemption_threshold: initialData?.exemption_threshold || 0,
        basis: initialData?.basis || "NetProfit",
        cumulative_losses: initialData?.cumulative_losses ?? true,
        trade_type: initialData?.trade_type || (modalitiesStore.modalities[0]?.id || ""),
        withholding_basis: initialData?.withholding_basis || "SalesVolume",
        revenue_code: initialData?.revenue_code || "",
    });

    export function getFormData() {
        return $state.snapshot(formData);
    }
</script>

<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Identificação -->
    <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border/50 pb-3">
            <Receipt class="w-4 h-4 text-primary" />
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 italic">Identificação da Regra</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SystemInput 
                label="Nome da Regra" 
                bind:value={formData.name} 
                placeholder="Ex: Swing Trade - Ações B3" 
                class="font-bold tracking-widest"
            />
            <SystemSelect 
                label="Modalidade Operacional" 
                bind:value={formData.trade_type} 
                options={modalitiesStore.modalities.map(m => ({ value: m.id, label: m.name }))} 
            />
        </div>
    </div>

    <!-- Alíquotas e Impostos -->
    <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border/50 pb-3">
            <Percent class="w-4 h-4 text-emerald-500" />
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 italic">Alíquotas e Base de Cálculo</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="relative group">
                <SystemInput 
                    label="Alíquota IR (%)" 
                    type="number" 
                    step="0.1"
                    bind:value={formData.tax_rate} 
                    placeholder="15.0" 
                    class="font-black text-emerald-500"
                />
            </div>
            <SystemInput 
                label="Dedo-duro (%)" 
                type="number" 
                step="0.0001"
                bind:value={formData.withholding_rate} 
                placeholder="0.005" 
            />
            <SystemInput 
                label="Isenção Mensal (R$)" 
                type="number" 
                bind:value={formData.exemption_threshold} 
                placeholder="20000" 
            />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SystemSelect 
                label="Base Principal" 
                bind:value={formData.basis} 
                options={[
                    { value: "NetProfit", label: "Lucro Líquido" },
                    { value: "GrossProfit", label: "Lucro Bruto" }
                ]} 
            />
            <SystemSelect 
                label="Base Retenção (Dedo-duro)" 
                bind:value={formData.withholding_basis} 
                options={[
                    { value: "SalesVolume", label: "Volume de Vendas" },
                    { value: "Profit", label: "Lucro na Operação" }
                ]} 
            />
        </div>
    </div>

    <!-- Configurações Adicionais -->
    <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border/50 pb-3">
            <ShieldCheck class="w-4 h-4 text-amber-500" />
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 italic">Conformidade e DARF</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SystemInput 
                label="Código da Receita (DARF)" 
                bind:value={formData.revenue_code} 
                placeholder="6015" 
                maxlength={4}
                class="font-mono tracking-[0.3em]"
            />
            
            <div class="flex items-center justify-between p-5 bg-muted/5 border border-border/50 rounded-3xl group hover:border-primary/20 transition-all">
                <div class="space-y-1">
                    <Label class="text-[10px] uppercase font-black tracking-widest text-foreground block">Compensar Prejuízos</Label>
                    <p class="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-60">Permite abater perdas anteriores</p>
                </div>
                <Switch bind:checked={formData.cumulative_losses} />
            </div>
        </div>
    </div>

    <!-- Info Banner -->
    <div class="p-5 bg-primary/5 border border-primary/10 rounded-3xl flex gap-4">
        <div class="p-2 bg-primary/10 rounded-xl h-fit">
            <Info class="w-4 h-4 text-primary" />
        </div>
        <div class="space-y-1">
            <p class="text-[10px] font-black text-primary uppercase tracking-widest">Nota de Auditoria</p>
            <p class="text-[10px] text-muted-foreground/80 leading-relaxed font-bold italic">
                Esta regra será aplicada automaticamente a todos os ativos vinculados aos perfis fiscais que a utilizarem. Certifique-se de que o código da receita corresponde à modalidade selecionada.
            </p>
        </div>
    </div>
</div>

<style>
    /* Estilos locais se necessário */
</style>

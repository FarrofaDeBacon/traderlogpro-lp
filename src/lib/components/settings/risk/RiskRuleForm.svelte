<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Button } from "$lib/components/ui/button";
    import * as Select from "$lib/components/ui/select";
    import { Switch } from "$lib/components/ui/switch";
    import { t } from "svelte-i18n";
    import type { RiskRule, RiskRuleScope, RiskRuleTargetType, RiskRuleOperator, AssetRiskProfile } from "$lib/types";
    import { Badge } from "$lib/components/ui/badge";
    import { X } from "lucide-svelte";

    let {
        rule = undefined,
        assetRiskProfiles = [],
        onSave,
        onCancel,
    } = $props<{
        rule?: RiskRule;
        assetRiskProfiles: AssetRiskProfile[];
        onSave: (rule: RiskRule) => void;
        onCancel: () => void;
    }>();

    const isEditing = $derived(!!rule);

    let formData = $state<RiskRule>({
        id: rule?.id ?? crypto.randomUUID(),
        name: rule?.name ?? "",
        enabled: rule?.enabled ?? true,
        scope: rule?.scope ?? "global",
        target_type: rule?.target_type ?? "max_daily_loss",
        operator: rule?.operator ?? "<=",
        value: rule?.value ?? 0,
        value_secondary: rule?.value_secondary,
        asset_risk_profile_ids: rule?.asset_risk_profile_ids ? [...rule.asset_risk_profile_ids] : [],
    });

    // Synchronize form data when the rule prop changes (e.g. clicking edit on a different rule)
    $effect(() => {
        if (rule) {
            formData = {
                id: rule.id,
                name: rule.name,
                enabled: rule.enabled,
                scope: rule.scope,
                target_type: rule.target_type,
                operator: rule.operator,
                value: rule.value,
                value_secondary: rule.value_secondary,
                asset_risk_profile_ids: rule.asset_risk_profile_ids ? [...rule.asset_risk_profile_ids] : [],
            };
            nameManuallyEdited = true;
        }
    });

    const prefix = "risk.rules";

    const allTargetTypes: RiskRuleTargetType[] = [
        "sum_contracts",
        "max_daily_loss",
        "profit_target",
        "day_trade_only",
        "close_before_close",
        "consistency",
        "rule_50_percent",
        "max_trades_per_day",
    ];

    const booleanTargetTypes: RiskRuleTargetType[] = ["day_trade_only", "close_before_close"];
    const globalOnlyTargetTypes: RiskRuleTargetType[] = ["consistency", "rule_50_percent"];

    const allOperators: { value: RiskRuleOperator; key: string }[] = [
        { value: "<=", key: "lte" },
        { value: ">=", key: "gte" },
        { value: "=", key: "eq" },
        { value: "<", key: "lt" },
        { value: ">", key: "gt" },
        { value: "between", key: "between" },
    ];

    const allScopes: { value: RiskRuleScope; key: string }[] = [
        { value: "global", key: "global" },
        { value: "asset", key: "asset" },
        { value: "combined", key: "combined" },
    ];

    // Filter scopes based on selected target type
    const availableScopes = $derived.by(() => {
        if (globalOnlyTargetTypes.includes(formData.target_type)) {
            return allScopes.filter(s => s.value === "global");
        }
        return allScopes;
    });

    // Whether value field is a boolean toggle
    const isBooleanRule = $derived(booleanTargetTypes.includes(formData.target_type));

    // Whether to show the asset profiles selector
    const showAssetSelector = $derived(formData.scope === "asset" || formData.scope === "combined");

    // Whether to show the secondary value field
    const showSecondaryValue = $derived(formData.operator === "between");

    // Available profiles not yet selected
    const availableProfiles = $derived(
        assetRiskProfiles.filter((p: AssetRiskProfile) => !formData.asset_risk_profile_ids?.includes(p.id!))
    );

    // Enforce global scope when target type requires it
    $effect(() => {
        if (globalOnlyTargetTypes.includes(formData.target_type) && formData.scope !== "global") {
            formData.scope = "global";
        }
    });

    // Reset value when switching to boolean type
    $effect(() => {
        if (isBooleanRule) {
            formData.value = typeof formData.value === "boolean" ? formData.value : true;
            formData.operator = "=";
        } else {
            if (typeof formData.value === "boolean") {
                formData.value = 0;
            }
        }
    });

    function addAssetProfile(id: string) {
        if (!formData.asset_risk_profile_ids) formData.asset_risk_profile_ids = [];
        if (!formData.asset_risk_profile_ids.includes(id)) {
            formData.asset_risk_profile_ids = [...formData.asset_risk_profile_ids, id];
        }
    }

    function removeAssetProfile(id: string) {
        formData.asset_risk_profile_ids = formData.asset_risk_profile_ids?.filter(i => i !== id) ?? [];
    }

    function handleSave() {
        if (!formData.name.trim()) return;
        onSave({ ...formData });
    }

    // Auto-name generation logic
    let nameManuallyEdited = $state(isEditing);

    function getOperatorSymbol(op: string): string {
        switch (op) {
            case "<=": return "≤";
            case ">=": return "≥";
            case "=": return "=";
            case "<": return "<";
            case ">": return ">";
            case "between": return "↔";
            default: return op;
        }
    }

    $effect(() => {
        if (!nameManuallyEdited && !isEditing) {
            const typeLabel = $t(`${prefix}.targetType.${formData.target_type}`);
            if (isBooleanRule) {
                formData.name = `${typeLabel} (${formData.value ? $t("risk.plan.active") : $t("common.no")})`;
            } else {
                const opLabel = getOperatorSymbol(formData.operator);
                const andLabel = " & ";
                const val2 = showSecondaryValue && formData.value_secondary !== undefined ? ` ${andLabel} ${formData.value_secondary}` : '';
                formData.name = `${typeLabel} ${opLabel} ${formData.value}${val2}`;
            }
        }
    });
</script>

<div class="space-y-6 p-10 rounded-[3rem] border border-emerald-500/20 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
    <div class="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700"></div>
    
    <div class="flex items-center gap-6">
        <div class="w-14 h-14 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Zap class="w-7 h-7 text-emerald-500" />
        </div>
        <h4 class="text-base font-black uppercase tracking-tight text-foreground">
            {isEditing ? $t(`${prefix}.editRule`) : $t(`${prefix}.addRule`)}
        </h4>
    </div>

    <!-- Rule Name -->
    <div class="space-y-3">
        <Label class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">
            {$t(`${prefix}.ruleName`)}
        </Label>
        <Input 
            value={formData.name} 
            oninput={(e) => { formData.name = e.currentTarget.value; nameManuallyEdited = true; }} 
            placeholder={$t('risk.rules.ruleNamePlaceholder')} 
            class="h-12 bg-white/5 border-white/5 rounded-full px-8 text-sm font-black uppercase tracking-tight focus-visible:border-emerald-500/40"
        />
    </div>

    <!-- Scope + Target Type -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-3">
            <Label class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">
                {$t(`${prefix}.scope.label`)}
            </Label>
            <Select.Root
                type="single"
                value={formData.scope}
                onValueChange={(v: string) => { if (v) formData.scope = v as RiskRuleScope; }}
                portal={null}
            >
                <Select.Trigger class="h-12 bg-white/5 border-white/5 rounded-full px-8 font-black text-[11px] uppercase tracking-widest focus:border-emerald-500/40">
                    {$t(`${prefix}.scope.${formData.scope}`)}
                </Select.Trigger>
                <Select.Content>
                    {#each availableScopes as s}
                        <Select.Item value={s.value} class="text-[10px] font-black uppercase tracking-widest">{$t(`${prefix}.scope.${s.key}`)}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
        </div>

        <div class="space-y-3">
            <Label class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-6 block">
                {$t(`${prefix}.targetType.label`)}
            </Label>
            <Select.Root
                type="single"
                value={formData.target_type}
                onValueChange={(v: string) => { if (v) formData.target_type = v as RiskRuleTargetType; }}
                portal={null}
            >
                <Select.Trigger class="h-12 bg-white/5 border-white/5 rounded-full px-8 font-black text-[11px] uppercase tracking-widest focus:border-emerald-500/40">
                    {$t(`${prefix}.targetType.${formData.target_type}`)}
                </Select.Trigger>
                <Select.Content>
                    {#each allTargetTypes as tt}
                        <Select.Item value={tt} class="text-[10px] font-black uppercase tracking-widest">{$t(`${prefix}.targetType.${tt}`)}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
            <p class="text-[9px] text-muted-foreground/40 pt-1 px-6 font-black uppercase tracking-widest">
                {$t(`risk.tooltips.${formData.target_type}`)}
            </p>
        </div>
    </div>

    <!-- Asset Profile Selector (when scope is asset or combined) -->
    {#if showAssetSelector}
        <div class="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {$t('risk.plan.scope.assets')}
            </Label>

            <!-- Selected profiles as badges -->
            {#if formData.asset_risk_profile_ids && formData.asset_risk_profile_ids.length > 0}
                <div class="flex flex-wrap gap-1.5">
                    {#each formData.asset_risk_profile_ids as profileId}
                        {@const profile = assetRiskProfiles.find((p: AssetRiskProfile) => p.id === profileId)}
                        {#if profile}
                            <Badge variant="secondary" class="gap-1 pr-1">
                                {profile.name}
                                <button
                                    class="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                    onclick={() => removeAssetProfile(profileId)}
                                >
                                    <X class="w-3 h-3" />
                                </button>
                            </Badge>
                        {/if}
                    {/each}
                </div>
            {/if}

            <!-- Selector to add -->
            {#if availableProfiles.length > 0}
                <Select.Root
                    type="single"
                    onValueChange={(v: string) => { if (v) addAssetProfile(v); }}
                >
                    <Select.Trigger class="w-full">
                        {$t("risk.cockpit.selectAsset")}
                    </Select.Trigger>
                    <Select.Content>
                        {#each availableProfiles as profile}
                            <Select.Item value={profile.id!}>{profile.name}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            {/if}
        </div>
    {/if}

    <!-- Operator + Value -->
    {#if !isBooleanRule}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
                <Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {$t(`${prefix}.operator.label`)}
                </Label>
                <Select.Root
                    type="single"
                    value={formData.operator}
                    onValueChange={(v: string) => { if (v) formData.operator = v as RiskRuleOperator; }}
                >
                    <Select.Trigger class="w-full">
                        {$t(`${prefix}.operator.${allOperators.find(o => o.value === formData.operator)?.key ?? "lte"}`)}
                    </Select.Trigger>
                    <Select.Content>
                        {#each allOperators as op}
                            <Select.Item value={op.value}>{$t(`${prefix}.operator.${op.key}`)}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <div class="space-y-1.5">
                <Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {$t("common.value")}
                </Label>
                <Input
                    type="number"
                    step="0.01"
                    bind:value={formData.value as number}
                />
            </div>

            {#if showSecondaryValue}
                <div class="space-y-1.5 animate-in fade-in slide-in-from-left-1">
                    <Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {$t("common.value")} (2)
                    </Label>
                    <Input
                        type="number"
                        step="0.01"
                        bind:value={formData.value_secondary}
                    />
                </div>
            {/if}
        </div>
    {:else}
        <div class="flex items-center gap-3 py-2">
            <Switch
                checked={formData.value === true}
                onCheckedChange={(v: boolean) => formData.value = v}
            />
            <Label class="text-sm">{$t("risk.rules.active")}</Label>
        </div>
    {/if}

    <!-- Enabled toggle + Actions -->
    <div class="flex items-center justify-between pt-6 border-t border-white/5">
        <div class="flex items-center gap-4">
            <Switch bind:checked={formData.enabled} class="data-[state=checked]:bg-emerald-500" />
            <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{$t("risk.rules.active")}</span>
        </div>
        <div class="flex gap-4">
            <Button variant="ghost" class="h-11 px-8 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 transition-all" onclick={onCancel}>
                {$t("common.cancel")}
            </Button>
            <Button class="h-11 px-12 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20" onclick={handleSave} disabled={!formData.name.trim()}>
                {$t("common.save")}
            </Button>
        </div>
    </div>
</div>

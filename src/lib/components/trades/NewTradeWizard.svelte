<script lang="ts">
  import { currenciesStore } from "$lib/stores/currencies.svelte";
  import { assetTypesStore } from "$lib/stores/asset-types.svelte";
  import { accountsStore } from "$lib/stores/accounts.svelte";
  import { assetsStore } from "$lib/stores/assets.svelte";
  import { timeframesStore } from "$lib/stores/timeframes.svelte";
  import { modalitiesStore } from "$lib/stores/modalities.svelte";
  import { riskSettingsStore } from "$lib/stores/risk-settings.svelte";
    import { t, locale, _ } from "svelte-i18n";
    import { invoke } from "@tauri-apps/api/core";
    import { emit } from "@tauri-apps/api/event";
    import { toast } from "svelte-sonner";
    import { onMount, untrack } from "svelte";
    import { appStore } from "$lib/stores/app.svelte";
    import { userProfileStore } from "$lib/stores/user-profile.svelte.ts";
    import { integrationsStore } from "$lib/stores/integrations.svelte";
    import { financialConfigStore } from "$lib/stores/financial-config.svelte";
    import { workspaceStore } from "$lib/stores/workspace.svelte";
    import { tradesStore } from "$lib/stores/trades.svelte";
    import { rtdStore } from "$lib/stores/rtd.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { Separator } from "$lib/components/ui/separator";
    import { SystemInput, SystemSelect } from "$lib/components/ui/system";
    import PartialExitsManager from "./PartialExitsManager.svelte";
    import ImageUploader from "./ImageUploader.svelte";
    import DailyChecklist from "./DailyChecklist.svelte";
    import { riskEngine } from "$lib/logic/riskEngine.svelte";
    import { AlertCircle } from "lucide-svelte";
    import {
        ChevronLeft,
        ChevronRight,
        Save,
        X,
        Brain,
        ShieldCheck,
        LayoutDashboard,
        Target,
        Camera,
        RotateCcw,
        TrendingUp,
        TrendingDown,
        Calendar,
        Lock,
        RefreshCw,
        Plus,
        Coins,
        ExternalLink,
        Maximize2,
        Image as ImageIcon,
        FileCheck,
        Layers,
        Zap,
    } from "lucide-svelte";
    import { ensureLocalOffset, cn } from "$lib/utils";

    let {
        trade = null,
        editTradeId = undefined,
        close = () => {},
        onsave = () => {},
        detached = false,
    } = $props<{
        trade?: any;
        editTradeId?: string;
        close: () => void;
        onsave?: () => void;
        detached?: boolean;
    }>();

    // Multi-window utility
    const detach = async () => {
        try {
            // Save current state to localStorage for the new window to pick up
            const stateToPass = $state.snapshot(formData);
            localStorage.setItem(
                "pending_trade_wizard_state",
                JSON.stringify(stateToPass),
            );

            await invoke("open_detached_trade_window", {
                theme: userProfileStore.userProfile.theme,
            });
            close(); // Close the modal in the main window
        } catch (e) {
            console.error("Failed to detach window:", e);
        }
    };

    let currentStep = $state(1);
    let isSubmitting = $state(false);

    // Helper to get current time with user's configured offset
    const getNowWithOffset = () => {
        const now = new Date();
        const offsetMinutes = untrack(
            () => userProfileStore.userProfile?.utc_offset || 0,
        );
        const offsetMillis = offsetMinutes * 60000;
        return new Date(now.getTime() + offsetMillis)
            .toISOString()
            .slice(0, 16); // YYYY-MM-DDTHH:MM
    };

    // Form Data - Modern Schema alignment with Historical refinements (d5398093)
    let formData = $state({
        account_id: "",
        strategy_id: "",
        timeframe: "",
        volatility: "",
        asset: "",
        direction: "buy",
        entry_date: getNowWithOffset() as string,
        entry_price: 0,
        quantity: 1,
        modality_id: "",
        entry_emotional_state_id: "",
        stop_loss: null as number | null,
        take_profit: null as number | null,
        intensity: 10,
        fees: 0,
        partial_exits: [] as any[],
        status: "open",
        exit_price: null as number | null,
        exit_date: null as string | null, // Explicit type for lint
        exit_reason: "",
        exit_emotional_state_id: "",
        entry_rationale: "",
        confirmation_signals: "",
        market_context: "",
        relevant_news: "",
        psychology_analysis_during: "",
        followed_plan: true,
        what_worked: "",
        mistakes_improvements: "",
        lessons_learned: "",
        images: [] as string[],
        base_currency: "BRL",
    });

    let selectedAsset = $derived.by(() => {
        const symbol = formData.asset;
        return untrack(() => {
            const allAssets = [...assetsStore.assets, ...rtdAssets];
            return allAssets.find((a) => a.symbol === symbol);
        });
    });

    let selectedAccount = $derived.by(() => {
        const id = formData.account_id;
        return untrack(() => accountsStore.accounts.find((a) => a.id === id));
    });

    let activeRiskProfile = $derived.by(() => {
        const account = selectedAccount;
        if (!account) return riskSettingsStore.riskProfiles[0] || null;

        // Find profile for specific account type or "All"
        return (
            riskSettingsStore.riskProfiles.find(
                (p) =>
                    p.account_type_applicability === account.account_type ||
                    p.account_type_applicability === "All",
            ) ||
            riskSettingsStore.riskProfiles[0] ||
            null
        );
    });

    const suggestedLotMultiplier = $derived(
        riskEngine.getSuggestedLotMultiplier(activeRiskProfile),
    );
    const riskWarnings = $derived(
        riskEngine.getProactiveWarnings(activeRiskProfile),
    );

    const steps = [
        {
            id: 1,
            label: $t("trades.wizard.steps.basic"),
            icon: Target,
        },
        {
            id: 2,
            label: $t("trades.wizard.steps.conduction"),
            icon: ShieldCheck,
        },
        {
            id: 3,
            label: $t("trades.wizard.steps.psychology"),
            icon: Brain,
        },
        {
            id: 4,
            label: $t("trades.wizard.steps.media"),
            icon: ImageIcon,
        },
        {
            id: 5,
            label: $t("trades.wizard.steps.review"),
            icon: FileCheck,
        },
    ];

    // Auto-apply lot adjustment if user clicks
    function applyLotAdjustment() {
        if (suggestedLotMultiplier < 1.0) {
            formData.quantity = Math.floor(
                formData.quantity * suggestedLotMultiplier,
            );
            toast.success($t("trades.wizard.risk.toast_lot_adjusted"));
        }
    }

    let isLivePriceActive = $state(false);
    let isLiveExitPriceActive = $state(false);
    let priceHasFocus = $state(false);

    $effect(() => {
        if (isLivePriceActive && formData.asset) {
            const quote = rtdStore.quotes[formData.asset.toUpperCase()];
            if (quote && quote.last > 0) {
                untrack(() => {
                    formData.entry_price = quote.last;
                });
            }
        }
    });

    $effect(() => {
        if (isLiveExitPriceActive && formData.asset) {
            const quote = rtdStore.quotes[formData.asset.toUpperCase()];
            if (quote && quote.last > 0) {
                untrack(() => {
                    formData.exit_price = quote.last;
                });
            }
        }
    });

    let lastSyncedTradeId = $state<string | undefined>(undefined);
    let lastSyncedDraftKey = $state<string | undefined>(undefined);
    let closureAlreadyExists = $state(false);

    // Track original result for DARF increase warning (Fiscal Guard)
    let originalResult = $state(0);
    let originalData = $state<any>(null);
    let showDarfWarning = $state(false);

    $effect(() => {
        // Only check if we are editing an existing trade that was already closed
        if (editTradeId && originalData?.exit_price !== null) {
            const currentNet = calculationResult.netCurrency;
            const diff = currentNet - originalResult;
            // Using 100 as a threshold for "significant" increase
            showDarfWarning = diff >= 100;
        }
    });

    // Check if a daily closure already exists for data/account to warn the user
    $effect(() => {
        const dateStr = formData.entry_date;
        const accId = formData.account_id;
        if (dateStr && accId) {
            financialConfigStore
                .hasClosureForDate(dateStr, accId)
                .then((exists: boolean) => (closureAlreadyExists = exists));
        } else {
            closureAlreadyExists = false;
        }
    });

    // Reactive synchronization when trade prop changes (CRITICAL for Edit flow)
    $effect(() => {
        // Track only trade prop and ID
        const currentTrade = trade;
        const tradeId = trade?.id;

        // Optimization: only re-sync if the trade ID has actually changed
        // This prevents re-running on every parent re-render if the prop is technically a new object
        if (tradeId && tradeId !== lastSyncedTradeId) {
            console.log(
                "[NewTradeWizard] Syncing formData with trade:",
                tradeId,
                "symbol:",
                currentTrade.asset_symbol,
            );

            lastSyncedTradeId = tradeId;

            // We use untrack to avoid formData dependency loop
            const baseData = untrack(() => formData);

            formData = {
                ...baseData,
                ...currentTrade,
                asset: currentTrade.asset_symbol,
                direction: (currentTrade.direction || "buy").toLowerCase(),
                entry_date: currentTrade.date
                    ? currentTrade.date.slice(0, 16)
                    : getNowWithOffset(),
                exit_date: currentTrade.exit_date
                    ? currentTrade.exit_date.slice(0, 16)
                    : null,

                // Numerical values with forced precision parsing
                entry_price: parseFloat(currentTrade.entry_price as any) || 0,
                exit_price: currentTrade.exit_price
                    ? parseFloat(currentTrade.exit_price as any)
                    : null,
                quantity: parseFloat(currentTrade.quantity as any) || 1,
                stop_loss: currentTrade.stop_loss
                    ? parseFloat(currentTrade.stop_loss as any)
                    : null,
                take_profit: currentTrade.take_profit
                    ? parseFloat(currentTrade.take_profit as any)
                    : null,
                intensity:
                    parseFloat(currentTrade.intensity as any) !== undefined
                        ? parseFloat(currentTrade.intensity as any)
                        : 10,
                fees: parseFloat(currentTrade.fee_total as any) || 0,
                status:
                    currentTrade.exit_price !== null &&
                    currentTrade.exit_price !== undefined
                        ? "closed"
                        : "open",

                images: currentTrade.images || [],
                partial_exits: (currentTrade.partial_exits || []).map(
                    (p: any) => ({
                        ...p,
                        price: parseFloat(p.price) || 0,
                        quantity: parseFloat(p.quantity) || 0,
                    }),
                ),
            };

            // Capture original result for Fiscal Guard comparison
            originalResult = parseFloat(currentTrade.result as any) || 0;
            originalData = JSON.parse(JSON.stringify(currentTrade)); // Capture full original data

            // AUTO-PARTIAL DETECTION (NEW): If we are editing an open trade and
            // the detection triggered this, auto-add a partial entry.
            if (currentTrade._isAutoPartial) {
                console.log(
                    "[NewTradeWizard] Automatic partial detected. Appending to exits...",
                );
                const autoPrice =
                    parseFloat(currentTrade._autoPrice as any) ||
                    currentTrade.entry_price;
                const rtdMode = currentTrade._autoType === "partial_entry" ? "addition" : "exit";

                formData.partial_exits.push({
                    date: currentTrade.date
                        ? currentTrade.date.slice(0, 16)
                        : getNowWithOffset(),
                    price: autoPrice,
                    quantity: 1,
                    type: rtdMode === "addition" ? "entry" : "exit",
                    notes:
                        rtdMode === "addition"
                            ? $t("trades.wizard.messages.rtd_position_addition")
                            : $t("trades.wizard.messages.rtd_partial_exit"),
                });
                currentStep = 2; // Move to the partials manager step immediately
            }
        } else if (currentTrade) {
            // NEW: Support for DRAFT trades (from RTD detection pop-up)
            const draftKey = `${currentTrade.asset_symbol}-${currentTrade.entry_price}-${currentTrade.account_id}`;

            if (draftKey !== lastSyncedDraftKey) {
                console.log(
                    "[NewTradeWizard] Syncing formData with DRAFT trade from RTD:",
                    currentTrade.asset_symbol,
                    "Key:",
                    draftKey,
                );
                lastSyncedDraftKey = draftKey;

                const baseData = untrack(() => formData);
                formData = {
                    ...baseData,
                    asset: currentTrade.asset_symbol || baseData.asset,
                    entry_price:
                        parseFloat(currentTrade.entry_price as any) || 0,
                    account_id: currentTrade.account_id || baseData.account_id,
                    entry_date: currentTrade.date
                        ? currentTrade.date.slice(0, 16)
                        : getNowWithOffset(),
                };
            }
        } else if (
            lastSyncedTradeId !== undefined ||
            lastSyncedDraftKey !== undefined
        ) {
            // Reset to defaults ONLY if we previously had a synced trade
            console.log(
                "[NewTradeWizard] Resetting form to defaults (transition to new trade)",
            );

            lastSyncedTradeId = undefined;
            lastSyncedDraftKey = undefined;

            formData = {
                account_id: "",
                strategy_id: "",
                timeframe: "",
                volatility: "",
                asset: "",
                direction: "buy",
                entry_date: untrack(() => getNowWithOffset()),
                entry_price: 0,
                quantity: 1,
                modality_id: "",
                entry_emotional_state_id: "",
                stop_loss: null,
                take_profit: null,
                intensity: 10,
                fees: 0,
                partial_exits: [],
                status: "open",
                exit_price: null,
                exit_date: null,
                exit_reason: "",
                exit_emotional_state_id: "",
                entry_rationale: "",
                confirmation_signals: "",
                market_context: "",
                relevant_news: "",
                psychology_analysis_during: "",
                followed_plan: true,
                what_worked: "",
                mistakes_improvements: "",
                lessons_learned: "",
                images: [],
                base_currency: "BRL",
            };

            originalResult = 0;
            originalData = null;
        }
    });

    // --- STABILITY LAYER (Svelte 5) ---
    // Removed flawed local snapshots that caused empty dropdowns.
    // Relying on direct store access for non-RTD data ensures robust reactivity.


    onMount(() => {
        // --- RESTORE DETACHED STATE ---
        if (detached) {
            const savedState = localStorage.getItem(
                "pending_trade_wizard_state",
            );
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    formData = { ...formData, ...parsed };
                    console.log(
                        "[NewTradeWizard] Restored state in detached window.",
                    );
                    // Clear it so it doesn't leak to future windows
                    localStorage.removeItem("pending_trade_wizard_state");
                } catch (e) {
                    console.error("Failed to restore detached state:", e);
                }
            }
        }

        // Removed snapshot capturing to rely on direct store reactivity
    });

    // Filtering logic (04/02/2026)
    let selectedAssetTypeId = $state("");
    let userManuallySelectedType = $state(false); // Track manual selection

    // Robust Initialization and auto-selection
    $effect(() => {
        // We need to wait for assetsStore.assets to be populated
        if (assetsStore.assets.length === 0) return;

        // Priority 1: Use trade.asset_type_id if editing and not already set
        if (trade && !selectedAssetTypeId) {
            console.log(
                "[NewTradeWizard] Attempting to initialize asset type for trade:",
                trade.id,
                "symbol:",
                trade.asset_symbol,
            );
            if (trade.asset_type_id) {
                const type = assetTypesStore.assetTypes.find(
                    (t) =>
                        t.id === trade.asset_type_id ||
                        t.id.replace(/^asset_type:/, "") ===
                            trade.asset_type_id.replace(/^asset_type:/, ""),
                );
                selectedAssetTypeId = type ? type.id : trade.asset_type_id;
                console.log(
                    "[NewTradeWizard] Initialized from trade.asset_type_id:",
                    selectedAssetTypeId,
                );
            }
            // Priority 2: Force symbol lookup for editing trades without asset_type_id
            else if (trade.asset_symbol) {
                const asset = assetsStore.assets.find(
                    (a) =>
                        a.symbol.toUpperCase() ===
                        trade.asset_symbol.toUpperCase(),
                );
                if (asset) {
                    const type = assetTypesStore.assetTypes.find(
                        (t) =>
                            t.id === asset.asset_type_id ||
                            t.id.replace(/^asset_type:/, "") ===
                                asset.asset_type_id.replace(/^asset_type:/, ""),
                    );
                    selectedAssetTypeId = type ? type.id : asset.asset_type_id;
                    console.log(
                        "[NewTradeWizard] Initialized from symbol lookup (edit):",
                        selectedAssetTypeId,
                        "for",
                        trade.asset_symbol,
                    );
                } else {
                    console.warn(
                        "[NewTradeWizard] Symbol lookup failed for",
                        trade.asset_symbol,
                        "Total assets in store:",
                        assetsStore.assets.length,
                    );
                }
            }
        }

        // Priority 3: Auto-select based on formData.asset changes (for new trades or when changing symbol)
        // But don't override if user manually selected a type
        if (!userManuallySelectedType && formData.asset) {
            const allAssets = [...assetsStore.assets, ...rtdAssets];
            const asset = allAssets.find(
                (a) => a.symbol.toUpperCase() === formData.asset.toUpperCase(),
            );
            if (asset) {
                const type = assetTypesStore.assetTypes.find(
                    (t) =>
                        t.id === asset.asset_type_id ||
                        t.id.replace(/^asset_type:/, "") ===
                            asset.asset_type_id.replace(/^asset_type:/, ""),
                );
                if (type && type.id !== selectedAssetTypeId) {
                    selectedAssetTypeId = type.id;
                    console.log(
                        "[NewTradeWizard] Auto-syncing from asset symbol (direct store access):",
                        selectedAssetTypeId,
                        "for",
                        formData.asset,
                    );
                }
            }
        }
    });

    // Stable list of extra assets from RTD
    let rtdAssets = $derived.by(() => {
        const symbols = rtdStore.symbols;
        if (symbols.length === 0) return [];

        // Cache external lookups for performance
        const assetSymbolsSet = new Set(
            assetsStore.assets.map((a) => a.symbol),
        );

        const futType =
            assetTypesStore.assetTypes.find(
                (t) =>
                    t.name.toLowerCase().includes("future") ||
                    t.name.toLowerCase().includes("futuro"),
            )?.id || "";
        const indType =
            assetTypesStore.assetTypes.find(
                (t) =>
                    t.name.toLowerCase().includes("index") ||
                    t.name.toLowerCase().includes("indice"),
            )?.id || "";
        const stockType =
            assetTypesStore.assetTypes.find(
                (t) =>
                    t.name.toLowerCase().includes("stock") ||
                    t.name.toLowerCase().includes("ação") ||
                    t.name.toLowerCase().includes("aç"),
            )?.id || "";

        return symbols
            .filter((sym) => !assetSymbolsSet.has(sym))
            .map((sym) => {
                let guessedTypeId = "rtd";
                let pointValue = 1.0;

                const safeId = (typeObj: any) => typeObj ? typeObj.id || typeObj : undefined;

                // Better detection for Brazilian Mini-Futures (WIN/WDO)
                const upperSym = sym.toUpperCase();
                if (upperSym.startsWith("WDO")) {
                    guessedTypeId = safeId(futType) || safeId(indType) || "rtd";
                    pointValue = 10.0;
                } else if (
                    upperSym.startsWith("WIN") ||
                    upperSym.startsWith("IND")
                ) {
                    guessedTypeId = safeId(futType) || safeId(indType) || "rtd";
                    pointValue = 0.2;
                } else if (upperSym.startsWith("DOL")) {
                    guessedTypeId = safeId(futType) || safeId(indType) || "rtd";
                    pointValue = 10.0;
                } else if (/^[A-Z]{4}\d/i.test(sym)) {
                    guessedTypeId = safeId(stockType) || "rtd";
                }

                return {
                    id: `rtd:${sym}`,
                    symbol: sym,
                    name: `${$t("trades.wizard.messages.rtd_profit_asset_active")} (${sym})`,
                    asset_type_id: guessedTypeId,
                    point_value: pointValue,
                    default_fee_id: undefined,
                    tax_profile_id: undefined,
                };
            });
    });

    let filteredAssets = $derived.by(() => {
        const assets = [...assetsStore.assets, ...rtdAssets];
        if (!selectedAssetTypeId) return assets;

        const typeId = selectedAssetTypeId.replace(/^asset_type:/, "");
        return assets.filter(
            (a) => (a.asset_type_id || "").replace(/^asset_type:/, "") === typeId,
        );
    });

    // AUTO-SYNC Price: Removed as per user request to avoid lag
    // Price synchronization is now manual via the Refresh button.

    // Financial Estimation for Stop/Profit (Real-time feedback)
    const stopLossFinancial = $derived.by(() => {
        if (!formData.stop_loss || !formData.entry_price || !formData.quantity) return 0;
        const asset = selectedAsset;
        const pointValue = (() => {
            if (asset?.point_value) return asset.point_value;
            const upperSym = (formData.asset || "").toUpperCase();
            if (upperSym.startsWith("WIN") || upperSym.startsWith("IND")) return 0.2;
            if (upperSym.startsWith("WDO")) return 10.0;
            if (upperSym.startsWith("DOL")) return 50.0;
            return 1.0;
        })();
        return Math.abs(formData.entry_price - formData.stop_loss) * formData.quantity * pointValue;
    });

    const takeProfitFinancial = $derived.by(() => {
        if (!formData.take_profit || !formData.entry_price || !formData.quantity) return 0;
        const asset = selectedAsset;
        const pointValue = (() => {
            if (asset?.point_value) return asset.point_value;
            const upperSym = (formData.asset || "").toUpperCase();
            if (upperSym.startsWith("WIN") || upperSym.startsWith("IND")) return 0.2;
            if (upperSym.startsWith("WDO")) return 10.0;
            if (upperSym.startsWith("DOL")) return 50.0;
            return 1.0;
        })();
        return Math.abs(formData.take_profit - formData.entry_price) * formData.quantity * pointValue;
    });

    let calculationResult = $derived.by(() => {
        const asset = selectedAsset;
        const assetTypes = assetTypesStore.assetTypes;
        const assetType =
            assetTypes.find((at) => at.id === asset?.asset_type_id) ||
            assetTypes.find((at) => at.id === "rtd") ||
            assetTypes[0];
        const account = selectedAccount;
        const currencySymbol = account
            ? currenciesStore.getCurrencySymbol(account.currency)
            : "R$";

        const pointValue = (() => {
            if (asset?.point_value) return asset.point_value;
            const upperSym = (formData.asset || "").toUpperCase();
            if (upperSym.startsWith("WIN") || upperSym.startsWith("IND"))
                return 0.2;
            if (upperSym.startsWith("WDO")) return 10.0;
            if (upperSym.startsWith("DOL")) return 50.0;
            return 1.0;
        })();

        const multiplier =
            (formData.direction || "").toLowerCase() === "buy" ? 1 : -1;
        const isPoints = assetType?.result_type === "points";

        // MOVING AVERAGE logic:
        // 1. Additions update the current average price.
        // 2. Partials realize P&L based on the average price at that moment.
        let currentAvgPrice = formData.entry_price || 0;
        let currentQty = formData.quantity || 0;
        let totalEntryQty = formData.quantity || 0;
        let totalExitQty = 0;
        let grossCurrencyTotal = 0;
        let memoryItems: any[] = [];

        // Sort parciais by date to ensure chronological processing
        const sortedPartials = [...formData.partial_exits].sort((a, b) => {
            return (
                new Date(a.date || 0).getTime() -
                new Date(b.date || 0).getTime()
            );
        });

        let calculatedFees = 0;

        // 1. Process All Realizations (Partials)
        sortedPartials.forEach((p: any) => {
            const qty = p.quantity || 0;
            const price = p.price || 0;
            const isEntry = p.type === "entry";

            if (isEntry) {
                const newQty = currentQty + qty;
                if (newQty > 0) {
                    currentAvgPrice =
                        (currentAvgPrice * currentQty + price * qty) / newQty;
                }
                currentQty = newQty;
                totalEntryQty += qty;
                memoryItems.push({
                    label: `${$t("trades.wizard.summary.addition")} (+${qty} ${assetType?.unit_label || "ctr"}) @ ${price}`,
                    resultCurrency: 0,
                    resultPoints: 0,
                    type: "addition",
                    unit: "currency",
                });
            } else {
                // Realize profit based on CURRENT average price
                const diff = price - currentAvgPrice;
                const resultCurrency = diff * qty * pointValue * multiplier;
                grossCurrencyTotal += resultCurrency;
                currentQty -= qty;
                totalExitQty += qty;

                memoryItems.push({
                    label: `${$t("trades.wizard.summary.partial_exit")} (-${qty} ${assetType?.unit_label || "ctr"}) @ ${price}`,
                    resultCurrency: resultCurrency,
                    resultPoints: resultCurrency / pointValue,
                    type: "exit",
                    unit: isPoints ? "points" : "currency",
                });
            }
        });

        // 2. Final Exit Calculation
        const remainingQty = totalEntryQty - totalExitQty;
        const finalExitPrice =
            formData.exit_price !== null ? Number(formData.exit_price) : null;

        if (finalExitPrice !== null && remainingQty > 0) {
            const diff = finalExitPrice - currentAvgPrice;
            const resultCurrency =
                diff * remainingQty * pointValue * multiplier;
            grossCurrencyTotal += resultCurrency;
            memoryItems.push({
                label: `${$t("trades.wizard.summary.final_exit")} (-${remainingQty} ${assetType?.unit_label || "ctr"}) @ ${finalExitPrice}`,
                resultCurrency: resultCurrency,
                resultPoints: resultCurrency / pointValue,
                type: "exit",
                unit: isPoints ? "points" : "currency",
            });
        }

        // 3. Automatic Fee Calculation
        const feeProfile = financialConfigStore.fees.find(
            (f) => f.id === asset?.default_fee_id,
        );

        if (feeProfile) {
            // Fee calculation on total volume
            // Re-calculate total entry value for fee purposes
            let totalEntryValForFees = formData.entry_price * formData.quantity;
            sortedPartials.forEach((p: any) => {
                if (p.type === "entry")
                    totalEntryValForFees += (p.price || 0) * (p.quantity || 0);
            });
            const entryValue = totalEntryValForFees * pointValue;

            if (feeProfile.fixed_fee > 0) {
                const fixed = feeProfile.fixed_fee * totalEntryQty;
                calculatedFees += fixed;
                memoryItems.push({
                    label: $t("trades.wizard.summary.fixed_fee"),
                    resultCurrency: -fixed,
                    resultPoints: -fixed / pointValue,
                    unit: "currency",
                });
            }

            if (feeProfile.percentage_fee > 0) {
                const perc = entryValue * (feeProfile.percentage_fee / 100);
                calculatedFees += perc;
                memoryItems.push({
                    label: `${$t("trades.wizard.summary.variable_fee")} (${feeProfile.percentage_fee}%)`,
                    resultCurrency: -perc,
                    resultPoints: -perc / pointValue,
                    unit: "currency",
                });
            }

            if (feeProfile.exchange_fee > 0) {
                const exch = entryValue * (feeProfile.exchange_fee / 100);
                calculatedFees += exch;
                memoryItems.push({
                    label: `${$t("trades.wizard.summary.exchange_fees")} (${feeProfile.exchange_fee}%)`,
                    resultCurrency: -exch,
                    resultPoints: -exch / pointValue,
                    unit: "currency",
                });
            }

            if (feeProfile.withholding_tax > 0 && grossCurrencyTotal > 0) {
                const irrf =
                    grossCurrencyTotal * (feeProfile.withholding_tax / 100);
                calculatedFees += irrf;
                memoryItems.push({
                    label: `${$t("trades.wizard.summary.irrf_estimated")} (${feeProfile.withholding_tax}%)`,
                    resultCurrency: -irrf,
                    resultPoints: -irrf / pointValue,
                    unit: "currency",
                });
            }
        }

        const finalFees = calculatedFees || formData.fees || 0;

        // Add Gross Header
        if (memoryItems.length > 0) {
            memoryItems.push({
                label: $t("trades.wizard.summary.gross_result"),
                resultCurrency: grossCurrencyTotal,
                resultPoints: grossCurrencyTotal / pointValue,
                unit: isPoints ? "points" : "currency",
                isHeader: true,
            });
        }

        return {
            grossCurrency: grossCurrencyTotal,
            grossPoints: grossCurrencyTotal / pointValue,
            netCurrency: grossCurrencyTotal - finalFees,
            netPoints: (grossCurrencyTotal - finalFees) / pointValue,
            fees: finalFees,
            remainingQty: totalEntryQty - totalExitQty,
            memoryItems,
            assetType,
            currencySymbol,
            totalEntryQty,
            globalAvgPrice: currentAvgPrice,
        };
    });

    function handleNext() {
        if (currentStep === 1) {
            if (
                !formData.account_id ||
                !formData.asset ||
                !formData.strategy_id ||
                !formData.modality_id
            ) {
                toast.error($t("trades.wizard.messages.required_fields"));
                return;
            }
            if (formData.entry_price <= 0) {
                toast.error($t("trades.wizard.messages.entry_price_required"));
                return;
            }
        }
        if (currentStep < steps.length) currentStep++;
    }

    function handlePrev() {
        if (currentStep > 1) currentStep--;
    }

    function sanitize(val: any): any {
        if (typeof val === "string") return val.trim().slice(0, 1000); // Limit long strings
        return val;
    }

    async function handleSubmit() {
        // CRITICAL: Use editTradeId PROP (passed from parent at mount time via {#key}) as the
        // submission mode indicator. This is immune to Svelte $effect re-evaluation during async saves.
        // lastSyncedTradeId can be reset mid-save if the trade prop changes reactively.
        const submissionId = editTradeId;
        console.log(
            "[NewTradeWizard] Submitting form. Mode:",
            submissionId ? "Edit" : "New",
            "Target ID (editTradeId prop):",
            submissionId,
            "lastSyncedTradeId at submit time:",
            lastSyncedTradeId,
            "trade?.id at submit time:",
            trade?.id,
        );
        console.log(
            "[NewTradeWizard] Form Data Snapshot:",
            $state.snapshot(formData),
        );

        // CRITICAL: Ensure asset_type_id is set before saving
        if (!selectedAssetTypeId && formData.asset) {
            const asset = assetsStore.assets.find(
                (a) => a.symbol.toUpperCase() === formData.asset.toUpperCase(),
            );
            if (asset) {
                const type = assetTypesStore.assetTypes.find(
                    (t) =>
                        t.id === asset.asset_type_id ||
                        t.id.replace(/^asset_type:/, "") ===
                            asset.asset_type_id.replace(/^asset_type:/, ""),
                );
                selectedAssetTypeId = type ? type.id : asset.asset_type_id;
                console.log(
                    "[NewTradeWizard] Auto-filled asset_type_id from asset:",
                    selectedAssetTypeId,
                );
            } else {
                toast.error($t("trades.wizard.messages.valid_asset_type"));
                return;
            }
        }

        if (!selectedAssetTypeId) {
            toast.error($t("trades.wizard.messages.asset_type_required"));
            return;
        }

        // --- SECURITY & VALIDATION LAYER ---
        const cleanAsset = sanitize(formData.asset).toUpperCase();
        if (cleanAsset.length < 2 || cleanAsset.length > 20) {
            toast.error($t("trades.wizard.messages.invalid_asset_symbol"));
            return;
        }

        const qty = Number(formData.quantity);
        if (isNaN(qty) || qty <= 0 || qty > 1000000000) {
            toast.error($t("trades.wizard.messages.invalid_quantity"));
            return;
        }

        const ePrice = Number(formData.entry_price);
        if (isNaN(ePrice) || ePrice <= 0) {
            toast.error($t("trades.wizard.messages.invalid_entry_price"));
            return;
        }

        if (formData.status === "closed" || formData.exit_price !== null) {
            const exPrice = Number(formData.exit_price);
            if (isNaN(exPrice) || exPrice <= 0) {
                toast.error($t("trades.wizard.messages.invalid_exit_price"));
                return;
            }
        }

        isSubmitting = true;
        try {
            const tradeData: any = {
                // Use ensureLocalOffset to preserve local time intent and avoid timezone shifts
                date: ensureLocalOffset(formData.entry_date as string),
                asset_symbol: cleanAsset,
                asset_type_id: selectedAssetTypeId,
                strategy_id: formData.strategy_id,
                account_id: formData.account_id,
                result: calculationResult.netCurrency,
                quantity: formData.quantity,
                direction: formData.direction === "buy" ? "Buy" : "Sell",
                entry_price: formData.entry_price,
                exit_price: formData.exit_price,
                exit_date: formData.exit_date
                    ? ensureLocalOffset(formData.exit_date as string)
                    : formData.exit_price !== null
                      ? ensureLocalOffset(new Date().toISOString()) // Current local ISO with offset
                      : null,
                fee_total: formData.fees,
                notes: formData.entry_rationale,

                timeframe: formData.timeframe,
                volatility: formData.volatility,
                modality_id: formData.modality_id,
                stop_loss: formData.stop_loss,
                take_profit: formData.take_profit,
                intensity: formData.intensity,

                entry_emotional_state_id: formData.entry_emotional_state_id,

                exit_reason: formData.exit_reason,
                exit_emotional_state_id: formData.exit_emotional_state_id,

                entry_rationale: formData.entry_rationale,
                confirmation_signals: formData.confirmation_signals,
                market_context: formData.market_context,
                relevant_news: formData.relevant_news,

                followed_plan: !!formData.followed_plan,
                what_worked: formData.what_worked,
                mistakes_improvements: formData.mistakes_improvements,
                lessons_learned: formData.lessons_learned,

                images: formData.images,
                partial_exits: formData.partial_exits,
            };

            console.log(
                "[NewTradeWizard] Submission tradeData:",
                JSON.stringify(tradeData, null, 2),
            );

            if (submissionId) {
                // FISCAL GUARD (d5398093): Warn if profit increase might require complementary DARF
                const currentNetResult = calculationResult.netCurrency;
                if (
                    originalResult !== null &&
                    activeRiskProfile?.id !== "demo"
                ) {
                    const month = formData.entry_date.substring(0, 7);
                    const nowMonth = new Date().toISOString().substring(0, 7);

                    // Significant increase (> R$ 10.0 or 20% relative to month total?)
                    // Simple threshold: if new result > original + 10.0 (minimum DARF trigger)
                    const profitIncrease = currentNetResult - originalResult;

                    if (profitIncrease > 10.0 && month < nowMonth) {
                        const confirmed = confirm(
                            $t("fiscal.darf.complementaryWarning"),
                        );
                        if (!confirmed) {
                            isSubmitting = false;
                            return;
                        }
                    }
                }

                // DARF Warning Logic (as per instruction)
                if (
                    editTradeId &&
                    calculationResult.netCurrency > originalResult + 100
                ) {
                    toast.error(
                        $t("fiscal.darf.complementaryWarning"),
                        {
                            duration: 6000,
                            position: "top-center",
                            style: "background: #1a1a1a; color: #ff4b4b; border: 1px solid #ff4b4b22; font-weight: 600;",
                        },
                    );
                }

                console.log(
                    "[NewTradeWizard] Calling updateTrade for ID:",
                    submissionId,
                );
                const result = await tradesStore.updateTrade(
                    submissionId,
                    tradeData,
                );
                if (result.success) {
                    toast.success($t("trades.wizard.messages.update_success"));
                    currentStep = 1;
                    emit("trade-saved", { mode: "update" }).catch(() => {});
                    onsave();
                    close();
                } else {
                    console.error(
                        "[NewTradeWizard] Backend Update Error:",
                        result.error,
                    );
                    toast.error(
                        result.error ||
                            $t("trades.wizard.messages.update_error"),
                    );
                }
            } else {
                console.log("[NewTradeWizard] Calling addTrade");
                const result = await tradesStore.addTrade(tradeData);
                if (result.success) {
                    if (closureAlreadyExists && !submissionId) {
                        toast.success(
                            $t("trades.wizard.messages.save_success_with_sync"),
                        );
                    } else {
                        toast.success(
                            $t("trades.wizard.messages.save_success"),
                        );
                    }
                    currentStep = 1;
                    emit("trade-saved", { mode: "new" }).catch(() => {});
                    onsave();
                    close();
                } else {
                    console.error(
                        "[NewTradeWizard] Backend Save Error:",
                        result.error,
                    );
                    toast.error(
                        result.error || $t("trades.wizard.messages.save_error"),
                    );
                }
            }
        } catch (e) {
            console.error("[NewTradeWizard] CRITICAL CLIENT CRASH:", e);
            toast.error($t("trades.wizard.messages.save_error"));
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="flex flex-col h-full bg-background overflow-hidden">
    <!-- Header with Modern Stepper -->
    <!-- Institutional Header -->
    <div class="p-6 bg-muted/5 border-b border-border flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[1rem] bg-primary/10 flex items-center justify-center border border-primary/20">
                <Target class="w-5 h-5 text-primary" />
            </div>
            <div>
                <h2 class="text-lg font-black uppercase tracking-tight text-foreground leading-none flex items-center gap-2">
                    {trade?.id ? $t("trades.wizard.title_edit") : $t("trades.wizard.title_new")}
                    {#if !detached}
                        <button 
                            onclick={detach}
                            class="p-1.5 rounded-md border border-border/50 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-muted-foreground/40 hover:text-emerald-500 transition-all ml-2"
                            title={$t("trades.wizard.actions.detach")}
                        >
                            <Maximize2 class="w-4 h-4" />
                        </button>
                    {/if}
                </h2>
                <p class="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mt-1">
                    Institutional Terminal v4.0
                </p>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <!-- Step Navigation Pills -->
            <div class="flex items-center gap-1 bg-muted/10 p-1 rounded-full border border-border/50">
                {#each steps as step}
                    {@const isCurrent = currentStep === step.id}
                    {@const isPast = currentStep > step.id}
                    <button 
                        onclick={() => (currentStep = step.id)}
                        class="h-8 px-4 rounded-full flex items-center gap-2 transition-all {isCurrent ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground/40 hover:bg-white/5'}"
                    >
                        <step.icon class="w-3.5 h-3.5" />
                        <span class="text-[9px] font-black uppercase tracking-widest">{step.label}</span>
                    </button>
                {/each}
            </div>

            <Separator orientation="vertical" class="h-6 bg-border/50 mx-2" />



            {#if !detached}
                <button 
                    onclick={close}
                    class="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center hover:bg-rose-500/10 hover:border-rose-500/20 text-muted-foreground/40 hover:text-rose-500 transition-all"
                >
                    <X class="w-5 h-5" />
                </button>
            {/if}
        </div>
    </div>

    <!-- Main Content Area (Institutional Terminal Style) -->
    <div class="flex-1 overflow-y-auto p-6 space-y-8 bg-background">
        <div class="max-w-5xl mx-auto">
            {#if currentStep === 1}
                <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <!-- Context Section -->
                    <div class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-border pb-3">
                            <Target class="w-3.5 h-3.5 text-primary/60" />
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("trades.wizard.sections.context")}</span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <SystemSelect 
                                label={$t("trades.wizard.fields.account")}
                                bind:value={formData.account_id}
                                options={accountsStore.accounts.map(acc => ({ value: acc.id, label: acc.nickname }))}
                                placeholder={$t("trades.wizard.placeholders.select")}
                                class="md:max-w-[200px]"
                            />

                            <SystemSelect 
                                label={$t("trades.wizard.fields.strategy")}
                                bind:value={formData.strategy_id}
                                options={workspaceStore.strategies.map(s => ({ value: s.id, label: s.name }))}
                                placeholder={$t("trades.wizard.placeholders.select")}
                                class="md:max-w-[200px]"
                            />

                            <SystemSelect 
                                label={$t("trades.wizard.fields.timeframe")}
                                bind:value={formData.timeframe}
                                options={timeframesStore.timeframes.map(tf => ({ value: tf.value, label: tf.name }))}
                                placeholder={$t("trades.wizard.placeholders.select")}
                                class="md:max-w-[200px]"
                            />

                            <SystemSelect 
                                label={$t("trades.wizard.fields.volatility")}
                                bind:value={formData.volatility}
                                options={[
                                    {value: 'baixa', label: $t(`trades.wizard.volatility_options.low`)},
                                    {value: 'normal', label: $t(`trades.wizard.volatility_options.normal`)},
                                    {value: 'alta', label: $t(`trades.wizard.volatility_options.high`)},
                                    {value: 'extrema', label: $t(`trades.wizard.volatility_options.extreme`)}
                                ]}
                                placeholder={$t("trades.wizard.placeholders.select")}
                                class="md:max-w-[200px]"
                            />
                        </div>

                        <!-- Row 1: Tipo Ativo | Ativo | Modalidade -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SystemSelect 
                                label={$t("trades.wizard.fields.asset_type")}
                                bind:value={selectedAssetTypeId}
                                onchange={() => { userManuallySelectedType = true; }}
                                options={assetTypesStore.assetTypes.map(t => ({ value: t.id, label: t.name }))}
                                placeholder={$t("trades.wizard.placeholders.all_types")}
                            />

                            <SystemSelect 
                                label={$t("trades.wizard.fields.asset")}
                                bind:value={formData.asset}
                                options={filteredAssets.map(a => ({ value: a.symbol, label: `${a.symbol} - ${a.name}` }))}
                                placeholder={$t("trades.wizard.placeholders.select")}
                            />

                            <SystemSelect 
                                label={$t("trades.wizard.fields.modality")}
                                bind:value={formData.modality_id}
                                options={modalitiesStore.modalities.map(m => ({ value: m.id, label: m.name }))}
                                placeholder={$t("trades.wizard.placeholders.select")}
                            />
                        </div>

                        <!-- Row 2: Direção | Estado Emocional | Data e Hora -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="flex flex-col gap-2 w-full">
                                <span class="text-[9px] font-black uppercase tracking-[var(--letter-spacing-institutional)] text-muted-foreground/80 px-1 ml-1 block">
                                    {$t("trades.wizard.fields.direction")}
                                </span>
                                <div class="grid grid-cols-2 gap-2 h-10">
                                    <button 
                                        type="button" 
                                        class="rounded-full font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 {formData.direction === 'buy' ? 'bg-emerald-500 text-[#064e3b] shadow-lg shadow-emerald-500/20' : 'bg-muted/5 border border-border text-muted-foreground/40 hover:bg-muted/10'}" 
                                        onclick={() => (formData.direction = "buy")}
                                    >
                                        <TrendingUp class="w-3.5 h-3.5" />
                                        {$t("trades.wizard.fields.buy")}
                                    </button>
                                    <button 
                                        type="button" 
                                        class="rounded-full font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 {formData.direction === 'sell' ? 'bg-rose-500 text-[#4c0519] shadow-lg shadow-rose-500/20' : 'bg-muted/5 border border-border text-muted-foreground/40 hover:bg-muted/10'}" 
                                        onclick={() => (formData.direction = "sell")}
                                    >
                                        <TrendingDown class="w-3.5 h-3.5" />
                                        {$t("trades.wizard.fields.sell")}
                                    </button>
                                </div>
                            </div>

                            <SystemSelect 
                                label={$t("trades.wizard.fields.emotional_state")}
                                bind:value={formData.entry_emotional_state_id}
                                options={workspaceStore.emotionalStates.map(e => ({ value: e.id, label: e.name }))}
                                placeholder={$t("trades.wizard.placeholders.select")}
                            />

                            <SystemInput 
                                label={$t("trades.wizard.fields.date_time")}
                                type="datetime-local" 
                                bind:value={formData.entry_date} 
                            />
                        </div>

                        <!-- Row 3: Execução — Entrada + Lotes + Stop Loss + Take Profit -->
                        <div class="grid grid-cols-4 gap-3 pt-4 border-t border-border items-end">
                            <!-- Entry Price -->
                            <div class="relative group col-span-1">
                                <SystemInput 
                                    label={$t("trades.wizard.fields.entry_price")}
                                    type="number" 
                                    bind:value={formData.entry_price} 
                                    oninput={() => (isLivePriceActive = false)}
                                    class="font-mono font-black text-emerald-400 pr-10"
                                />
                                <button 
                                    type="button"
                                    onclick={() => (isLivePriceActive = !isLivePriceActive)}
                                    class={cn(
                                        "absolute right-2 top-7 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                                        isLivePriceActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-muted-foreground/30 hover:bg-muted/10 hover:text-emerald-500"
                                    )}
                                >
                                    <Zap class={cn("w-3 h-3", isLivePriceActive && "fill-current")} />
                                </button>
                            </div>

                            <!-- Lotes (compact) -->
                            <SystemInput 
                                label={$t("trades.wizard.fields.quantity")}
                                type="number" 
                                bind:value={formData.quantity} 
                                class="font-mono font-black"
                            />

                             <!-- Stop Loss -->
                             <div class="flex flex-col gap-1.5">
                                <SystemInput 
                                    label={$t("trades.wizard.fields.stop_loss")}
                                    type="number"
                                    step="any"
                                    bind:value={formData.stop_loss}
                                    class="font-mono text-rose-400"
                                />
                                {#if stopLossFinancial > 0}
                                    <span class="text-[9px] font-black text-rose-500/60 uppercase tracking-tighter px-2">
                                        -{calculationResult.currencySymbol} {stopLossFinancial.toLocaleString($locale || "pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                {/if}
                             </div>

                             <!-- Take Profit -->
                             <div class="flex flex-col gap-1.5">
                                <SystemInput 
                                    label={$t("trades.wizard.fields.take_profit")}
                                    type="number"
                                    step="any"
                                    bind:value={formData.take_profit}
                                    class="font-mono text-emerald-400"
                                />
                                {#if takeProfitFinancial > 0}
                                    <span class="text-[9px] font-black text-emerald-500/60 uppercase tracking-tighter px-2">
                                        +{calculationResult.currencySymbol} {takeProfitFinancial.toLocaleString($locale || "pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                {/if}
                             </div>
                        </div>
                    </div>
                </div>
            {:else if currentStep === 2}
                <div
                    class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
                >
                    <section class="space-y-2">
                        <div class="flex items-center gap-3 border-b border-border/40 pb-2">
                            <Layers class="w-3.5 h-3.5 text-indigo-400" />
                            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                {$t("trades.wizard.sections.partial_management.title")}
                            </span>
                        </div>
                        {#if true}
                            {@const selectedAsset = assetsStore.assets.find(
                                (a) => a.symbol === formData.asset,
                            )}
                            {@const resolvedPointValue = (() => {
                                if (selectedAsset?.point_value)
                                    return selectedAsset.point_value;
                                const upperSym = (
                                    formData.asset || ""
                                ).toUpperCase();
                                if (
                                    upperSym.startsWith("WIN") ||
                                    upperSym.startsWith("IND")
                                )
                                    return 0.2;
                                if (upperSym.startsWith("WDO")) return 10.0;
                                if (upperSym.startsWith("DOL")) return 50.0;
                                return 1.0;
                            })()}
                            <PartialExitsManager
                                bind:partials={formData.partial_exits}
                                entryPrice={formData.entry_price}
                                totalQuantity={formData.quantity}
                                direction={formData.direction}
                                pointValue={resolvedPointValue}
                                currencySymbol={calculationResult.currencySymbol}
                                unitLabel={calculationResult.assetType
                                    ?.unit_label ||
                                    $t("trades.wizard.unit_labels.contracts")}
                                resultSuffix={calculationResult.assetType
                                    ?.result_type === "points"
                                    ? $t("trades.wizard.units.points")
                                    : ""}
                                resultPrefix={calculationResult.assetType
                                    ?.result_type === "currency"
                                    ? calculationResult.currencySymbol + " "
                                    : ""}
                            />
                        {/if}
                    </section>

                    <section class="space-y-3 pt-3 border-t border-border/40">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Lock class="w-3.5 h-3.5 text-muted-foreground/60" />
                                <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                    {$t("trades.wizard.sections.closing_data")}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    class="text-[10px] font-bold uppercase tracking-tighter {formData.status ===
                                    'open'
                                        ? 'text-primary'
                                        : 'text-muted-foreground'}"
                                    >{$t("trades.list.table.status_open")}</span
                                >
                                <button
                                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors bg-muted/40 border border-border/40"
                                    type="button"
                                    role="switch"
                                    aria-label={$t("trades.wizard.fields.status")}
                                    aria-checked={formData.status === "closed"}
                                    onclick={(e) => {
                                        e.preventDefault();
                                        formData.status =
                                            formData.status === "open"
                                                ? "closed"
                                                : "open";
                                        if (formData.status === "closed" && !formData.exit_date) {
                                            formData.exit_date = getNowWithOffset();
                                        }
                                        if (formData.status === "open") {
                                            formData.exit_price = null;
                                            formData.exit_date = null;
                                            formData.exit_reason = "";
                                            formData.exit_emotional_state_id =
                                                "";
                                        }
                                    }}
                                >
                                    <span
                                        class="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 {formData.status ===
                                        'closed'
                                            ? 'translate-x-4 bg-emerald-500'
                                            : 'translate-x-0'}"
                                    ></span>
                                </button>
                                <span
                                    class="text-[10px] font-bold uppercase tracking-tighter {formData.status ===
                                    'closed'
                                        ? 'text-emerald-500'
                                        : 'text-muted-foreground'}"
                                    >{$t("trades.list.table.status_closed")}</span
                                >
                            </div>
                        </div>

                        {#if formData.status === "closed"}
                            <div
                                class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
                            >
                                <div class="relative group">
                                    <SystemInput 
                                        label={$t("trades.wizard.fields.exit_price")}
                                        type="number"
                                        step="any"
                                        bind:value={formData.exit_price}
                                        oninput={() => (isLiveExitPriceActive = false)}
                                        class="font-mono font-bold pr-12"
                                    />
                                    <button 
                                        type="button"
                                        onclick={() => (isLiveExitPriceActive = !isLiveExitPriceActive)}
                                        class={cn(
                                            "absolute right-2 top-8 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                                            isLiveExitPriceActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-muted-foreground/30 hover:bg-muted/10 hover:text-emerald-500"
                                        )}
                                    >
                                        <Zap class={cn("w-3.5 h-3.5", isLiveExitPriceActive && "fill-current")} />
                                    </button>
                                </div>
                                
                                <SystemInput 
                                    label={$t("trades.wizard.fields.exit_date")}
                                    type="datetime-local"
                                    bind:value={formData.exit_date}
                                />

                                <SystemSelect 
                                    label={$t("trades.wizard.fields.exit_reason")}
                                    bind:value={formData.exit_reason}
                                    options={[
                                        { value: 'Take Profit', label: $t("trades.wizard.exit_reasons.take_profit") },
                                        { value: 'Stop Loss', label: $t("trades.wizard.exit_reasons.stop_loss") },
                                        { value: 'Manual', label: $t("trades.wizard.exit_reasons.manual") },
                                        { value: 'Time', label: $t("trades.wizard.exit_reasons.time") },
                                        { value: 'Strategy', label: $t("trades.wizard.exit_reasons.strategy") }
                                    ]}
                                    placeholder={$t("trades.wizard.placeholders.select")}
                                />

                                <SystemSelect 
                                    label={$t("trades.wizard.fields.emotional_state")}
                                    bind:value={formData.exit_emotional_state_id}
                                    options={workspaceStore.emotionalStates.map(e => ({ value: e.id, label: e.name }))}
                                    placeholder={$t("trades.wizard.placeholders.select")}
                                />
                            </div>
                        {/if}
                    </section>

                    <!-- Financial Summary Display -->
                    <div
                        class="mt-4 p-4 rounded-xl bg-card border border-border/40 shadow-lg overflow-hidden relative group"
                    >
                        <div
                            class="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="p-3 rounded-lg bg-primary/10 border border-primary/20"
                                >
                                    <TrendingUp class="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h4
                                            class="text-base font-bold tracking-tight text-foreground"
                                        >
                                            {formData.asset}
                                        </h4>
                                        <span
                                            class="px-1.5 py-0.5 rounded text-[9px] font-bold {formData.direction ===
                                            'buy'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : 'bg-red-500/10 text-red-500'} uppercase"
                                        >
                                            {formData.direction === "buy"
                                                ? $t("trades.wizard.fields.buy")
                                                : $t(
                                                      "trades.wizard.fields.sell",
                                                  )}
                                        </span>
                                    </div>
                                    <p
                                        class="text-[9px] text-primary/80 font-bold uppercase tracking-tighter"
                                    >
                                        {$t("trades.wizard.fields.entry")}:
                                        <span
                                            class="text-foreground font-mono font-bold"
                                            >{formData.entry_price}</span
                                        >
                                        |
                                        <span
                                            class="text-primary font-mono font-bold"
                                            >{formData.quantity}
                                            {$t(
                                                "trades.wizard.unit_labels.contracts",
                                            )}</span
                                        >
                                        {#if calculationResult.totalEntryQty > formData.quantity}
                                            <span class="ml-2 text-primary/60">
                                                / {$t("trades.wizard.fields.average").toUpperCase()}: <span
                                                    class="text-foreground font-mono font-bold"
                                                    >{(
                                                        formData.entry_price ||
                                                        0
                                                    ).toLocaleString(
                                                        $locale || "pt-BR",
                                                        {
                                                            minimumFractionDigits: 2,
                                                        },
                                                    )}</span
                                                >
                                            </span>
                                        {/if}
                                    </p>
                                </div>
                            </div>
                            <div class="w-full md:w-auto text-right">
                                <p
                                    class="text-[9px] text-muted-foreground uppercase font-bold tracking-widest"
                                >
                                    {$t("trades.wizard.summary.net_result")}
                                </p>
                                <h3
                                    class="text-2xl font-black {calculationResult.netCurrency >=
                                    0
                                        ? 'text-emerald-400'
                                        : 'text-red-400'}"
                                >
                                    {#if calculationResult.assetType?.result_type === "points"}
                                        {calculationResult.netPoints.toLocaleString(
                                            $locale || "pt-BR",
                                            { maximumFractionDigits: 2 },
                                        )}
                                        <span
                                            class="text-xs uppercase font-bold text-muted-foreground mr-1"
                                            >{$t("trades.wizard.units.points")}</span
                                        >
                                        <span
                                            class="text-xs text-muted-foreground font-medium block md:inline md:ml-2"
                                        >
                                            {calculationResult.currencySymbol}
                                            {calculationResult.netCurrency.toLocaleString(
                                                $locale || "pt-BR",
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </span>
                                    {:else}
                                        {calculationResult.currencySymbol}
                                        {calculationResult.netCurrency.toLocaleString(
                                            $locale || "pt-BR",
                                            { minimumFractionDigits: 2 },
                                        )}
                                    {/if}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            {:else if currentStep === 3}
                <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <!-- Psychology Section -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 border-b border-border/40 pb-2">
                            <Brain class="w-3.5 h-3.5 text-indigo-400" />
                            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                {$t("trades.wizard.sections.psychology_analysis")}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SystemInput 
                                multiline={true}
                                label={$t("trades.wizard.fields.entry_rationale")}
                                bind:value={formData.entry_rationale}
                                placeholder={$t("trades.wizard.placeholders.rationale")}
                                class="min-h-[80px]"
                            />
                            <SystemInput 
                                multiline={true}
                                label={$t("trades.wizard.fields.confirmation_signals")}
                                bind:value={formData.confirmation_signals}
                                placeholder={$t("trades.wizard.placeholders.signals")}
                                class="min-h-[80px]"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SystemInput 
                                multiline={true}
                                label={$t("trades.wizard.fields.market_context")}
                                bind:value={formData.market_context}
                                placeholder={$t("trades.wizard.placeholders.context")}
                                class="min-h-[120px]"
                            />
                            <SystemInput 
                                multiline={true}
                                label={$t("trades.wizard.fields.improvements")}
                                bind:value={formData.mistakes_improvements}
                                placeholder={$t("trades.wizard.placeholders.improvements")}
                                class="min-h-[120px]"
                            />
                        </div>

                        <!-- Intensity Range (Premium Style) -->
                        <div class="pt-8 border-t border-border">
                            <div class="flex items-center justify-between mb-8">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <TrendingUp class="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <span class="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/80">{$t("trades.wizard.emotions.intensity_label")}</span>
                                        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">{$t("trades.wizard.emotions.intensity_hint")}</p>
                                    </div>
                                </div>
                                <div class="text-3xl font-black text-primary font-mono tabular-nums">
                                    {formData.intensity.toString().padStart(2, '0')}
                                </div>
                            </div>

                            <div class="relative px-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    bind:value={formData.intensity}
                                    class="w-full h-2 bg-muted/20 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all shadow-inner"
                                />
                                <div class="flex justify-between mt-4">
                                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{$t("trades.wizard.emotions.light")}</span>
                                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{$t("trades.wizard.emotions.moderate")}</span>
                                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{$t("trades.wizard.emotions.extreme")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {:else if currentStep === 4}
                <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <!-- Media Section -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 border-b border-border/40 pb-2">
                            <Camera class="w-3.5 h-3.5 text-indigo-400" />
                            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                {$t("trades.wizard.sections.visual_evidence.title")}
                            </span>
                        </div>

                        <div class="text-center py-8 bg-muted/5 rounded-[1.5rem] border border-dashed border-border/50">
                            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-6">
                                {$t("trades.wizard.placeholders.visual_desc")}
                            </p>
                            <div class="max-w-xl mx-auto">
                                <ImageUploader bind:images={formData.images} />
                            </div>
                        </div>
                    </div>
                </div>
            {:else if currentStep === 5}
                <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <!-- Review Section -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 border-b border-border/40 pb-2">
                            <ShieldCheck class="w-3.5 h-3.5 text-indigo-400" />
                            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                {$t("trades.wizard.sections.final_summary")}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="space-y-1.5">
                                <span class="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-3">
                                    {$t("trades.wizard.fields.asset_direction")}
                                </span>
                                <div class="h-9 bg-muted/5 rounded-full border border-border px-4 flex items-center justify-between">
                                    <span class="text-[11px] font-black">{formData.asset}</span>
                                    <span class="text-[9px] font-black uppercase tracking-widest {formData.direction === 'buy' ? 'text-emerald-500' : 'text-rose-500'}">
                                        {formData.direction === 'buy' ? $t("trades.wizard.fields.buy") : $t("trades.wizard.fields.sell")}
                                    </span>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <span class="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-3">
                                    {$t("trades.wizard.summary.net_result")}
                                </span>
                                <div class="h-9 bg-muted/5 rounded-full border border-border px-4 flex items-center justify-end">
                                    <span class="text-[11px] font-black tabular-nums {calculationResult.netCurrency >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                                        {#if calculationResult.assetType?.result_type === "points"}
                                            {calculationResult.netPoints.toLocaleString($locale || "pt-BR", { maximumFractionDigits: 2 })} pts
                                        {:else}
                                            {calculationResult.currencySymbol} {calculationResult.netCurrency.toLocaleString($locale || "pt-BR", { minimumFractionDigits: 2 })}
                                        {/if}
                                    </span>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <span class="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-3">
                                    {$t("trades.wizard.fields.strategy")}
                                </span>
                                <div class="h-9 bg-muted/5 rounded-full border border-border px-4 flex items-center truncate">
                                    <span class="text-[11px] font-black truncate">
                                        {workspaceStore.strategies.find(s => s.id === formData.strategy_id)?.name || "N/A"}
                                    </span>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <span class="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-3">
                                    {$t("trades.wizard.fields.date_time")}
                                </span>
                                <div class="h-9 bg-muted/5 rounded-full border border-border px-4 flex items-center gap-2">
                                    <Calendar class="w-3 h-3 text-muted-foreground/40" />
                                    <span class="text-[11px] font-black">
                                        {new Date(formData.entry_date).toLocaleDateString($locale || "pt-BR")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Calculation Memory (Institutional Style) -->
                        <div class="pt-6 border-t border-border/40">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                <span class="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                    {$t("trades.wizard.sections.calc_memory")}
                                </span>
                            </div>

                            <div class="space-y-1.5">
                                {#each calculationResult.memoryItems as item}
                                    <div class="group h-10 bg-muted/5 rounded-xl border border-border px-4 flex items-center justify-between transition-all hover:bg-muted/10 hover:border-indigo-500/20">
                                        <div class="flex items-center gap-3">
                                            <div class="w-1.5 h-1.5 rounded-full {item.type === 'addition' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'}"></div>
                                            <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <span class="text-[11px] font-black font-mono tabular-nums {item.resultCurrency >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                                                {item.resultPoints >= 0 ? "+" : ""}{item.resultPoints.toLocaleString($locale || "pt-BR", { maximumFractionDigits: 2 })}
                                            </span>
                                            <span class="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">
                                                {calculationResult.currencySymbol} {Math.abs(item.resultCurrency).toLocaleString($locale || "pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                            </div>

                                <div class="flex flex-col gap-4 pt-8 mt-4 border-t border-border/50">
                                    <div class="flex justify-between items-center px-6">
                                        <div class="flex items-center gap-3">
                                            <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/20"></div>
                                            <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{$t("trades.wizard.summary.gross_result")}</span>
                                        </div>
                                        <span class="text-[13px] font-black font-mono tabular-nums">
                                            {calculationResult.currencySymbol} {calculationResult.grossCurrency.toLocaleString($locale || "pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div class="flex justify-between items-center px-6">
                                        <div class="flex items-center gap-3">
                                            <div class="w-1.5 h-1.5 rounded-full bg-rose-500/20"></div>
                                            <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{$t("trades.wizard.summary.exchange_fees")}</span>
                                        </div>
                                        <span class="text-[13px] font-black font-mono tabular-nums text-rose-400">
                                            - {calculationResult.currencySymbol} {(calculationResult.fees || 0).toLocaleString($locale || "pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Extra Stats -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border">
                            <div class="p-4 rounded-[1rem] bg-muted/10 border border-border/50 flex flex-col gap-1 transition-all hover:bg-muted/20">
                                <span class="text-[8px] text-muted-foreground/40 uppercase font-black tracking-[0.3em]">
                                    {$t("trades.wizard.summary.images")}
                                </span>
                                <span class="text-xl font-black text-foreground tabular-nums">
                                    {formData.images.length}
                                </span>
                            </div>
                            
                            <div class="p-4 rounded-[1rem] bg-muted/10 border border-border/50 flex flex-col gap-1 transition-all hover:bg-muted/20">
                                <span class="text-[8px] text-muted-foreground/40 uppercase font-black tracking-[0.3em]">
                                    {$t("trades.wizard.fields.followed_plan")}
                                </span>
                                <div class="flex items-center gap-3">
                                    <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest {formData.followed_plan ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} border">
                                        {formData.followed_plan ? $t("trades.wizard.summary.s") : $t("trades.wizard.summary.n")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
        </div>
    </div>

    <!-- Institutional Footer -->
    <div class="p-6 bg-muted/5 border-t border-border flex items-center justify-between sticky bottom-0 z-20 backdrop-blur-xl">
        <div class="flex items-center gap-2">
            {#if currentStep > 1}
                <Button 
                    variant="ghost" 
                    class="rounded-full h-10 px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/10 flex items-center gap-2"
                    onclick={handlePrev}
                >
                    <ChevronLeft class="w-3.5 h-3.5" />
                    {$t("trades.wizard.summary.prev")}
                </Button>
            {:else}
                <Button 
                    variant="ghost" 
                    class="rounded-full h-10 px-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/10"
                    onclick={close}
                >
                    {$t("common.cancel")}
                </Button>
            {/if}
        </div>

        <div class="flex items-center gap-3">
            {#if currentStep < steps.length}
                <Button 
                    onclick={handleNext}
                    class="rounded-full px-10 h-10 text-[9px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                    {$t("trades.wizard.summary.next")}
                </Button>
            {:else}
                <Button 
                    disabled={isSubmitting}
                    onclick={handleSubmit}
                    class="rounded-full px-12 h-10 text-[9px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    {#if isSubmitting}
                        <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                        {$t("trades.wizard.summary.saving")}
                    {:else}
                        <Save class="w-3.5 h-3.5" />
                        {$t("trades.wizard.summary.finish")}
                    {/if}
                </Button>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Make native calendar picker transparent and fill the input area to ensure clickability */
    :global(input[type="datetime-local"]::-webkit-calendar-picker-indicator) {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        cursor: pointer;
        background: transparent !important;
        color: transparent !important;
        appearance: none !important;
    }
</style>

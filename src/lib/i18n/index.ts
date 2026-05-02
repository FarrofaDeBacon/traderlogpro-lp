import { register, init, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';

// Helper: safe merge objects and detect key collisions explicitly
function safeMerge(language: string, ...modules: Record<string, any>[]) {
    const target: Record<string, any> = {};
    for (const module of modules) {
        // Handle Vite's .default JSON export
        const dict = module.default || module;
        for (const [key, value] of Object.entries(dict)) {
            // Collision Detection
            if (key in target) {
                const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
                if (isDev) {
                    console.warn(`[i18n WARNING] Namespace Collision Detected in ${language}! Top-level key "${key}" already exists. Overwriting...`);
                }
            }
            target[key] = value;
        }
    }
    return target;
}

export const setupI18n = async () => {
    // 1. Scalability Prep: Structured Imports
    // Future lazy loading by domain can replace this block using proxies or dynamic imports based on active route
    
    // PT-BR Modules
    register('pt-BR', async () => {
        const modules = await Promise.all([
            import('./locales/pt-BR/common.json'),
            import('./locales/pt-BR/filters.json'),
            import('./locales/pt-BR/help.json'),
            import('./locales/pt-BR/license.json'),
            import('./locales/pt-BR/navigation.json'),
            import('./locales/pt-BR/dashboard.json'),
            import('./locales/pt-BR/trades.json'),
            import('./locales/pt-BR/risk.json'),
            import('./locales/pt-BR/reports.json'),
            import('./locales/pt-BR/settings.json'),
            import('./locales/pt-BR/onboarding.json'),
            import('./locales/pt-BR/ai.json'),
            import('./locales/pt-BR/fiscal.json'),
            import('./locales/pt-BR/auth.json'),
            import('./locales/pt-BR/analysis.json'),
            import('./locales/pt-BR/strategies.json'),
            import('./locales/pt-BR/indicators.json'),
            import('./locales/pt-BR/timeframes.json'),
            import('./locales/pt-BR/chart-types.json'),
            import('./locales/pt-BR/tags.json'),
            import('./locales/pt-BR/emotional-states.json'),
            import('./locales/pt-BR/assets.json'),
            import('./locales/pt-BR/sectors.json'),
            import('./locales/pt-BR/modalities.json'),
            import('./locales/pt-BR/fees.json'),
            import('./locales/pt-BR/currencies.json'),
            import('./locales/pt-BR/markets.json'),
            import('./locales/pt-BR/accounts.json'),
            import('./locales/pt-BR/finance.json'),
            import('./locales/pt-BR/psychology.json')
        ]);
        return safeMerge('pt-BR', ...modules);
    });

    // EN-US Modules
    register('en-US', async () => {
        const modules = await Promise.all([
            import('./locales/en-US/common.json'),
            import('./locales/en-US/filters.json'),
            import('./locales/en-US/help.json'),
            import('./locales/en-US/license.json'),
            import('./locales/en-US/navigation.json'),
            import('./locales/en-US/dashboard.json'),
            import('./locales/en-US/trades.json'),
            import('./locales/en-US/risk.json'),
            import('./locales/en-US/reports.json'),
            import('./locales/en-US/settings.json'),
            import('./locales/en-US/onboarding.json'),
            import('./locales/en-US/ai.json'),
            import('./locales/en-US/fiscal.json'),
            import('./locales/en-US/auth.json'),
            import('./locales/en-US/analysis.json'),
            import('./locales/en-US/strategies.json'),
            import('./locales/en-US/indicators.json'),
            import('./locales/en-US/timeframes.json'),
            import('./locales/en-US/chart-types.json'),
            import('./locales/en-US/tags.json'),
            import('./locales/en-US/emotional-states.json'),
            import('./locales/en-US/assets.json'),
            import('./locales/en-US/sectors.json'),
            import('./locales/en-US/modalities.json'),
            import('./locales/en-US/fees.json'),
            import('./locales/en-US/currencies.json'),
            import('./locales/en-US/markets.json'),
            import('./locales/en-US/accounts.json'),
            import('./locales/en-US/finance.json'),
            import('./locales/en-US/psychology.json')
        ]);
        return safeMerge('en-US', ...modules);
    });

    // ES-ES Modules
    register('es-ES', async () => {
        const modules = await Promise.all([
            import('./locales/es-ES/common.json'),
            import('./locales/es-ES/filters.json'),
            import('./locales/es-ES/help.json'),
            import('./locales/es-ES/license.json'),
            import('./locales/es-ES/navigation.json'),
            import('./locales/es-ES/dashboard.json'),
            import('./locales/es-ES/trades.json'),
            import('./locales/es-ES/risk.json'),
            import('./locales/es-ES/reports.json'),
            import('./locales/es-ES/settings.json'),
            import('./locales/es-ES/onboarding.json'),
            import('./locales/es-ES/ai.json'),
            import('./locales/es-ES/fiscal.json'),
            import('./locales/es-ES/auth.json'),
            import('./locales/es-ES/analysis.json'),
            import('./locales/es-ES/strategies.json'),
            import('./locales/es-ES/indicators.json'),
            import('./locales/es-ES/timeframes.json'),
            import('./locales/es-ES/chart-types.json'),
            import('./locales/es-ES/tags.json'),
            import('./locales/es-ES/emotional-states.json'),
            import('./locales/es-ES/assets.json'),
            import('./locales/es-ES/sectors.json'),
            import('./locales/es-ES/modalities.json'),
            import('./locales/es-ES/fees.json'),
            import('./locales/es-ES/currencies.json'),
            import('./locales/es-ES/markets.json'),
            import('./locales/es-ES/accounts.json'),
            import('./locales/es-ES/finance.json'),
            import('./locales/es-ES/psychology.json')
        ]);
        return safeMerge('es-ES', ...modules);
    });

    // FR-FR Modules
    register('fr-FR', async () => {
        const modules = await Promise.all([
            import('./locales/fr-FR/common.json'),
            import('./locales/fr-FR/filters.json'),
            import('./locales/fr-FR/help.json'),
            import('./locales/fr-FR/license.json'),
            import('./locales/fr-FR/navigation.json'),
            import('./locales/fr-FR/dashboard.json'),
            import('./locales/fr-FR/trades.json'),
            import('./locales/fr-FR/risk.json'),
            import('./locales/fr-FR/reports.json'),
            import('./locales/fr-FR/settings.json'),
            import('./locales/fr-FR/onboarding.json'),
            import('./locales/fr-FR/ai.json'),
            import('./locales/fr-FR/fiscal.json'),
            import('./locales/fr-FR/auth.json'),
            import('./locales/fr-FR/analysis.json'),
            import('./locales/fr-FR/strategies.json'),
            import('./locales/fr-FR/indicators.json'),
            import('./locales/fr-FR/timeframes.json'),
            import('./locales/fr-FR/chart-types.json'),
            import('./locales/fr-FR/tags.json'),
            import('./locales/fr-FR/emotional-states.json'),
            import('./locales/fr-FR/assets.json'),
            import('./locales/fr-FR/sectors.json'),
            import('./locales/fr-FR/modalities.json'),
            import('./locales/fr-FR/fees.json'),
            import('./locales/fr-FR/currencies.json'),
            import('./locales/fr-FR/markets.json'),
            import('./locales/fr-FR/accounts.json'),
            import('./locales/fr-FR/finance.json'),
            import('./locales/fr-FR/psychology.json')
        ]);
        return safeMerge('fr-FR', ...modules);
    });

    const browser = typeof window !== 'undefined';
    const rawLocale = browser
        ? window.localStorage.getItem('locale') || getLocaleFromNavigator() || 'pt-BR'
        : 'pt-BR';
    
    // Compatibility Fix: map old 'en' to 'en-US'
    const initialLocale = rawLocale === 'en' ? 'en-US' : rawLocale;

    init({
        fallbackLocale: 'pt-BR',
        initialLocale,
    });

    if (browser) {
        await waitLocale();
    }
};

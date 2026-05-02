import { fetch } from "@tauri-apps/plugin-http";
import { integrationsStore } from "$lib/stores/integrations.svelte";

// Phase 26: AI Cache Hash Map
const aiCache = new Map<string, { timestamp: number, payload: any, responseTime: number }>();

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export interface EconomicEvent {
    time: string;
    currency: string;
    event: string;
    importance: 'high' | 'medium' | 'low';
}

interface GeminiModel {
    ver: string;
    model: string;
}

export const llmService = {
    // --- Shared Utilities ---

    // Phase 26: Available models cache
    viableModelsCache: [] as GeminiModel[],

    /**
     * Dynamically discovers which Gemini models are available for the given API Key.
     * Prevents 404/403 errors when hardcoded model names don't exist in the user's region/account.
     */
    async getViableGeminiModels(apiKey: string): Promise<GeminiModel[]> {
        // Return cached list if available
        if (this.viableModelsCache.length > 0) return this.viableModelsCache;

        const trimmedKey = apiKey.trim();
        try {
            const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`;
            const listResp = await fetch(listModelsUrl);

            if (listResp.ok) {
                const listData = await listResp.json();
                const availableModels = listData.models || [];

                // Filter for 'gemini' models that support 'generateContent'
                const viable = availableModels
                    .filter((m: any) =>
                        m.name.includes("gemini") && 
                        m.supportedGenerationMethods?.includes("generateContent")
                    )
                    .map((m: any) => ({
                        ver: "v1beta",
                        model: m.name.replace("models/", "")
                    }));

                // Prioritize Flash for speed/cost, then Pro
                viable.sort((a, b) => {
                    const aFlash = a.model.includes("flash");
                    const bFlash = b.model.includes("flash");
                    if (aFlash && !bFlash) return -1;
                    if (!aFlash && bFlash) return 1;
                    return 0;
                });

                if (viable.length > 0) {
                    this.viableModelsCache = viable.slice(0, 3);
                    return this.viableModelsCache;
                }
            }
        } catch (e) {
            console.warn("[LLM Service] Failed to list models:", e);
        }

        // Fallback if list fails
        return [
            { ver: "v1beta", model: "gemini-1.5-flash" },
            { ver: "v1beta", model: "gemini-1.5-pro" }
        ];
    },

    /**
     * Executes a prompt using a list of models with automatic fallback.
     */
    async executeGeminiPrompt(apiKey: string, prompt: string, options: { jsonMode?: boolean, temperature?: number } = {}): Promise<string> {
        const models = await this.getViableGeminiModels(apiKey);
        let lastError = "Nenhum modelo disponível";

        for (const { ver, model } of models) {
            try {
                const ENDPOINT = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${apiKey.trim()}`;
                
                const body: any = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options.temperature ?? 0.7
                    }
                };

                if (options.jsonMode) {
                    body.generationConfig.responseMimeType = "application/json";
                }

                const response = await fetch(ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                } else {
                    const errData = await response.json().catch(() => ({}));
                    lastError = errData.error?.message || `HTTP ${response.status}`;
                    
                    if (response.status === 403 || response.status === 401) {
                        throw new Error(`API Key Inválida ou Sem Permissão: ${lastError}`);
                    }
                    if (response.status === 429) {
                        throw new Error(`Limite de cota excedido (Rate Limit). Aguarde um momento.`);
                    }
                }
            } catch (e: any) {
                console.warn(`[LLM Service] Model ${model} failed:`, e.message);
                lastError = e.message;
                if (e.message.includes("Inválida") || e.message.includes("cota")) throw e;
            }
        }

        throw new Error(lastError);
    },

    // --- High Level Functions ---

    async analyzeJournal(content: string, emotion: string, intensity: number): Promise<string> {
        const configId = integrationsStore.psychologyApiId;
        const config = integrationsStore.apiConfigs.find(c => c.id === configId && c.enabled)
                    || integrationsStore.apiConfigs.find(c => (c.provider === 'openai' || c.provider === 'google_gemini') && c.enabled);

        if (!config || !config.api_key) return "Configure uma chave de API para análise.";

        const prompt = `
            Você é um psicólogo especializado em trading (Mental Game Coach).
            Analise este registro:
            Emoção: ${emotion} (Intensidade: ${intensity}/10)
            Relato: "${content}"
            1. Valide a emoção. 2. Identifique vieses. 3. Dê uma dica prática.
            Responda em Português, tom profissional e próximo.
        `;

        if (config.provider === 'google_gemini') {
            try {
                return await this.executeGeminiPrompt(config.api_key, prompt);
            } catch (e: any) { return `Erro Gemini: ${e.message}`; }
        }

        if (config.provider === 'openai') {
            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.api_key.trim()}` },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: prompt }]
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    return data.choices?.[0]?.message?.content || "Sem resposta.";
                }
            } catch (e) { return "Erro API OpenAI"; }
        }

        return "Modo Simulação.";
    },

    async generatePsychologyInsight(periodStr: string, metricsPayload: any): Promise<any> {
        const payloadStr = JSON.stringify(metricsPayload);
        const cacheKey = `psyc_${periodStr}_${simpleHash(payloadStr)}`;
        if (aiCache.has(cacheKey)) return aiCache.get(cacheKey)!.payload;

        const config = integrationsStore.apiConfigs.find(c => c.enabled && (c.provider === 'openai' || c.provider === 'google_gemini'));
        if (!config || !config.api_key) throw new Error("API não configurada.");

        const prompt = `Aja como um mentor quantitativo. Analise estes dados (${periodStr}): ${payloadStr}. 
        Retorne APENAS um JSON: { "dominantPattern": string, "majorRisk": string, "practicalActions": string[] }`;

        let raw = "";
        const startTime = performance.now();

        if (config.provider === 'google_gemini') {
            raw = await this.executeGeminiPrompt(config.api_key, prompt, { jsonMode: true, temperature: 0.2 });
        } else {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.api_key.trim()}` },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                    messages: [{ role: "user", content: prompt }]
                })
            });
            if (response.ok) {
                const data = await response.json();
                raw = data.choices?.[0]?.message?.content || "{}";
            }
        }

        try {
            const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
            const result = { ...parsed, _meta: { responseTimeMs: Math.round(performance.now() - startTime), origin: "network" } };
            aiCache.set(cacheKey, { timestamp: Date.now(), payload: result, responseTime: result._meta.responseTimeMs });
            return result;
        } catch (e) { throw new Error("IA retornou formato inválido."); }
    },

    async generateStrategyInsight(strategyId: string, periodStr: string, metricsPayload: any): Promise<any> {
        const payloadStr = JSON.stringify(metricsPayload);
        const cacheKey = `strat_${strategyId}_${periodStr}_${simpleHash(payloadStr)}`;
        if (aiCache.has(cacheKey)) return aiCache.get(cacheKey)!.payload;

        const prompt = `Analise a estratégia ${strategyId} no período ${periodStr}: ${payloadStr}. 
        Retorne JSON: { "performanceInterpretation": string, "idealContext": string, "criticalWeakness": string }`;

        const config = integrationsStore.apiConfigs.find(c => c.enabled && (c.provider === 'openai' || c.provider === 'google_gemini'));
        if (!config || !config.api_key) throw new Error("API não configurada.");

        let raw = "";
        const startTime = performance.now();

        if (config.provider === 'google_gemini') {
            raw = await this.executeGeminiPrompt(config.api_key, prompt, { jsonMode: true, temperature: 0.1 });
        } else {
            raw = "{}";
        }

        try {
            const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
            const result = { ...parsed, _meta: { responseTimeMs: Math.round(performance.now() - startTime), origin: "network" } };
            aiCache.set(cacheKey, { timestamp: Date.now(), payload: result, responseTime: result._meta.responseTimeMs });
            return result;
        } catch (e) { throw new Error("IA retornou formato inválido."); }
    },

    async generateReportInsight(periodStr: string, metricsPayload: any): Promise<any> {
        const payloadStr = JSON.stringify(metricsPayload);
        const cacheKey = `repo_${periodStr}_${simpleHash(payloadStr)}`;
        if (aiCache.has(cacheKey)) return aiCache.get(cacheKey)!.payload;

        const config = integrationsStore.apiConfigs.find(c => c.enabled && (c.provider === 'openai' || c.provider === 'google_gemini'));
        if (!config || !config.api_key) throw new Error("API não configurada.");

        const prompt = `Analise este extrato executivo (${periodStr}): ${payloadStr}. 
        Retorne JSON: { "executiveSummary": string, "majorEdge": string, "majorFragility": string, "nextWindowFocus": string }`;

        let raw = "";
        const startTime = performance.now();

        if (config.provider === 'google_gemini') {
            raw = await this.executeGeminiPrompt(config.api_key, prompt, { jsonMode: true });
        } else {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.api_key.trim()}` },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                    messages: [{ role: "user", content: prompt }]
                })
            });
            if (response.ok) {
                const data = await response.json();
                raw = data.choices?.[0]?.message?.content || "{}";
            }
        }

        try {
            const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
            const result = { ...parsed, _meta: { responseTimeMs: Math.round(performance.now() - startTime), origin: "network" } };
            aiCache.set(cacheKey, { timestamp: Date.now(), payload: result, responseTime: result._meta.responseTimeMs });
            return result;
        } catch (e) { throw new Error("IA retornou formato inválido."); }
    },

    async analyzePsychologyDashboard(payloadJson: string): Promise<string> {
        const config = integrationsStore.apiConfigs.find(c => c.enabled && (c.provider === 'openai' || c.provider === 'google_gemini'));
        if (!config || !config.api_key) throw new Error("API não configurada.");

        const prompt = `Analise estes dados de psicologia: ${payloadJson}. 
        Forneça um diagnóstico curto e 2 dicas práticas. Use Markdown.`;

        if (config.provider === 'google_gemini') {
            return await this.executeGeminiPrompt(config.api_key, prompt);
        } else {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.api_key.trim()}` },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }]
                })
            });
            if (response.ok) {
                const data = await response.json();
                return data.choices?.[0]?.message?.content || "Sem resposta.";
            }
        }
        return "Erro na análise.";
    },

    async extractEconomicEvents(html: string): Promise<EconomicEvent[]> {
        const config = integrationsStore.apiConfigs.find(c => c.enabled && c.provider === 'google_gemini');
        if (!config || !config.api_key) throw new Error("Gemini Key missing.");

        const prompt = `Analise o HTML abaixo e extraia eventos econômicos. 
        REGRAS: 
        1. TIME: Formato HH:MM (procure XX:XX na linha). 
        2. CURRENCY: USD, BRL, etc. 
        3. IMPORTANCE: high, medium, low. 
        4. EVENT: Nome do indicador.
        
        HTML: ${html.substring(0, 30000)}
        
        Retorne JSON Array: [{"time":string,"currency":string,"event":string,"importance":"high"|"medium"|"low"}]`;
        
        const raw = await this.executeGeminiPrompt(config.api_key, prompt, { jsonMode: true });
        const jsonStr = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    }
};


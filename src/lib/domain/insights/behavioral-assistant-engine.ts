import type { Trade } from "$lib/types";
import type { GamificationStreaks, ScoreBreakdown } from "../stats/gamification-engine";
import { parseISO, isSameDay } from "date-fns";
import { getLocalDatePart } from "$lib/utils";

export interface ProactiveSignal {
    id: string;
    type: 'warning' | 'reminder' | 'opportunity';
    title: string; // Fallback title
    message: string; // Fallback message
    key?: string; // i18n key
    params?: Record<string, any>; // i18n params
    priority: number; // Higher = More urgent
}

export interface AssistantState {
    trades: Trade[];
    breakdown: ScoreBreakdown;
    streaks: GamificationStreaks;
}

export function getProactiveSignals(state: AssistantState): ProactiveSignal[] {
    const signals: ProactiveSignal[] = [];
    const { breakdown, streaks } = state;

    if (!breakdown || !streaks) return [];

    // --- ZONA DE PERIGO (WARNINGS) --- //
    // 1. Master Score Colapsado
    if (breakdown.stats.score < 40) {
        signals.push({
            id: 'critical_score',
            type: 'warning',
            title: 'Critical Performance',
            message: 'Your Score has dropped severely. The market does not forgive inattention. Protect your capital by cutting sizes or taking some time off.',
            key: 'psychology.assistant.signals.critical_score',
            priority: 100
        });
    }

    // 2. Traços de Tilt Baseado nos Impactos Diretos
    const worstImpact = breakdown.impacts.find(i => i.points <= -15);
    if (worstImpact) {
        signals.push({
            id: 'severe_impact_detected',
            type: 'warning',
            title: worstImpact.title || 'Severe Impact Detected',
            message: `We detected a heavy failure in your system (Penalty: ${worstImpact.points} pts). Total focus on not repeating this mistake today.`,
            key: 'psychology.assistant.signals.severe_impact_detected',
            params: { points: Math.abs(worstImpact.points) },
            priority: 95
        });
    }

    // 3. Emoções Prejudiciais Operando
    const emotionalImpact = breakdown.impacts.find(i => i.id.startsWith('emo_'));
    if (emotionalImpact && streaks.emotionalControlStreak === 0) {
        signals.push({
            id: 'broken_emotional_control',
            type: 'warning',
            title: 'Recent Emotional Break',
            message: 'Your emotions recently cost Score points. Remember: there is no profit without self-control. Breathe before the click.',
            key: 'psychology.assistant.signals.broken_emotional_control',
            priority: 90
        });
    }


    // --- ZONA DE REFORÇO / ALERTA GERAL (REMINDERS) --- //
    // 4. Excesso de Lucro (Excesso de Confiança)
    if (streaks.greenStreak >= 3) {
        signals.push({
            id: 'overconfidence_reminder',
            type: 'reminder',
            title: 'Beware of Overconfidence',
            message: `You are coming off ${streaks.greenStreak} profit days (Green Streak). The market will try to take it back. Keep lots constant.`,
            key: 'psychology.assistant.signals.overconfidence_reminder',
            params: { count: streaks.greenStreak },
            priority: 80
        });
    }

    // 5. Disciplina Quebrada
    if (streaks.disciplineStreak === 0 && breakdown.stats.score >= 40 && !worstImpact) {
        signals.push({
            id: 'discipline_rebuild',
            type: 'reminder',
            title: 'Rebuild Discipline',
            message: 'Breaking discipline leaves silent wounds. Make setup protection your main goal today.',
            key: 'psychology.assistant.signals.discipline_rebuild',
            priority: 75
        });
    }

    // 6. Impactos Médios (Warnings) do Motor Comportamental
    const mediumImpact = breakdown.impacts.find(i => i.type === 'negative' && i.points > -15 && i.points <= -5 && !i.id.startsWith('emo_'));
    if (mediumImpact) {
        signals.push({
            id: 'medium_impact_reminder',
            type: 'reminder',
            title: mediumImpact.title || 'Operational Attention',
            message: (mediumImpact.description || '').substring(0, 100) + '...',
            key: 'psychology.assistant.signals.medium_impact_reminder',
            params: { description: mediumImpact.description },
            priority: 70
        });
    }

    // --- ZONA DE EXCELÊNCIA (OPPORTUNITIES) --- //
    // 7. Master em Execução Financeira
    if (breakdown.stats.executionScore >= 80) {
        signals.push({
            id: 'execution_mastery',
            type: 'opportunity',
            title: 'Execution Mastery',
            message: 'With sharp WR and PF, you found your mathematical Edge. Repeat the process perfectly. No inventions today.',
            key: 'psychology.assistant.signals.execution_mastery',
            priority: 65
        });
    }

    // 8. Domínio Emocional Sustentado
    if (streaks.emotionalControlStreak >= 5) {
        signals.push({
            id: 'emotional_zen',
            type: 'opportunity',
            title: 'Ice Cold Trader',
            message: `${streaks.emotionalControlStreak} days keeping healthy emotions in the record. You are gaining armor.`,
            key: 'psychology.assistant.signals.emotional_zen',
            params: { count: streaks.emotionalControlStreak },
            priority: 60
        });
    }
    
    // 9. Edge Mapeado (Positivos Menores)
    const positiveImpact = breakdown.impacts.find(i => i.type === 'positive' && i.id.startsWith('pos_'));
    if (positiveImpact) {
        signals.push({
            id: 'positive_edge',
            type: 'opportunity',
            title: 'Mapped Opportunity',
            message: positiveImpact.description || 'Winning pattern detected.',
            key: 'psychology.assistant.signals.positive_edge',
            params: { description: positiveImpact.description },
            priority: 55
        });
    }

    // Se nenhum sinal, adiciona um reminder neutro
    if (signals.length === 0) {
        signals.push({
            id: 'neutral_consistency',
            type: 'reminder',
            title: 'Daily Construction',
            message: 'Your operational is balanced. Remember to respect the daily loss limits set in the Risk center.',
            key: 'psychology.assistant.signals.neutral_consistency',
            priority: 10
        });
    }

    // Filtra duplicatas por ID para segurança
    const uniqueSignals = Array.from(new Map(signals.map(s => [s.id, s])).values());

    // Sorting by priority highest to lowest
    const sorted = uniqueSignals.sort((a, b) => b.priority - a.priority);

    // Regra: "máximo 2 sinais ativos"
    return sorted.slice(0, 2);
}


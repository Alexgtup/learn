/**
 * Алгоритм интервальных повторений (упрощенный SM-2)
 * Рассчитывает следующий интервал повторения на основе качества ответа
 */
// 0-2: Не запомнил, нужно учить заново
// 3: С трудом вспомнил
// 4: Вспомнил правильно
// 5: Легко вспомнил
export function calculateNextRepetition(currentStats, quality) {
    let { interval, repetition, easeFactor } = currentStats;
    // Обновление коэффициента легкости
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    if (quality < 3) {
        // Если ответ плохой, сбрасываем серию и интервал
        repetition = 0;
        interval = 1;
    }
    else {
        // Увеличиваем серию
        repetition += 1;
        // Расчет нового интервала
        if (repetition === 1) {
            interval = 1;
        }
        else if (repetition === 2) {
            interval = 6;
        }
        else {
            interval = Math.round(interval * easeFactor);
        }
    }
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval);
    return {
        interval,
        repetition,
        easeFactor,
        lastReview: now,
        nextReview,
    };
}
export function getInitialStats() {
    return {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        lastReview: null,
        nextReview: null,
    };
}
export function isDueForReview(stats) {
    if (!stats.nextReview)
        return true;
    return new Date() >= stats.nextReview;
}

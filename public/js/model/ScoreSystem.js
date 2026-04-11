/**
 * Updates score, combo, accuracy, and judgement counters. No DOM access.
 */

const SCORE_WEIGHTS = {
    perfect: 100,
    great: 75,
    good: 50,
    miss: 0,
};

export class ScoreSystem {
    /**
     * Apply a judgement result to the mutable GameState.
     *
     * Args:
     *   gameState (import('./GameState.js').GameState): Mutable state.
     *   judgementResult (import('./DataModels.js').JudgementResult): Outcome of a note hit/miss.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    static applyJudgement(gameState, judgementResult) {
        const j = judgementResult.judgement;
        gameState.judgedCount += 1;

        if (j === 'miss') {
            gameState.missCount += 1;
            gameState.combo = 0;
        } else {
            if (j === 'perfect') gameState.perfectCount += 1;
            else if (j === 'great') gameState.greatCount += 1;
            else if (j === 'good') gameState.goodCount += 1;

            gameState.combo += 1;
            if (gameState.combo > gameState.maxCombo) {
                gameState.maxCombo = gameState.combo;
            }
        }

        gameState.score += SCORE_WEIGHTS[j] || 0;
        gameState.lastJudgement = j;

        const total = gameState.judgedCount;
        const weighted =
            gameState.perfectCount * 100 +
            gameState.greatCount * 75 +
            gameState.goodCount * 50;
        gameState.accuracy = total > 0 ? weighted / (total * 100) : 0;
    }
}

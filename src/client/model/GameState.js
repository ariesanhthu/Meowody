/**
 * FILE: GameState.js
 * PURPOSE: Internal canonical model holding current orchestration details.
 */
export class GameState {
    constructor() {
        this.scene = "menu";
        this.isRunning = false;
        this.isPaused = false;
        this.currentTimeMs = 0;
        
        // Match metrics
        this.combo = 0;
        this.maxCombo = 0;
        this.score = 0;
        this.accuracy = 0; // value out of 1.0 or 100
        
        // Judgement counters
        this.judgedCount = 0;
        this.perfectCount = 0;
        this.greatCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        
        this.lastJudgement = null;
    }
}

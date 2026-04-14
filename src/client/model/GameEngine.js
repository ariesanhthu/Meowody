import { JudgementSystem } from './JudgementSystem.js';
import { ScoreSystem } from './ScoreSystem.js';

/** @typedef {import('./DataModels.js').RenderSnapshot} RenderSnapshot */
/** @typedef {import('./DataModels.js').RenderNote} RenderNote */
/** @typedef {import('./DataModels.js').JudgementResult} JudgementResult */

const PX_PER_MS = 0.35;
const RECEPTOR_RADIUS_PX = 40;
const BALL_RADIUS_PX = 24;
const HIT_WINDOW_MS = Math.ceil((RECEPTOR_RADIUS_PX + BALL_RADIUS_PX) / PX_PER_MS);
const MISS_WINDOW_MS = HIT_WINDOW_MS;
const LOOKAHEAD_MS = 2800;
const PAST_HIDE_MS = 400;
const HIT_LINE_BOTTOM_OFFSET = 60;

/**
 * Core gameplay state machine: time from GameClock, notes from Chart.
 * No DOM. No keyboard listeners. No raw .ssc parsing.
 */
export class GameEngine {
    constructor() {
        /** @type {import('./Chart.js').Chart | null} */
        this._chart = null;
        /** @type {import('./GameState.js').GameState | null} */
        this._state = null;
        this._judgement = new JudgementSystem();
    }

    /**
     * Load a normalized chart and reset state.
     *
     * Args:
     *   chartModel (import('./Chart.js').Chart): Canonical chart.
     *   gameState (import('./GameState.js').GameState): Mutable state object.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    loadChart(chartModel, gameState) {
        this._chart = chartModel;
        this._state = gameState;
    }

    /**
     * Advance one frame: mark misses, update time.
     *
     * Args:
     *   currentTimeMs (number): Audio-derived time.
     *
     * Returns:
     *   JudgementResult[] — any newly missed notes.
     *
     * Raises:
     *   None
     */
    tick(currentTimeMs) {
        if (!this._chart || !this._state) return [];
        this._state.currentTimeMs = currentTimeMs;

        const missed = this._chart.markMissedNotes(currentTimeMs, MISS_WINDOW_MS);
        const results = [];
        for (const note of missed) {
            /** @type {JudgementResult} */
            const jr = {
                judgement: 'miss',
                deltaMs: currentTimeMs - note.hitTimeMs,
                noteId: note.id,
                laneIndex: note.laneIndex,
                awardedScore: 0,
                comboAfterHit: 0,
            };
            ScoreSystem.applyJudgement(this._state, jr);
            jr.comboAfterHit = this._state.combo;
            results.push(jr);
        }
        return results;
    }

    /**
     * Handle player lane input: find hittable note, judge, score.
     *
     * Args:
     *   laneIndex (number): Which lane was pressed.
     *   currentTimeMs (number): Audio time at press.
     *
     * Returns:
     *   JudgementResult | null
     *
     * Raises:
     *   None
     */
    handleLaneInput(laneIndex, currentTimeMs) {
        if (!this._chart || !this._state) return null;
        const note = this._chart.getNextHittableNote(laneIndex, currentTimeMs, HIT_WINDOW_MS);
        if (!note) return null;

        const deltaMs = currentTimeMs - note.hitTimeMs;
        let judgement = this._judgement.judge(deltaMs);

        if (judgement === 'miss') judgement = 'good';

        note.status = 'hit';

        /** @type {JudgementResult} */
        const jr = {
            judgement,
            deltaMs,
            noteId: note.id,
            laneIndex: note.laneIndex,
            awardedScore: 0,
            comboAfterHit: 0,
        };

        ScoreSystem.applyJudgement(this._state, jr);
        jr.awardedScore = { perfect: 100, great: 75, good: 50 }[judgement] || 0;
        jr.comboAfterHit = this._state.combo;

        return jr;
    }

    /**
     * Build a render snapshot for the view layer.
     *
     * Args:
     *   currentTimeMs (number): Audio-derived time.
     *
     * Returns:
     *   RenderSnapshot
     *
     * Raises:
     *   None
     */
    getRenderSnapshot(currentTimeMs, playfieldHeight = 600) {
        const hitLineY = playfieldHeight - HIT_LINE_BOTTOM_OFFSET;
        /** @type {RenderNote[]} */
        const visibleNotes = [];

        if (this._chart) {
            for (const note of this._chart.notes) {
                if (note.status !== 'pending') continue;
                const delta = note.hitTimeMs - currentTimeMs;
                if (delta > LOOKAHEAD_MS) continue;
                if (delta < -PAST_HIDE_MS) continue;
                visibleNotes.push({
                    id: note.id,
                    laneIndex: note.laneIndex,
                    y: hitLineY - delta * PX_PER_MS,
                    noteType: note.noteType,
                    isActive: true,
                });
            }
        }

        const s = this._state || {};
        return {
            currentTimeMs,
            visibleNotes,
            score: s.score || 0,
            combo: s.combo || 0,
            accuracy: s.accuracy || 0,
            lastJudgement: s.lastJudgement || null,
            scene: s.scene || 'menu',
        };
    }

    /**
     * Access game state.
     *
     * Args:
     *   None
     *
     * Returns:
     *   import('./GameState.js').GameState
     *
     * Raises:
     *   None
     */
    getState() {
        return this._state;
    }
}

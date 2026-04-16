/**
 * Maps timing delta to a judgement label. Pure / near-pure function — no DOM, no score mutation.
 *
 * Windows are calibrated so pixel distance between ball center and receptor center
 * determines the judgement. With PX_PER_MS = 0.35 and visual receptor radius = 50px:
 *   perfect: distance < 21px  →  60ms
 *   great:   distance < 49px  → 140ms
 *   good:    distance < 79px  → 225ms
 */

import CFG from '../view/gameScreen/GameScreenConfig.js';

/**
 * Maps timing delta to a judgement label based on physical collision logic.
 *
 * Windows are calibrated using the physical distance between ball center and receptor center:
 *   perfect: ball is fully inside the receptor (receptorRadius - ballRadius)
 *   great:   ball center is exactly at receptor edge (receptorRadius)
 *   good:    ball edge is just touching receptor edge (receptorRadius + ballRadius)
 */

const getWindows = () => {
    const pPM = CFG.engine.pxPerMs;
    const rR = CFG.engine.receptorRadiusPx;
    const bR = CFG.engine.ballRadiusPx;
    return [
        { label: 'perfect', maxDeltaMs: Math.ceil(Math.abs(rR - bR) / pPM) },
        { label: 'great',   maxDeltaMs: Math.ceil(rR / pPM) },
        { label: 'good',    maxDeltaMs: Math.ceil((rR + bR) / pPM) },
    ];
};

export class JudgementSystem {
    /**
     * @param {{ label: string, maxDeltaMs: number }[]} [windows]
     */
    constructor(windows) {
        this._windows = windows || getWindows();
    }

    /**
     * Judge a tap based on absolute timing delta.
     *
     * Args:
     *   deltaMs (number): Absolute ms difference between hit time and press time.
     *
     * Returns:
     *   string — 'perfect' | 'great' | 'good' | 'miss'
     *
     * Raises:
     *   None
     */
    judge(deltaMs) {
        const abs = Math.abs(deltaMs);
        for (const w of this._windows) {
            if (abs <= w.maxDeltaMs) return w.label;
        }
        return 'miss';
    }
}

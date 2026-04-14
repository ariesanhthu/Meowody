/**
 * Maps timing delta to a judgement label. Pure / near-pure function — no DOM, no score mutation.
 *
 * Windows are calibrated so pixel distance between ball center and receptor center
 * determines the judgement. With PX_PER_MS = 0.35 and receptor radius = 40px:
 *   perfect: distance < 14px  →  40ms
 *   great:   distance < 28px  →  80ms
 *   good:    distance < 42px  → 120ms
 */

const DEFAULT_WINDOWS = [
    { label: 'perfect', maxDeltaMs: 40 },
    { label: 'great', maxDeltaMs: 80 },
    { label: 'good', maxDeltaMs: 120 },
];

export class JudgementSystem {
    /**
     * @param {{ label: string, maxDeltaMs: number }[]} [windows]
     */
    constructor(windows) {
        this._windows = windows || DEFAULT_WINDOWS;
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

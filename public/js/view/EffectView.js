/**
 * Visual-only effects: judgement text spawn, lane flash, result entrance.
 * Uses Anime.js for animation. Never decides note timing, scoring, or judgement.
 */

const LANE_COLORS = ['#ff3e8e', '#00e5ff', '#39ff14', '#ff9100'];
const JUDGE_COLORS = {
    perfect: '#ffd700',
    great: '#00e5ff',
    good: '#39ff14',
    miss: '#ff5555',
};

export class EffectView {
    constructor() {
        /** @type {HTMLElement | null} */
        this._layer = null;
        this._laneCount = 4;
    }

    /**
     * Create the effects layer inside the playfield.
     *
     * Args:
     *   host (HTMLElement): Playfield wrapper.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    mount(host) {
        this._layer = document.createElement('div');
        this._layer.className = 'effects-layer';
        host.appendChild(this._layer);
    }

    /**
     * Spawn animated judgement text near the hit line for a lane.
     *
     * Args:
     *   laneIndex (number): Lane where the event occurred.
     *   judgement (string): 'perfect' | 'great' | 'good' | 'miss'.
     *   laneCount (number): Total lanes for position calculation.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    spawnJudgement(laneIndex, judgement, laneCount = 4) {
        if (!this._layer || typeof anime === 'undefined') return;

        const el = document.createElement('div');
        el.className = 'judge-fx';
        el.textContent = judgement.toUpperCase();

        const color = JUDGE_COLORS[judgement] || '#fff';
        el.style.color = color;
        el.style.textShadow = `0 0 12px ${color}`;

        const pct = ((laneIndex + 0.5) / laneCount) * 100;
        el.style.left = `${pct}%`;
        el.style.transform = 'translateX(-50%)';
        el.style.bottom = '110px';
        el.style.opacity = '0';

        this._layer.appendChild(el);

        const isMiss = judgement === 'miss';

        anime({
            targets: el,
            opacity: [0, 1, 1, 0],
            translateY: isMiss ? [0, 10] : [0, -28],
            scale: isMiss ? [0.9, 1] : [1.3, 1],
            duration: isMiss ? 500 : 450,
            easing: 'easeOutCubic',
            complete: () => el.remove(),
        });
    }

    /**
     * Flash a lane column (visual-only feedback on key press).
     *
     * Args:
     *   laneIndex (number): Lane to flash.
     *   laneCount (number): Total lanes.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    flashLane(laneIndex, laneCount = 4) {
        if (!this._layer || typeof anime === 'undefined') return;

        const el = document.createElement('div');
        el.className = 'lane-flash';
        const widthPct = 100 / laneCount;
        el.style.width = `${widthPct}%`;
        el.style.left = `${widthPct * laneIndex}%`;
        const color = LANE_COLORS[laneIndex] || '#fff';
        el.style.background = `linear-gradient(0deg, ${color}22 0%, transparent 60%)`;

        this._layer.appendChild(el);

        anime({
            targets: el,
            opacity: [0.6, 0],
            duration: 200,
            easing: 'easeOutQuad',
            complete: () => el.remove(),
        });
    }

    /**
     * Animate result panel entrance.
     *
     * Args:
     *   panelEl (HTMLElement): The result panel to animate.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    animateResultEntrance(panelEl) {
        if (typeof anime === 'undefined') return;

        const children = panelEl.children;
        anime({
            targets: panelEl,
            opacity: [0, 1],
            scale: [0.92, 1],
            duration: 500,
            easing: 'easeOutCubic',
        });

        if (children.length > 0) {
            anime({
                targets: Array.from(children),
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(80, { start: 200 }),
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    }
}

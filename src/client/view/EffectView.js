import CFG from './gameScreen/GameScreenConfig.js';

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
        if (!this._layer || !globalThis.anime) return;
        const { animate } = globalThis.anime;
        const jCfg = CFG.judgement || {};

        const el = document.createElement('div');
        el.className = 'judge-fx';
        el.textContent = judgement.toUpperCase();

        const color = JUDGE_COLORS[judgement] || '#fff';
        el.style.color = color;
        el.style.textShadow = `0 0 12px ${color}`;

        const geo = this._getLaneGeometry(laneIndex, laneCount);
        const laneXOffset = Array.isArray(jCfg.offsetXPerLanePx) ? (jCfg.offsetXPerLanePx[laneIndex] || 0) : 0;
        el.style.left = `${geo.centerX + laneXOffset}px`;
        el.style.transform = 'translateX(-50%)';
        el.style.bottom = `${geo.hitBottomPx + (jCfg.baseOffsetYFromHitPx ?? 24)}px`;
        el.style.opacity = '0';

        this._layer.appendChild(el);

        const isMiss = judgement === 'miss';

        animate(el, {
            opacity: [0, 1, 1, 0],
            y: isMiss
                ? [0, jCfg.missDropPx ?? 10]
                : [0, -(jCfg.perfectRisePx ?? 28)],
            scale: isMiss
                ? [jCfg.missScaleFrom ?? 0.9, 1]
                : [jCfg.perfectScaleFrom ?? 1.3, 1],
            duration: isMiss
                ? (jCfg.missDurationMs ?? 500)
                : (jCfg.perfectDurationMs ?? 450),
            ease: 'outCubic',
            onComplete: () => el.remove(),
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
        if (!this._layer || !globalThis.anime) return;
        const { animate } = globalThis.anime;

        const el = document.createElement('div');
        el.className = 'lane-flash';
        const geo = this._getLaneGeometry(laneIndex, laneCount);
        el.style.width = `${geo.laneWidth}px`;
        el.style.left = `${geo.laneStartX}px`;
        const color = LANE_COLORS[laneIndex] || '#fff';
        el.style.background = `linear-gradient(0deg, ${color}22 0%, transparent 60%)`;

        this._layer.appendChild(el);

        animate(el, {
            opacity: [0.6, 0],
            duration: 200,
            ease: 'outQuad',
            onComplete: () => el.remove(),
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
        if (!globalThis.anime) return;
        const { animate, stagger } = globalThis.anime;

        const children = panelEl.children;
        animate(panelEl, {
            opacity: [0, 1],
            scale: [0.92, 1],
            duration: 500,
            ease: 'outCubic',
        });

        if (children.length > 0) {
            animate(Array.from(children), {
                opacity: [0, 1],
                y: [20, 0],
                delay: stagger(80, { start: 200 }),
                duration: 400,
                ease: 'outCubic',
            });
        }
    }

    /**
     * Compute lane center in percentage of full playfield width.
     *
     * Args:
     *   laneIndex (number): Current lane index.
     *   laneCount (number): Total lane count.
     *
     * Returns:
     *   number
     *
     * Raises:
     *   None
     */
    _getLaneGeometry(laneIndex, laneCount) {
        const layerRect = this._layer.getBoundingClientRect();
        const lanesEl = this._layer.parentElement?.querySelector('.lanes');
        const hitLineEl = this._layer.parentElement?.querySelector('.hit-line');

        if (!lanesEl) {
            const fallbackLaneWidth = layerRect.width / laneCount;
            return {
                laneWidth: fallbackLaneWidth,
                laneStartX: fallbackLaneWidth * laneIndex,
                centerX: fallbackLaneWidth * (laneIndex + 0.5),
                hitBottomPx: 100,
            };
        }

        const lanesRect = lanesEl.getBoundingClientRect();
        const laneWidth = lanesRect.width / laneCount;
        const laneStartX = lanesRect.left - layerRect.left + laneWidth * laneIndex;
        const centerX = laneStartX + laneWidth / 2;
        const hitBottomPx = hitLineEl
            ? hitLineEl.getBoundingClientRect().bottom - layerRect.top
            : layerRect.height * 0.8;

        return { laneWidth, laneStartX, centerX, hitBottomPx };
    }
}

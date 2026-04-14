import CFG from './GameScreenConfig.js';

const ASSET = {
    pawLeft: 'assets/game_screen/paw-left.png',
    pawRight: 'assets/game_screen/paw-right.png',
    note: 'assets/game_screen/note.png',
    scoreBoard: 'assets/game_screen/score-board.png',
    pauseBtn: 'assets/ui/pause.png',
    startBtn: 'assets/ui/start.png',
    backBtn: 'assets/ui/back.png',
};

/**
 * Builds the sketch-style game screen DOM with SVG hand-drawn lanes, cat-paw
 * hit animations, and fish-score HUD. Provides mount points for existing sub-views.
 */
export class GameScreenView {
    constructor() {
        /** @type {HTMLElement|null} */
        this._host = null;
        /** @type {HTMLElement|null} */
        this._wrap = null;
        /** @type {HTMLImageElement|null} */
        this._pawLeft = null;
        /** @type {HTMLImageElement|null} */
        this._pawRight = null;
        /** @type {number} */
        this._laneCount = 4;
        this._pawState = {
            left: { homeX: null, returnTimer: null },
            right: { homeX: null, returnTimer: null },
        };
    }

    /**
     * Build the full sketch-style playfield inside host.
     *
     * Args:
     *   host (HTMLElement): Mount point (playfield-host).
     *   laneCount (number): Number of lanes.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    mount(host, laneCount) {
        this._host = host;
        this._laneCount = laneCount;
        this._host.innerHTML = '';
        const sketchSVG = this._buildSketchMarkup(laneCount);

        const wrap = document.createElement('div');
        wrap.className = 'playfield gs-playfield';
        wrap.innerHTML = `
            <div class="gs-gui-layer" aria-hidden="true">
                <div class="gs-score-container">
                    <img class="gs-gui-img" src="${ASSET.scoreBoard}" alt="" draggable="false">
                    <div class="gs-score-value" id="gs-score-val">0</div>
                </div>
                <div class="gs-top-controls">
                    <img class="gs-ctrl-btn" id="gs-btn-pause" src="${ASSET.pauseBtn}" alt="Pause" draggable="false">
                    <img class="gs-ctrl-btn" id="gs-btn-back" src="${ASSET.backBtn}" alt="Back" draggable="false">
                </div>
            </div>
            <div class="gs-hud-slot"></div>
            <div class="gs-lane-grid">
                <div class="lanes-wrap">
                    <div class="lanes"></div>
                    <div class="hit-line">
                        ${Array.from({ length: laneCount }, () => '<div class="hit-line-segment"></div>').join('')}
                    </div>
                    <div class="notes-layer"></div>
                </div>
                ${sketchSVG}
                <div class="gs-paw-home gs-paw-home-left">
                    <img class="gs-paw gs-paw-left" src="${ASSET.pawLeft}" alt="" draggable="false">
                </div>
                <div class="gs-paw-home gs-paw-home-right">
                    <img class="gs-paw gs-paw-right" src="${ASSET.pawRight}" alt="" draggable="false">
                </div>
            </div>
            <div class="overlay"></div>
        `;

        host.appendChild(wrap);
        this._wrap = wrap;
        this._pawLeft = wrap.querySelector('.gs-paw-left');
        this._pawRight = wrap.querySelector('.gs-paw-right');

        this._applyConfig();
    }

    /**
     * Build SVG markup for hand-drawn sketch lane lines following style.md.
     * Each line is drawn 3 times (ghost-2, ghost-1, main) with a rough filter.
     *
     * Args:
     *   laneCount (number): Number of lanes.
     *
     * Returns:
     *   string — SVG markup.
     *
     * Raises:
     *   None
     */
    _buildSketchMarkup(laneCount) {
        const sk = CFG.sketchLine;
        const hitY = 100 - CFG.hitLine.bottomPct;
        let lines = '';

        const ln = (x1, y1, x2, y2, stroke, sw, tx, ty) =>
            `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
            `stroke="${stroke}" stroke-width="${sw}" ` +
            `stroke-linecap="round" stroke-linejoin="round"` +
            (tx || ty ? ` transform="translate(${tx},${ty})"` : '') + '/>';

        const sketch = (x1, y1, x2, y2, w) => {
            const [g2x, g2y] = sk.ghost2Offset;
            const [g1x, g1y] = sk.ghost1Offset;
            lines += ln(x1, y1, x2, y2, sk.ghost2Color, w + 1, g2x, g2y);
            lines += ln(x1, y1, x2, y2, sk.ghost1Color, Math.max(w - 2, 1), g1x, g1y);
            lines += ln(x1, y1, x2, y2, sk.color, w, 0, 0);
        };

        for (let i = 0; i <= laneCount; i++) {
            const x = `${(i / laneCount) * 100}%`;
            const isOuter = i === 0 || i === laneCount;
            sketch(x, '0%', x, '100%', isOuter ? sk.mainStroke : sk.dividerStroke);
        }

        sketch('0%', `${hitY}%`, '100%', `${hitY}%`, sk.hitLineStroke);

        return `<svg class="gs-sketch-svg" xmlns="http://www.w3.org/2000/svg"
            width="100%" height="100%">
            <defs>
                <filter id="sketchRough">
                    <feTurbulence type="fractalNoise" baseFrequency="${sk.roughFreq}"
                        numOctaves="1" seed="11" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise"
                        scale="${sk.roughScale}" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
            </defs>
            <g filter="url(#sketchRough)">${lines}</g>
        </svg>`;
    }

    /** @private — Inject all config values as CSS custom properties on the root. */
    _applyConfig() {
        const s = this._wrap.style;
        const { lane, hitLine, receptorZone, note, paw, gui, background } = CFG;

        s.setProperty('--gs-bg', background.color);

        s.setProperty('--gs-lane-w', `${lane.widthPct}%`);
        s.setProperty('--gs-lane-min', `${lane.minWidthPx}px`);
        s.setProperty('--gs-lane-max', `${lane.maxWidthPx}px`);
        s.setProperty('--gs-lane-border', `${lane.borderWidthPx}px`);
        s.setProperty('--gs-lane-divider', `${lane.dividerWidthPx}px`);
        s.setProperty('--gs-lane-color', lane.borderColor);

        s.setProperty('--gs-hit-bottom', `${hitLine.bottomPct}%`);
        s.setProperty('--gs-hit-h', `${hitLine.heightPx}px`);
        s.setProperty('--gs-hit-color', hitLine.color);

        s.setProperty('--gs-rz-h', `${receptorZone.heightPct}%`);
        s.setProperty('--gs-rz-border', `${receptorZone.borderTopPx}px`);
        s.setProperty('--gs-rz-color', receptorZone.color);

        s.setProperty('--gs-note-w', `${note.widthPx}px`);
        s.setProperty('--gs-note-h', `${note.heightPx}px`);
        s.setProperty('--gs-note-shadow', `${note.shadowAlpha}`);

        s.setProperty('--gs-lane-count', this._laneCount);
        s.setProperty('--gs-paw-bottom', `${paw.bottomPct}%`);
        s.setProperty('--gs-paw-min', `${paw.minWidthPx}px`);
        s.setProperty('--gs-paw-vw', `${paw.preferredVw}vw`);
        s.setProperty('--gs-paw-max', `${paw.maxWidthPx}px`);

        const [minR, vw, maxR] = gui.scoreFontSizeClamp;
        s.setProperty('--gs-score-top', `${gui.scoreTopPct}%`);
        s.setProperty('--gs-score-left', `${gui.scoreLeftPct}%`);
        s.setProperty('--gs-score-fs', `clamp(${minR}rem, ${vw}vw, ${maxR}rem)`);
        
        s.setProperty('--gs-board-w', `${gui.boardWidthVw}vw`);
        s.setProperty('--gs-board-top', `${gui.boardTopPct}%`);
        s.setProperty('--gs-board-left', `${gui.boardLeftPct}%`);
    }

    /**
     * Return references to containers that existing sub-views need.
     *
     * Args:
     *   None
     *
     * Returns:
     *   { playfield, lanes, notesLayer, hudSlot, overlay }
     *
     * Raises:
     *   None
     */
    getContainers() {
        return {
            playfield: this._wrap,
            lanes: this._wrap.querySelector('.lanes'),
            notesLayer: this._wrap.querySelector('.notes-layer'),
            hudSlot: this._wrap.querySelector('.gs-hud-slot'),
            overlay: this._wrap.querySelector('.overlay'),
        };
    }

    /**
     * Compute the paw img's rest center X (where it sits when translateX = 0)
     * by reading its current visual position and subtracting current translateX.
     *
     * Args:
     *   paw (HTMLImageElement): The paw img element.
     *
     * Returns:
     *   number — viewport X of the paw center at rest.
     */
    _getPawRestCenterX(paw) {
        const r = paw.getBoundingClientRect();
        const cs = getComputedStyle(paw).transform;
        let tx = 0;
        if (cs && cs !== 'none') tx = new DOMMatrix(cs).m41;
        return r.left + r.width / 2 - tx;
    }

    /**
     * Slide the correct paw from its current position to the target lane,
     * perform a slam hit, then return to home after a short idle.
     * Target position is read directly from the .lane DOM element.
     *
     * Args:
     *   laneIndex (number): Lane that was pressed (0-based).
     *   laneCount (number): Total lane count.
     *   keyPressed (string | undefined): Actual keyboard key that was pressed.
     *
     * Returns:
     *   void
     */
    animatePaw(laneIndex, laneCount, keyPressed) {
        const animeApi = window.anime;
        if (!animeApi || !this._wrap) return;

        const keyTargetCfg = (keyPressed && CFG.paw.keyTargets)
            ? CFG.paw.keyTargets[String(keyPressed)]
            : null;
        const laneTargetCfg = keyTargetCfg || CFG.paw.laneTargets?.[laneIndex] || null;
        const isLeft = laneTargetCfg?.side
            ? laneTargetCfg.side === 'left'
            : laneIndex < laneCount / 2;
        const paw = isLeft ? this._pawLeft : this._pawRight;
        const state = isLeft ? this._pawState.left : this._pawState.right;
        if (!paw) return;

        const laneEl = this._wrap.querySelector(`.lane[data-lane="${laneIndex}"]`);
        if (!laneEl) return;

        animeApi.remove(paw);
        if (state.returnTimer) {
            clearTimeout(state.returnTimer);
            state.returnTimer = null;
        }

        const laneRect = laneEl.getBoundingClientRect();
        const targetX = laneRect.left + laneRect.width / 2 + (laneTargetCfg?.xOffsetPx || 0);
        const restX = this._getPawRestCenterX(paw);
        const dx = targetX - restX;

        const { moveDurationMs, slamUpPx, slamScale, idleBeforeReturnMs, returnDurationMs } = CFG.paw;

        animeApi.timeline({ targets: paw, easing: 'easeOutQuad' })
            .add({
                translateX: dx,
                translateY: 0,
                scale: 1,
                rotate: 0,
                duration: moveDurationMs,
            })
            .add({
                translateY: -slamUpPx,
                scale: slamScale,
                rotate: isLeft ? 5 : -5,
                duration: 55,
            })
            .add({
                translateY: 0,
                scale: 1,
                rotate: 0,
                duration: 70,
                easing: 'easeOutBack',
            });

        const totalSlamMs = moveDurationMs + 55 + 70;
        state.returnTimer = setTimeout(() => {
            animeApi.remove(paw);
            animeApi({
                targets: paw,
                translateX: 0,
                translateY: 0,
                scale: 1,
                rotate: 0,
                duration: returnDurationMs,
                easing: 'easeInOutQuad',
            });
        }, totalSlamMs + idleBeforeReturnMs);
    }

    /**
     * Render game screen layer updates, like score.
     *
     * Args:
     *   snapshot (RenderSnapshot): Latest output from engine.
     */
    render(snapshot) {
        if (!this._wrap) return;
        if (!this._scoreEl) this._scoreEl = this._wrap.querySelector('#gs-score-val');
        if (this._scoreEl && snapshot.score !== undefined) {
            this._scoreEl.textContent = String(snapshot.score);
        }
    }

    /**
     * Set the pause state to toggle between start and pause icons.
     *
     * Args:
     *   isPaused (boolean)
     */
    setPaused(isPaused) {
        if (!this._wrap) return;
        const pauseBtn = this._wrap.querySelector('#gs-btn-pause');
        if (pauseBtn) {
            pauseBtn.src = isPaused ? ASSET.startBtn : ASSET.pauseBtn;
        }
    }

    /**
     * Bind click handlers to top right controls.
     *
     * Args:
     *   handlers ({ onTogglePause: Function, onBack: Function })
     */
    bindControls(handlers) {
        if (!this._wrap) return;
        const pauseBtn = this._wrap.querySelector('#gs-btn-pause');
        const backBtn = this._wrap.querySelector('#gs-btn-back');

        if (pauseBtn) {
            pauseBtn.onclick = () => {
                if (handlers.onTogglePause) handlers.onTogglePause();
            };
        }
        if (backBtn) {
            backBtn.onclick = () => {
                if (handlers.onBack) handlers.onBack();
            };
        }
    }

    /**
     * Clean up DOM refs, stop animations, and clear timers.
     *
     * Args:
     *   None
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    destroy() {
        const animeApi = window.anime;
        if (animeApi && this._wrap) {
            animeApi.remove(this._pawLeft);
            animeApi.remove(this._pawRight);
        }
        for (const s of Object.values(this._pawState)) {
            if (s.returnTimer) clearTimeout(s.returnTimer);
        }
        this._pawLeft = null;
        this._pawRight = null;
        this._scoreEl = null;
        this._wrap = null;
        this._host = null;
    }
}
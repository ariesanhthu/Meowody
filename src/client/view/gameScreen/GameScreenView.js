import CFG from './GameScreenConfig.js';

const ASSET = {
    pawLeft: 'assets/game_screen/paw-left.png',
    pawRight: 'assets/game_screen/paw-right.png',
    catHead: 'assets/game_screen/cat_head.png',
    note: 'assets/game_screen/note.png',
    scoreBoard: 'assets/game_screen/score-board.png',
    pauseBtn: 'assets/ui/pause.png',
    startBtn: 'assets/ui/pause.png',
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
        /** @type {HTMLElement|null} */
        this._catHeadWrap = null;
        /** @type {HTMLImageElement|null} */
        this._catHead = null;
        /** @type {number} */
        this._laneCount = 4;
        this._pawState = {
            left: { homeX: null, returnTimer: null, currentDx: 0, targetDx: 0 },
            right: { homeX: null, returnTimer: null, currentDx: 0, targetDx: 0 },
        };
        this._comboPoseActive = false;
        this._catHeadPose = 'hidden';
        this._catHeadHideTimer = null;
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
                <div class="gs-cat-head-wrap" aria-hidden="true">
                    <img class="gs-cat-head" src="${ASSET.catHead}" alt="" draggable="false">
                </div>
                <div class="gs-paw-home gs-paw-home-left">
                    <img class="gs-paw gs-paw-left" src="${ASSET.pawLeft}" alt="" draggable="false">
                </div>
                <div class="gs-paw-home gs-paw-home-right">
                    <img class="gs-paw gs-paw-right" src="${ASSET.pawRight}" alt="" draggable="false">
                </div>
            </div>
            <pre class="gs-collision-debug" id="gs-collision-debug"></pre>
            <div class="overlay"></div>
        `;

        host.appendChild(wrap);
        this._wrap = wrap;
        this._pawLeft = wrap.querySelector('.gs-paw-left');
        this._pawRight = wrap.querySelector('.gs-paw-right');
        this._catHeadWrap = wrap.querySelector('.gs-cat-head-wrap');
        this._catHead = wrap.querySelector('.gs-cat-head');
        this._collisionDebugEl = wrap.querySelector('#gs-collision-debug');

        this._applyConfig();
        this._applyCatHeadPose('hidden');
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
        const { lane, hitLine, receptorZone, note, paw, catHead, gui, background } = CFG;

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

        s.setProperty('--gs-head-bottom', `${catHead.bottomPct}%`);
        s.setProperty('--gs-head-min', `${catHead.minWidthPx}px`);
        s.setProperty('--gs-head-vw', `${catHead.preferredVw}vw`);
        s.setProperty('--gs-head-max', `${catHead.maxWidthPx}px`);
        s.setProperty('--gs-head-y-hidden', `${catHead.hiddenOffsetPx}px`);
        s.setProperty('--gs-head-x-ms', `${catHead.xMoveDurationMs}ms`);
        s.setProperty('--gs-head-rise-ms', `${catHead.riseDurationMs}ms`);
        s.setProperty('--gs-head-hide-ms', `${catHead.hideDurationMs}ms`);

        const [minR, vw, maxR] = gui.scoreFontSizeClamp;
        s.setProperty('--gs-score-top', `${gui.scoreTopPct}%`);
        s.setProperty('--gs-score-left', `${gui.scoreLeftPct}%`);
        s.setProperty('--gs-score-fs', `clamp(${minR}rem, ${vw}vw, ${maxR}rem)`);

        s.setProperty('--gs-board-w', `${gui.boardWidthVw}vw`);
        s.setProperty('--gs-board-top', `${gui.boardTopPct}%`);
        s.setProperty('--gs-board-left', `${gui.boardLeftPct}%`);

        const debugCfg = CFG.debug || {};
        s.setProperty('--gs-debug-top', `${debugCfg.panelTopPx ?? 12}px`);
        s.setProperty('--gs-debug-right', `${debugCfg.panelRightPx ?? 12}px`);
        if (this._collisionDebugEl) {
            this._collisionDebugEl.style.display = debugCfg.showCollisionJudgement ? 'block' : 'none';
            this._collisionDebugEl.style.position = 'absolute';
            this._collisionDebugEl.style.top = 'var(--gs-debug-top)';
            this._collisionDebugEl.style.right = 'var(--gs-debug-right)';
            this._collisionDebugEl.style.zIndex = '12';
            this._collisionDebugEl.style.margin = '0';
            this._collisionDebugEl.style.padding = '8px 10px';
            this._collisionDebugEl.style.minWidth = '250px';
            this._collisionDebugEl.style.fontFamily = 'monospace';
            this._collisionDebugEl.style.fontSize = '12px';
            this._collisionDebugEl.style.lineHeight = '1.35';
            this._collisionDebugEl.style.color = '#111';
            this._collisionDebugEl.style.background = 'rgba(255,255,255,0.88)';
            this._collisionDebugEl.style.border = '1px solid rgba(0,0,0,0.35)';
            this._collisionDebugEl.style.borderRadius = '8px';
            this._collisionDebugEl.style.pointerEvents = 'none';
            this._collisionDebugEl.style.whiteSpace = 'pre';
        }
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
     * Resolve target x-offset for paws with optional viewport-width scaling.
     * xOffsetPx in config is treated as value at referenceWidthPx.
     */
    _getResponsivePawOffsetPx(targetCfg) {
        const baseOffset = Number(targetCfg?.xOffsetPx) || 0;
        if (!baseOffset) return 0;

        const responsiveCfg = CFG.paw.targetOffsetResponsive;
        if (!responsiveCfg?.enabled) return baseOffset;

        const viewportWidth = Number(window.innerWidth || document.documentElement?.clientWidth) || 0;
        if (!viewportWidth) return baseOffset;

        const referenceWidthPx = Math.max(1, Number(responsiveCfg.referenceWidthPx) || 1440);
        const rawScale = viewportWidth / referenceWidthPx;

        const minScaleCfg = Number(responsiveCfg.minScale);
        const maxScaleCfg = Number(responsiveCfg.maxScale);
        const minScale = Number.isFinite(minScaleCfg) ? minScaleCfg : 0.65;
        const maxScale = Number.isFinite(maxScaleCfg) ? maxScaleCfg : 1.2;
        const lower = Math.min(minScale, maxScale);
        const upper = Math.max(minScale, maxScale);
        const scale = Math.min(upper, Math.max(lower, rawScale));

        return baseOffset * scale;
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
        const animeApi = globalThis.anime;
        if (!animeApi || !this._wrap) return;
        const { animate, createTimeline, remove } = animeApi;
        if (this._comboPoseActive) return;

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

        remove(paw);
        if (state.returnTimer) {
            clearTimeout(state.returnTimer);
            state.returnTimer = null;
        }

        const laneRect = laneEl.getBoundingClientRect();
        const sideOffset = this._getResponsivePawOffsetPx(laneTargetCfg);
        const targetX = laneRect.left + laneRect.width / 2 + sideOffset;
        const restX = this._getPawRestCenterX(paw);
        const dx = targetX - restX;

        const { moveDurationMs, slamUpPx, slamScale, idleBeforeReturnMs, returnDurationMs } = CFG.paw;

        createTimeline({ ease: 'outQuad' })
            .add(paw, {
                x: dx,
                y: 0,
                scale: 1,
                rotate: 0,
                duration: moveDurationMs,
            })
            .add(paw, {
                y: -slamUpPx,
                scale: slamScale,
                rotate: isLeft ? 5 : -5,
                duration: 55,
            })
            .add(paw, {
                y: 0,
                scale: 1,
                rotate: 0,
                duration: 70,
                ease: 'outBack',
            });

        const totalSlamMs = moveDurationMs + 55 + 70;
        state.targetDx = dx;
        state.currentDx = dx;
        state.returnTimer = setTimeout(() => {
            remove(paw);
            animate(paw, {
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                duration: returnDurationMs,
                ease: 'inOutQuad',
                onComplete: () => {
                    state.currentDx = 0;
                },
            });
            state.targetDx = 0;
        }, totalSlamMs + idleBeforeReturnMs);
    }

    /**
     * Sync paw pose from currently held lanes.
     * Rules:
     *   - 4 lanes: both paws stay on outer lanes.
     *   - 3 lanes: side with 2 held lanes uses the outermost lane on that side.
     *   - Leaving combo state: both paws return home immediately.
     *
     * Args:
     *   pressedLanes (number[]): Active lane indices currently held down.
     *   laneCount (number): Total lane count.
     */
    updatePawPose(pressedLanes, laneCount = this._laneCount) {
        if (!this._wrap || !this._pawLeft || !this._pawRight) return;

        const unique = [...new Set((pressedLanes || []).filter((lane) => Number.isInteger(lane)))];
        const valid = unique
            .filter((lane) => lane >= 0 && lane < laneCount)
            .sort((a, b) => a - b);
        const targets = this._resolveComboPawTargets(valid, laneCount);

        if (!targets) {
            if (this._comboPoseActive) {
                this._comboPoseActive = false;
                this._returnPawHome('left');
                this._returnPawHome('right');
            }
            return;
        }

        this._comboPoseActive = true;
        if (targets.leftHome) this._returnPawHome('left');
        else this._movePawToLane('left', targets.leftLane, laneCount);

        if (targets.rightHome) this._returnPawHome('right');
        else this._movePawToLane('right', targets.rightLane, laneCount);
    }

    _resolveComboPawTargets(valid, laneCount) {
        if (valid.length === laneCount) {
            return { leftLane: 0, rightLane: laneCount - 1, leftHome: false, rightHome: false };
        }

        const split = laneCount / 2;
        const leftPressed = valid.filter((lane) => lane < split);
        const rightPressed = valid.filter((lane) => lane >= split);

        if (valid.length === 2) {
            if (leftPressed.length === 2) {
                return {
                    leftLane: 0,
                    rightLane: null,
                    leftHome: false,
                    rightHome: true,
                };
            }
            if (rightPressed.length === 2) {
                return {
                    leftLane: null,
                    rightLane: laneCount - 1,
                    leftHome: true,
                    rightHome: false,
                };
            }
            return null;
        }

        if (valid.length !== 3) return null;

        if (leftPressed.length === 2 && rightPressed.length === 1) {
            return {
                leftLane: 0,
                rightLane: rightPressed[0],
                leftHome: false,
                rightHome: false,
            };
        }

        if (rightPressed.length === 2 && leftPressed.length === 1) {
            return {
                leftLane: leftPressed[0],
                rightLane: laneCount - 1,
                leftHome: false,
                rightHome: false,
            };
        }

        return null;
    }

    _returnPawHome(side) {
        const animeApi = globalThis.anime;
        if (!animeApi || !this._wrap) return;
        const { animate, remove } = animeApi;

        const paw = side === 'left' ? this._pawLeft : this._pawRight;
        const state = side === 'left' ? this._pawState.left : this._pawState.right;
        if (!paw) return;

        if (state.returnTimer) {
            clearTimeout(state.returnTimer);
            state.returnTimer = null;
        }

        remove(paw);
        animate(paw, {
            x: 0,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: CFG.paw.returnDurationMs,
            ease: 'inOutQuad',
            onComplete: () => {
                state.currentDx = 0;
            },
        });
        state.targetDx = 0;
    }

    _movePawToLane(side, laneIndex, laneCount) {
        const animeApi = globalThis.anime;
        if (!animeApi || !this._wrap) return;
        const { animate, remove } = animeApi;

        const paw = side === 'left' ? this._pawLeft : this._pawRight;
        const state = side === 'left' ? this._pawState.left : this._pawState.right;
        if (!paw) return;

        const laneEl = this._wrap.querySelector(`.lane[data-lane="${laneIndex}"]`);
        if (!laneEl) return;

        if (state.returnTimer) {
            clearTimeout(state.returnTimer);
            state.returnTimer = null;
        }

        remove(paw);

        const targetCfg = CFG.paw.laneTargets?.[laneIndex] || null;
        const defaultSide = laneIndex < laneCount / 2 ? 'left' : 'right';
        const expectedSide = targetCfg?.side || defaultSide;
        const sideOffset = expectedSide === side
            ? this._getResponsivePawOffsetPx(targetCfg)
            : 0;

        const laneRect = laneEl.getBoundingClientRect();
        const targetX = laneRect.left + laneRect.width / 2 + sideOffset;
        const restX = this._getPawRestCenterX(paw);
        const dx = targetX - restX;

        state.targetDx = dx;

        animate(paw, {
            x: dx,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: CFG.paw.moveDurationMs,
            ease: 'outQuad',
            onComplete: () => {
                state.currentDx = dx;
            },
        });
    }

    /**
     * Update cat-head pose from active lane presses.
     *
     * Args:
     *   pressedLanes (number[]): Active lane indices currently held down.
     *   laneCount (number): Total lane count.
     */
    updateCatHeadPose(pressedLanes, laneCount = this._laneCount) {
        if (!this._catHeadWrap) return;
        const pose = this._resolveCatHeadPose(pressedLanes, laneCount);
        this._applyCatHeadPose(pose);
    }

    _resolveCatHeadPose(pressedLanes, laneCount) {
        const unique = [...new Set((pressedLanes || []).filter((lane) => Number.isInteger(lane)))];
        const valid = unique.filter((lane) => lane >= 0 && lane < laneCount);
        const total = valid.length;
        if (total < 2) return 'hidden';

        const half = laneCount / 2;
        const leftCount = valid.filter((lane) => lane < half).length;
        const rightCount = total - leftCount;

        if (total === laneCount) return 'center';
        if (total === 3) {
            if (leftCount === 2) return 'left';
            if (rightCount === 2) return 'right';
            return 'center';
        }
        if (total === 2) {
            if (leftCount === 2) return 'left';
            if (rightCount === 2) return 'right';
        }

        return 'hidden';
    }

    _applyCatHeadPose(pose) {
        if (!this._catHeadWrap) return;
        if (pose === this._catHeadPose) return;

        if (this._catHeadHideTimer) {
            clearTimeout(this._catHeadHideTimer);
            this._catHeadHideTimer = null;
        }

        const headCfg = CFG.catHead;
        const xMap = {
            left: headCfg.sideLeftPct,
            center: headCfg.centerPct,
            right: headCfg.sideRightPct,
        };

        if (pose === 'hidden') {
            const holdMs = Math.max(0, headCfg.holdBeforeHideMs || 0);
            this._catHeadHideTimer = setTimeout(() => {
                if (this._catHeadWrap) {
                    this._catHeadWrap.classList.remove('is-visible');
                }
                this._catHeadHideTimer = null;
            }, holdMs);
            this._catHeadPose = pose;
            return;
        }

        const x = xMap[pose] ?? headCfg.centerPct;
        this._catHeadWrap.style.left = `${x}%`;
        this._catHeadWrap.classList.add('is-visible');
        this._catHeadPose = pose;
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
     * Render persistent collision/judgement debug text.
     *
     * Args:
     *   snapshot (RenderSnapshot): Latest output from engine.
     *
     * Returns:
     *   void
     */
    renderCollisionDebug(snapshot) {
        const debugCfg = CFG.debug || {};
        if (!debugCfg.showCollisionJudgement || !this._collisionDebugEl || !this._wrap) return;

        const hitLineEl = this._wrap.querySelector('.hit-line');
        const wrapRect = this._wrap.getBoundingClientRect();
        const hitY = hitLineEl
            ? (hitLineEl.getBoundingClientRect().bottom - wrapRect.top)
            : (wrapRect.height * 0.8);

        let nearest = null;
        for (const note of (snapshot.visibleNotes || [])) {
            const dist = Math.abs(note.y - hitY);
            if (!nearest || dist < nearest.dist) {
                nearest = { lane: note.laneIndex, dist, y: note.y };
            }
        }

        const nearestLabel = nearest
            ? `lane=${nearest.lane} dist=${nearest.dist.toFixed(1)}px noteY=${nearest.y.toFixed(1)}`
            : 'none';

        this._collisionDebugEl.textContent =
            `collision/judgement debug
timeMs: ${Math.round(snapshot.currentTimeMs || 0)}
lastJudgement: ${snapshot.lastJudgement || 'none'}
combo: ${snapshot.combo || 0}
visibleNotes: ${(snapshot.visibleNotes || []).length}
hitLineY: ${hitY.toFixed(1)}
nearestToHit: ${nearestLabel}`;
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
        const animeApi = globalThis.anime;
        if (animeApi && this._wrap) {
            animeApi.remove(this._pawLeft);
            animeApi.remove(this._pawRight);
        }
        for (const s of Object.values(this._pawState)) {
            if (s.returnTimer) clearTimeout(s.returnTimer);
        }
        this._pawLeft = null;
        this._pawRight = null;
        this._comboPoseActive = false;
        this._catHeadWrap = null;
        this._catHead = null;
        this._catHeadPose = 'hidden';
        if (this._catHeadHideTimer) {
            clearTimeout(this._catHeadHideTimer);
            this._catHeadHideTimer = null;
        }
        this._scoreEl = null;
        this._collisionDebugEl = null;
        this._wrap = null;
        this._host = null;
    }
}
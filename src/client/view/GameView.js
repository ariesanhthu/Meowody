import { LaneView } from './LaneView.js';
import { NoteView } from './NoteView.js';
import { HUDView } from './HUDView.js';
import { EffectView } from './EffectView.js';
import { ScreenEffectView } from './ScreenEffectView.js';
import { StartScreenView } from './startscreen/StartScreenView.js';
import { SelectScreenView } from './songSelectionScreen/SelectScreenView.js';
import { GameScreenView } from './gameScreen/GameScreenView.js';
import { getFallbackSvg, attachFallback } from './ImageFallback.js';
import { preloadAll } from './AssetLoader.js';

/** @typedef {import('../model/DataModels.js').RenderSnapshot} RenderSnapshot */

/**
 * Composes lane, note, HUD layers and renders menu / loading / error / result overlays.
 * All data received as plain objects — no scoring rules here.
 */
export class GameView {
    constructor() {
        /** @type {HTMLElement | null} */
        this._root = null;
        this._laneView = new LaneView();
        this._noteView = new NoteView();
        this._hudView = new HUDView();
        this._effectView = new EffectView();
        this._screenEffectView = new ScreenEffectView();
        this._startScreenView = new StartScreenView();
        this._selectScreenView = new SelectScreenView();
        this._gameScreenView = new GameScreenView();
        this._playfield = null;
        this._overlay = null;
        this._laneCount = 4;
    }

    /**
     * Create playfield DOM under host.
     *
     * Args:
     *   host (HTMLElement): Mount point.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    mount(host) {
        this._root = host;
        this._root.innerHTML = '';

        this._gameScreenView.mount(host, this._laneCount);
        const c = this._gameScreenView.getContainers();

        this._playfield = c.playfield;
        this._overlay = c.overlay;

        this._laneView.render(c.lanes, this._laneCount);
        this._hudView.mount(c.hudSlot);
        this._noteView.setLayer(c.notesLayer);
        this._effectView.mount(c.playfield);
        this._screenEffectView.mount(c.playfield);
    }

    /**
     * Probe asset images and inject CSS overrides for entities that have custom sprites.
     * Must be called after mount(). All assets are optional.
     *
     * Args:
     *   None
     *
     * Returns:
     *   Promise<void>
     *
     * Raises:
     *   None
     */
    async loadAssets() {
        const assets = await preloadAll(this._laneCount);
        const rules = [];

        for (let i = 0; i < this._laneCount; i++) {
            if (assets[`note-${i}`]) {
                rules.push(`.note[data-lane="${i}"] {
                    background: url('${assets[`note-${i}`]}') center/contain no-repeat !important;
                    border: none !important;
                    box-shadow: none !important;
                }`);
            }
            if (assets[`receptor-${i}`]) {
                rules.push(`.lane[data-lane="${i}"] .lane-receptor {
                    background: url('${assets[`receptor-${i}`]}') center/contain no-repeat !important;
                    border: none !important;
                    box-shadow: none !important;
                    opacity: 0.6 !important;
                }`);
            }
        }

        if (assets.background && this._playfield) {
            this._playfield.style.backgroundImage = `url('${assets.background}')`;
            this._playfield.style.backgroundSize = 'cover';
            this._playfield.style.backgroundPosition = 'center';
        }

        if (rules.length > 0) {
            const style = document.createElement('style');
            style.id = 'asset-overrides';
            style.textContent = rules.join('\n');
            document.head.appendChild(style);
        }

        this._assets = assets;
    }

    /**
     * Render a gameplay snapshot.
     *
     * Args:
     *   snapshot (RenderSnapshot): Plain data from GameEngine.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    render(snapshot) {
        if (!this._playfield) return;
        this._clearStartScreen();
        this._hideOverlay();
        this._hudView.render(snapshot);
        this._gameScreenView.render(snapshot);
        this._gameScreenView.renderCollisionDebug(snapshot);
        this._noteView.render(snapshot.visibleNotes, this._laneCount);
    }

    /**
     * Show custom start screen.
     *
     * Args:
      *   options (object): { songCount, onStart, keymap, onSaveSettings }
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showStartScreen(options = {}) {
        if (!this._overlay) return;
        this._showOverlay();
        this._startScreenView.render(this._overlay, options);
    }

    /**
     * Get sub-views for external wiring (effects, lane press).
     *
     * Args:
     *   None
     *
     * Returns:
     *   { laneView: LaneView, effectView: EffectView }
     *
     * Raises:
     *   None
     */
    getSubViews() {
        return {
            laneView: this._laneView,
            effectView: this._effectView,
            screenEffectView: this._screenEffectView,
            gameScreenView: this._gameScreenView,
        };
    }

    /**
     * Get the current playfield height for dynamic hit-line positioning.
     *
     * Args:
     *   None
     *
     * Returns:
     *   number — height in pixels.
     *
     * Raises:
     *   None
     */
    getPlayfieldHeight() {
        return this._playfield ? this._playfield.offsetHeight : 600;
    }

    /**
     * Show paw-themed song selection screen with vinyl disks.
     *
     * Args:
     *   songSummaries (object[]): Array of SongSummary.
     *   options (object): { onSelectSong, onBack } callbacks.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showSongList(songSummaries, options = {}) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._selectScreenView.render(this._overlay, {
            songs: songSummaries,
            onSelectSong: options.onSelectSong,
            onBack: options.onBack,
        });
    }

    /**
     * Show song details.
     *
     * Args:
     *   songDetails (object): SongDetails.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showSongDetails(songDetails) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.innerHTML = `
            <div class="song-detail">
                <h2>${_esc(songDetails.title)}</h2>
                <p>${_esc(songDetails.artist)}</p>
            </div>
        `;
    }

    /**
     * Show chart difficulty selection buttons.
     *
     * Args:
     *   chartDescriptors (object[]): Minimal chart descriptors.
      *   options (object): { onBack }
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showChartOptions(chartDescriptors, options = {}) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.classList.add('select-overlay');
        this._overlay.innerHTML = `
            <section class="select-screen select-chart-screen" aria-label="Difficulty selection">
                <div class="select-frame">
                    <img
                        class="select-frame-bg"
                        src="assets/song_selection_screen/song_select_bg.png"
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                    >
                    <div class="select-content select-chart-content">
                        <div class="select-title">Select Difficulty</div>
                        <div class="chart-options select-chart-options"></div>
                        <div class="select-controls">
                            <button class="select-back-btn" id="chart-back-btn" type="button">Back</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
        const wrap = this._overlay.querySelector('.chart-options');
        for (const c of chartDescriptors) {
            const btn = document.createElement('button');
            btn.className = 'chart-select-btn';
            btn.dataset.chartId = c.chartId;
            btn.innerHTML = `
                <span class="meter">${c.meter}</span>
                <span class="chart-name">${_esc(c.difficulty)}</span>
            `;
            wrap.appendChild(btn);
        }

        const backBtn = this._overlay.querySelector('#chart-back-btn');
        if (backBtn && typeof options.onBack === 'function') {
            backBtn.addEventListener('click', options.onBack);
        }
    }

    /**
     * Show a 3-2-1 countdown before auto-playing.
     *
     * Args:
     *   onComplete (Function)
     */
    showCountdown(onComplete) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.className = 'overlay countdown-overlay';
        this._overlay.innerHTML = `
            <div class="countdown-wrap">
                <div class="countdown-number" id="countdown-val">3</div>
            </div>
        `;
        
        const cVal = this._overlay.querySelector('#countdown-val');
        let count = 3;
        const tick = () => {
            if (count > 0) {
                if (cVal) cVal.textContent = String(count);
                if (globalThis.anime) {
                    const { animate, remove } = globalThis.anime;
                    remove(cVal);
                    animate(cVal, {
                        scale: [0.5, 1.2, 1],
                        opacity: [0, 1, 0.8],
                        duration: 800,
                        ease: 'outElastic(1, .5)',
                    });
                }
                count--;
                setTimeout(tick, 1000);
            } else {
                this._hideOverlay();
                if (onComplete) onComplete();
            }
        };
        tick();
    }

    /**
     * Show polished loading state.
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
    showLoading() {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.innerHTML = `
            <div class="loading-wrap">
                <div class="spinner"></div>
                <div class="overlay-msg">Loading…</div>
            </div>
        `;
    }

    /**
     * Show import warnings (non-fatal). Logged to console.
     *
     * Args:
     *   warnings (string[]): Warning messages.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showWarnings(warnings) {
        if (!warnings.length) return;
        console.warn('[import warnings]', warnings);
    }

    /**
     * Show error state.
     *
     * Args:
     *   message (string): Error text.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showError(message) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.innerHTML = `<div class="error-msg">⚠ ${_esc(message)}</div>`;
    }

    /**
     * Show polished result screen with Anime.js entrance.
     *
     * Args:
     *   resultData (object): { score, accuracy, maxCombo, perfect, great, good, miss, onRestart, onMenu }
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showResult(resultData) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        const pct = (resultData.accuracy * 100).toFixed(2);

        this._overlay.innerHTML = `
            <div class="result-panel" id="result-panel">
                <div class="result-header">Performance</div>
                <div class="result-score">${resultData.score}</div>
                <div class="result-stats">
                    <div class="result-stat">
                        <span class="result-stat-label">Accuracy</span>
                        <span class="result-stat-value">${pct}%</span>
                    </div>
                    <div class="result-stat">
                        <span class="result-stat-label">Max Combo</span>
                        <span class="result-stat-value">${resultData.maxCombo}</span>
                    </div>
                </div>
                <div class="result-divider"></div>
                <div class="result-judges">
                    <div class="result-judge j-perfect">
                        <span class="result-judge-label">Perfect</span>
                        <span class="result-judge-count">${resultData.perfect}</span>
                    </div>
                    <div class="result-judge j-great">
                        <span class="result-judge-label">Great</span>
                        <span class="result-judge-count">${resultData.great}</span>
                    </div>
                    <div class="result-judge j-good">
                        <span class="result-judge-label">Good</span>
                        <span class="result-judge-count">${resultData.good}</span>
                    </div>
                    <div class="result-judge j-miss">
                        <span class="result-judge-label">Miss</span>
                        <span class="result-judge-count">${resultData.miss}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn primary" id="result-btn-restart">RESTART</button>
                    <button class="btn" id="result-btn-menu">MENU</button>
                </div>
            </div>
        `;

        const panel = this._overlay.querySelector('#result-panel');
        if (panel) {
            this._effectView.animateResultEntrance(panel);
        }

        const restartBtn = this._overlay.querySelector('#result-btn-restart');
        const menuBtn = this._overlay.querySelector('#result-btn-menu');
        if (restartBtn && typeof resultData.onRestart === 'function') {
            restartBtn.addEventListener('click', resultData.onRestart);
        }
        if (menuBtn && typeof resultData.onMenu === 'function') {
            menuBtn.addEventListener('click', resultData.onMenu);
        }
    }

    /**
     * Show pause overlay.
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
    showPause(options = {}) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.className = 'overlay pause-overlay';
        this._overlay.innerHTML = `
            <div class="pause-title">Paused</div>
            <div class="gs-pause-actions"></div>
        `;

        const wrap = this._overlay.querySelector('.gs-pause-actions');

        if (typeof options.onResume === 'function') {
            const btn = document.createElement('button');
            btn.className = 'btn primary';
            btn.textContent = 'RESUME';
            btn.addEventListener('click', options.onResume);
            wrap.appendChild(btn);
        }

        if (typeof options.onSetting === 'function') {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = 'SETTING';
            btn.addEventListener('click', options.onSetting);
            wrap.appendChild(btn);
        }

        if (typeof options.onExitGame === 'function') {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = 'EXIT GAME';
            btn.addEventListener('click', options.onExitGame);
            wrap.appendChild(btn);
        }
    }

    /**
     * Show settings panel for key binding configuration.
     *
     * Args:
     *   options (object): { keymap, onSave, onBack }
     */
    showSettingsPanel(options = {}) {
        if (!this._overlay) return;

        const workingKeymap = _normalizeKeymap(options.keymap);

        this._clearStartScreen();
        this._showOverlay();
        this._overlay.className = 'overlay pause-overlay';
        this._overlay.innerHTML = `
            <div class="gs-setting-panel" tabindex="-1">
                <div class="gs-setting-title">Setting</div>
                <div class="gs-setting-section-title">Key binding</div>
                <div class="gs-setting-grid">
                    ${workingKeymap
                        .map(
                            (k, idx) => `
                        <div class="gs-setting-row">
                            <span class="gs-setting-lane">Lane ${idx + 1}</span>
                            <button class="gs-setting-key-btn" type="button" data-bind-index="${idx}">${_keyLabel(k)}</button>
                        </div>
                    `,
                        )
                        .join('')}
                </div>
                <div class="gs-setting-hint">Click a lane and press a key. Keys must be unique.</div>
                <div class="gs-setting-error" aria-live="polite"></div>
                <div class="gs-setting-actions">
                    <button class="btn" type="button" id="gs-setting-back">Back</button>
                    <button class="btn primary" type="button" id="gs-setting-save">Save</button>
                </div>
            </div>
        `;

        const panel = this._overlay.querySelector('.gs-setting-panel');
        const keyBtns = Array.from(this._overlay.querySelectorAll('.gs-setting-key-btn'));
        const errEl = this._overlay.querySelector('.gs-setting-error');
        const backBtn = this._overlay.querySelector('#gs-setting-back');
        const saveBtn = this._overlay.querySelector('#gs-setting-save');

        let captureIndex = null;

        const setError = (msg) => {
            if (errEl) errEl.textContent = msg || '';
        };

        const refresh = () => {
            keyBtns.forEach((btn, idx) => {
                const listening = idx === captureIndex;
                btn.dataset.listening = listening ? 'true' : 'false';
                btn.textContent = listening ? 'Press a key...' : _keyLabel(workingKeymap[idx]);
            });
        };

        const onKeyDown = (ev) => {
            if (captureIndex == null) return;
            if (ev.key === 'Escape') {
                ev.preventDefault();
                captureIndex = null;
                refresh();
                return;
            }

            const normalized = _normalizeKey(ev.key);
            if (!normalized) return;

            ev.preventDefault();
            workingKeymap[captureIndex] = normalized;
            captureIndex = null;
            setError('');
            refresh();
        };

        keyBtns.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                captureIndex = idx;
                setError('');
                refresh();
                panel?.focus();
            });
        });

        backBtn?.addEventListener('click', () => {
            if (typeof options.onBack === 'function') options.onBack();
        });

        saveBtn?.addEventListener('click', () => {
            const lowered = workingKeymap.map((k) => String(k).toLowerCase());
            if (new Set(lowered).size !== lowered.length) {
                setError('Key binding must be unique.');
                return;
            }

            if (typeof options.onSave === 'function') {
                options.onSave([...workingKeymap]);
            }
        });

        panel?.addEventListener('keydown', onKeyDown);
        panel?.focus();
        refresh();
    }

    /**
     * Hide pause / overlay.
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
    hidePause() {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._overlay.className = 'overlay';
        this._hideOverlay();
    }

    /** @private */
    _showOverlay() {
        if (this._overlay) {
            this._overlay.style.display = 'flex';
            this._overlay.className = 'overlay';
        }
    }

    /** @private */
    _hideOverlay() {
        this._clearStartScreen();
        if (this._overlay) this._overlay.style.display = 'none';
    }

    /** @private */
    _clearStartScreen() {
        this._startScreenView.destroy();
        this._selectScreenView.destroy();
    }
}

function _esc(s) {
    const el = document.createElement('span');
    el.textContent = s || '';
    return el.innerHTML;
}

function _normalizeKeymap(keymap) {
    const fallback = ['1', '2', '3', '4'];
    if (!Array.isArray(keymap) || keymap.length !== fallback.length) return fallback;
    return keymap.map((k, i) => {
        const normalized = _normalizeKey(String(k || ''));
        return normalized || fallback[i];
    });
}

function _normalizeKey(key) {
    if (!key || key === 'Meta' || key === 'Control' || key === 'Shift' || key === 'Alt') {
        return '';
    }
    if (key === 'Spacebar') return ' ';
    if (key === ' ') return ' ';
    if (key.length === 1) return key.toUpperCase();
    return key;
}

function _keyLabel(key) {
    if (!key) return 'Unset';
    if (key === ' ') return 'Space';
    if (key.length === 1) return key.toUpperCase();
    return key;
}

import { LaneView } from './LaneView.js';
import { NoteView } from './NoteView.js';
import { HUDView } from './HUDView.js';
import { EffectView } from './EffectView.js';
import { StartScreenView } from './startscreen/StartScreenView.js';
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
        this._startScreenView = new StartScreenView();
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

        const wrap = document.createElement('div');
        wrap.className = 'playfield';
        wrap.innerHTML = `
            <div class="hud-slot"></div>
            <div class="lanes-wrap">
                <div class="lanes"></div>
                <div class="hit-line">
                    <div class="hit-line-segment"></div>
                    <div class="hit-line-segment"></div>
                    <div class="hit-line-segment"></div>
                    <div class="hit-line-segment"></div>
                </div>
                <div class="notes-layer"></div>
            </div>
            <div class="overlay"></div>
        `;
        this._root.appendChild(wrap);
        this._playfield = wrap;
        this._overlay = wrap.querySelector('.overlay');

        this._laneView.render(wrap.querySelector('.lanes'), this._laneCount);
        this._hudView.mount(wrap.querySelector('.hud-slot'));
        this._noteView.setLayer(wrap.querySelector('.notes-layer'));
        this._effectView.mount(wrap);
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
        this._noteView.render(snapshot.visibleNotes, this._laneCount);
    }

    /**
     * Show custom start screen.
     *
     * Args:
     *   options (object): { songCount, onStart, onSettings }
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
     * Show song list with thumbnails and image fallbacks.
     *
     * Args:
     *   songSummaries (object[]): Array of SongSummary.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showSongList(songSummaries) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.innerHTML = `
            <div>
                <div class="menu-title">Select Song</div>
                <div class="song-list"></div>
            </div>
        `;
        const list = this._overlay.querySelector('.song-list');

        for (const s of songSummaries) {
            const item = document.createElement('div');
            item.className = 'song-item';
            item.dataset.songId = s.id;

            const img = document.createElement('img');
            img.className = 'song-thumb';
            img.alt = s.title || '';
            img.src = s.bannerUrl || s.audioUrl?.replace(/\.[^.]+$/, '-bn.png') || '';
            attachFallback(img, 'thumbnail', 96, 96);
            if (!img.src || img.src === window.location.href) {
                img.src = getFallbackSvg('thumbnail', 96, 96);
            }

            const info = document.createElement('div');
            info.className = 'song-info';
            info.innerHTML = `
                <div class="song-title">${_esc(s.title)}</div>
                <div class="song-artist">${_esc(s.artist)}</div>
            `;

            const charts = document.createElement('span');
            charts.className = 'song-charts';
            charts.textContent = `${s.chartCount || (s.availableCharts && s.availableCharts.length) || 0} chart(s)`;

            item.appendChild(img);
            item.appendChild(info);
            item.appendChild(charts);
            list.appendChild(item);
        }
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
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    showChartOptions(chartDescriptors) {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.innerHTML = `
            <div class="chart-options-wrap">
                <div class="chart-options-title">Select Difficulty</div>
                <div class="chart-options"></div>
            </div>
        `;
        const wrap = this._overlay.querySelector('.chart-options');
        for (const c of chartDescriptors) {
            const btn = document.createElement('button');
            btn.className = 'btn chart-btn';
            btn.dataset.chartId = c.chartId;
            btn.innerHTML = `<span class="meter">${c.meter}</span>${_esc(c.difficulty)}`;
            wrap.appendChild(btn);
        }
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
     *   resultData (object): { score, accuracy, maxCombo, perfect, great, good, miss }
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
            </div>
        `;

        const panel = this._overlay.querySelector('#result-panel');
        if (panel) {
            this._effectView.animateResultEntrance(panel);
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
    showPause() {
        if (!this._overlay) return;
        this._clearStartScreen();
        this._showOverlay();
        this._overlay.className = 'overlay pause-overlay';
        this._overlay.innerHTML = `<div class="pause-title">Paused</div>`;
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
    }
}

function _esc(s) {
    const el = document.createElement('span');
    el.textContent = s || '';
    return el.innerHTML;
}

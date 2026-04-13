import { EventBus } from '../shared/EventBus.js';
import { SongRepository } from '../data/SongRepository.js';
import { ChartRepository } from '../data/ChartRepository.js';
import { PlayController } from './PlayController.js';
import { InputController } from './InputController.js';
import { GameView } from '../view/GameView.js';

/**
 * Manages scene transitions and wires visual effects from gameplay events.
 */
export class SceneController {
    /**
     * @param {HTMLElement} container
     */
    constructor(container) {
        this._container = container;
        this._bus = new EventBus();
        this._songRepo = new SongRepository('');
        this._chartRepo = new ChartRepository('');
        this._gameView = new GameView();
        this._play = new PlayController({
            songRepo: this._songRepo,
            chartRepo: this._chartRepo,
            gameView: this._gameView,
            bus: this._bus,
        });
        this._input = new InputController(this._bus);

        /** @type {string} */
        this._currentScene = 'start';
        /** @type {object[]} */
        this._songs = [];

        this._laneView = null;
        this._effectView = null;
    }

    /**
     * Navigate to a scene with optional payload.
     *
     * Args:
     *   sceneName (string): Target scene.
     *   payload (object): Optional context.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    goTo(sceneName, payload = {}) {
        const prev = this._currentScene;
        this._currentScene = sceneName;
        this._bus.emit('SCENE_CHANGED', { previousScene: prev, nextScene: sceneName });
        this._setStartShellMode(sceneName === 'start');

        switch (sceneName) {
            case 'start':
                this._renderStart();
                break;
            case 'menu':
                this._renderMenu();
                break;
            case 'loading':
                this._gameView.showLoading();
                break;
            case 'error':
                this._gameView.showError(payload.message || 'Unknown error');
                break;
            case 'result':
                this._renderResult();
                break;
            default:
                break;
        }
    }

    /**
     * Current scene name.
     *
     * Args:
     *   None
     *
     * Returns:
     *   string
     *
     * Raises:
     *   None
     */
    getCurrentScene() {
        return this._currentScene;
    }

    /**
     * Bootstrap: build DOM, mount views, load songs, wire events.
     *
     * Args:
     *   None
     *
     * Returns:
     *   Promise<void>
     *
     * Raises:
     *   Error: Fatal init error.
     */
    async init() {
        this._container.innerHTML = '';

        const shell = document.createElement('div');
        shell.className = 'app-shell';
        shell.innerHTML = `
            <header class="app-header">
                <h1>RHYTHM</h1>
                <div class="header-controls">
                    <span id="status-line" class="status-line">Loading…</span>
                    <button type="button" class="btn-icon" id="btn-fs" title="Toggle fullscreen">
                        <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                    </button>
                </div>
            </header>
            <div id="playfield-host" class="playfield-host"></div>
            <footer class="app-footer" id="app-footer"></footer>
        `;
        this._container.appendChild(shell);

        this._statusEl = shell.querySelector('#status-line');
        this._footerEl = shell.querySelector('#app-footer');
        this._shell = shell;
        const host = shell.querySelector('#playfield-host');

        this._gameView.mount(host);
        await this._gameView.loadAssets();

        const { laneView, effectView } = this._gameView.getSubViews();
        this._laneView = laneView;
        this._effectView = effectView;

        shell.querySelector('#btn-fs').addEventListener('click', () => this._toggleFullscreen());

        this._bus.on('input:lane', (data) => {
            this._play.handleLaneInput(data.laneIndex);
            if (this._laneView) this._laneView.flashPressed(data.laneIndex, 100);
            if (this._effectView) this._effectView.flashLane(data.laneIndex, 4);
        });

        this._bus.on('NOTE_HIT', (data) => {
            if (this._effectView) {
                this._effectView.spawnJudgement(data.laneIndex, data.judgement, 4);
            }
        });

        this._bus.on('NOTE_MISSED', (data) => {
            if (this._effectView) {
                this._effectView.spawnJudgement(data.laneIndex, 'miss', 4);
            }
        });

        this._bus.on('GAME_FINISHED', () => {
            this._input.unbind();
            this.goTo('result');
        });

        this._bus.on('IMPORT_WARNING', (data) => {
            console.warn('[import]', data.warnings);
            this._gameView.showWarnings(data.warnings);
        });

        try {
            this._songs = await this._play.loadSongList();
            this.goTo('start');
        } catch (err) {
            this.goTo('error', { message: err.message });
        }
    }

    /** @private */
    _toggleFullscreen() {
        if (!document.fullscreenElement) {
            this._container.requestFullscreen?.() || this._container.webkitRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() || document.webkitExitFullscreen?.();
        }
    }

    /** @private */
    _setStartShellMode(isStart) {
        if (!this._shell) return;
        this._shell.classList.toggle('app-shell-start', Boolean(isStart));
    }

    /** @private */
    _renderStart() {
        this._statusEl.textContent = `${this._songs.length} song(s) ready`;
        this._footerEl.innerHTML = '';

        this._gameView.showStartScreen({
            songCount: this._songs.length,
            onStart: () => this.goTo('menu'),
            onSettings: () => this.goTo('menu'),
        });
    }

    /** @private */
    _renderMenu() {
        this._statusEl.textContent = `${this._songs.length} song(s) available`;
        this._gameView.showSongList(this._songs);
        this._footerEl.innerHTML = '';

        const list = this._container.querySelector('.song-list');
        if (list) {
            list.addEventListener('click', (e) => {
                const item = e.target.closest('[data-song-id]');
                if (!item) return;
                this._onSelectSong(item.dataset.songId);
            });
        }
    }

    /** @private */
    async _onSelectSong(songId) {
        this.goTo('loading');
        this._statusEl.textContent = 'Loading song details…';

        try {
            const details = await this._play.selectSong(songId);
            if (details.availableCharts && details.availableCharts.length > 0) {
                this._gameView.showChartOptions(details.availableCharts);
                this._statusEl.textContent = `${details.title} — choose difficulty`;
                this._currentScene = 'menu';

                const opts = this._container.querySelector('.chart-options');
                if (opts) {
                    opts.addEventListener('click', (e) => {
                        const btn = e.target.closest('[data-chart-id]');
                        if (!btn) return;
                        this._onSelectChart(btn.dataset.chartId);
                    });
                }
            }
        } catch (err) {
            this.goTo('error', { message: err.message });
        }
    }

    /** @private */
    async _onSelectChart(chartId) {
        this.goTo('loading');
        this._statusEl.textContent = 'Loading chart…';

        try {
            await this._play.load(chartId);
            this._input.setKeymap(this._play.getKeymap());
            this._statusEl.textContent = 'Ready';
            this._currentScene = 'ready';

            this._footerEl.innerHTML = '';
            const btnPlay = document.createElement('button');
            btnPlay.className = 'btn primary';
            btnPlay.textContent = 'PLAY';
            btnPlay.addEventListener('click', () => this._onPlay());
            this._footerEl.appendChild(btnPlay);

            const btnBack = document.createElement('button');
            btnBack.className = 'btn';
            btnBack.textContent = 'BACK';
            btnBack.addEventListener('click', () => this.goTo('menu'));
            this._footerEl.appendChild(btnBack);
        } catch (err) {
            this.goTo('error', { message: err.message });
        }
    }

    /** @private */
    async _onPlay() {
        try {
            this._input.bind();
            this._footerEl.innerHTML = '';

            const btnPause = document.createElement('button');
            btnPause.className = 'btn';
            btnPause.textContent = 'PAUSE';
            btnPause.addEventListener('click', () => this._onPause());
            this._footerEl.appendChild(btnPause);

            this._statusEl.textContent = 'Playing';
            this._currentScene = 'playing';
            await this._play.start();
        } catch (err) {
            this.goTo('error', { message: err.message });
        }
    }

    /** @private */
    _onPause() {
        this._play.pause();
        this._currentScene = 'paused';
        this._statusEl.textContent = 'Paused';
        this._input.unbind();
        this._gameView.showPause();

        this._footerEl.innerHTML = '';
        const btnResume = document.createElement('button');
        btnResume.className = 'btn primary';
        btnResume.textContent = 'RESUME';
        btnResume.addEventListener('click', () => this._onResume());
        this._footerEl.appendChild(btnResume);

        const btnMenu = document.createElement('button');
        btnMenu.className = 'btn';
        btnMenu.textContent = 'MENU';
        btnMenu.addEventListener('click', () => {
            this._play.stopPlayback();
            this.goTo('menu');
        });
        this._footerEl.appendChild(btnMenu);
    }

    /** @private */
    _onResume() {
        this._play.resume();
        this._currentScene = 'playing';
        this._statusEl.textContent = 'Playing';
        this._input.bind();
        this._gameView.hidePause();

        this._footerEl.innerHTML = '';
        const btnPause = document.createElement('button');
        btnPause.className = 'btn';
        btnPause.textContent = 'PAUSE';
        btnPause.addEventListener('click', () => this._onPause());
        this._footerEl.appendChild(btnPause);
    }

    /** @private */
    _renderResult() {
        const st = this._play.getState();
        this._statusEl.textContent = 'Result';

        this._gameView.showResult({
            score: st.score,
            accuracy: st.accuracy,
            maxCombo: st.maxCombo,
            perfect: st.perfectCount,
            great: st.greatCount,
            good: st.goodCount,
            miss: st.missCount,
        });

        this._footerEl.innerHTML = '';
        const btnRestart = document.createElement('button');
        btnRestart.className = 'btn primary';
        btnRestart.textContent = 'RESTART';
        btnRestart.addEventListener('click', async () => {
            try {
                this._input.bind();
                this._footerEl.innerHTML = '';
                const btnPause = document.createElement('button');
                btnPause.className = 'btn';
                btnPause.textContent = 'PAUSE';
                btnPause.addEventListener('click', () => this._onPause());
                this._footerEl.appendChild(btnPause);
                this._statusEl.textContent = 'Playing';
                this._currentScene = 'playing';
                await this._play.restart();
            } catch (err) {
                this.goTo('error', { message: err.message });
            }
        });
        this._footerEl.appendChild(btnRestart);

        const btnMenu = document.createElement('button');
        btnMenu.className = 'btn';
        btnMenu.textContent = 'MENU';
        btnMenu.addEventListener('click', () => {
            this._play.stopPlayback();
            this.goTo('menu');
        });
        this._footerEl.appendChild(btnMenu);
    }
}

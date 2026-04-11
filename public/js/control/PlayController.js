import { ChartValidator } from '../data/ChartValidator.js';
import { ChartAdapter } from '../data/ChartAdapter.js';
import { GameClock } from '../model/GameClock.js';
import { GameEngine } from '../model/GameEngine.js';
import { GameState } from '../model/GameState.js';

/**
 * Orchestrates song selection, chart loading (validate -> adapt), engine lifecycle,
 * audio playback, pause/resume/restart flow.
 */
export class PlayController {
    /**
     * @param {{
     *   songRepo: import('../data/SongRepository.js').SongRepository,
     *   chartRepo: import('../data/ChartRepository.js').ChartRepository,
     *   gameView: import('../view/GameView.js').GameView,
     *   bus: import('../shared/EventBus.js').EventBus,
     * }} deps
     */
    constructor(deps) {
        this._songRepo = deps.songRepo;
        this._chartRepo = deps.chartRepo;
        this._gameView = deps.gameView;
        this._bus = deps.bus;

        this._clock = new GameClock();
        this._state = new GameState();
        this._engine = new GameEngine();

        /** @type {HTMLAudioElement | null} */
        this._audio = null;
        /** @type {number | null} */
        this._raf = null;

        /** @type {object | null} */
        this._currentSong = null;
        /** @type {import('../model/Chart.js').Chart | null} */
        this._chart = null;
        this._importWarnings = [];
    }

    /**
     * Load full song list from API.
     *
     * Args:
     *   None
     *
     * Returns:
     *   Promise<object[]>
     *
     * Raises:
     *   Error: Network/API error.
     */
    async loadSongList() {
        const summaries = await this._songRepo.listSummaries();
        this._bus.emit('SONGS_LOADED', { count: summaries.length });
        return summaries;
    }

    /**
     * Select a song, fetch details.
     *
     * Args:
     *   songId (string): Song id.
     *
     * Returns:
     *   Promise<object>
     *
     * Raises:
     *   Error: Network/API error.
     */
    async selectSong(songId) {
        const details = await this._songRepo.getDetails(songId);
        this._currentSong = details;
        this._bus.emit('SONG_SELECTED', { songId });
        return details;
    }

    /**
     * Select chart, fetch external payload, validate, adapt.
     *
     * Args:
     *   chartId (string): Chart identifier.
     *
     * Returns:
     *   Promise<import('../model/Chart.js').Chart>
     *
     * Raises:
     *   Error: Validation or fetch failure.
     */
    async selectChart(chartId) {
        const raw = await this._chartRepo.getRawChart(chartId);
        const v = ChartValidator.validate(raw);
        if (!v.ok) {
            throw new Error(`Chart validation failed: ${v.errors.join('; ')}`);
        }
        const { chart, importWarnings } = ChartAdapter.toChart(raw);
        this._chart = chart;
        this._importWarnings = importWarnings;

        this._bus.emit('CHART_SELECTED', {
            songId: chart.songId,
            chartId: chart.id,
            difficulty: chart.difficulty,
            stepType: chart.metadata?.stepType,
        });

        return chart;
    }

    /**
     * Full load sequence: select chart, preload audio, init engine.
     *
     * Args:
     *   chartId (string): Chart identifier.
     *
     * Returns:
     *   Promise<void>
     *
     * Raises:
     *   Error: On any failure in the pipeline.
     */
    async load(chartId) {
        await this.selectChart(chartId);

        this.stopPlayback();
        this._state = new GameState();
        this._state.scene = 'loading';

        this._audio = new Audio(this._currentSong.audioUrl);
        this._audio.preload = 'auto';

        await new Promise((resolve, reject) => {
            if (this._audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                return resolve();
            }
            this._audio.addEventListener('canplay', () => resolve(), { once: true });
            this._audio.addEventListener('error', () => reject(new Error('Audio failed to load')), { once: true });
            this._audio.load();
        });

        this._engine.loadChart(this._chart, this._state);
        this._clock = new GameClock();
        this._clock.start(this._audio, this._chart.offsetMs);

        this._state.scene = 'ready';

        this._bus.emit('GAME_LOADED', {
            songId: this._chart.songId,
            chartId: this._chart.id,
            sourceFormat: this._chart.metadata?.sourceFormat,
            stepType: this._chart.metadata?.stepType,
            laneCount: this._chart.laneCount,
            noteCount: this._chart.notes.length,
            importWarnings: this._importWarnings,
        });

        if (this._importWarnings.length) {
            this._bus.emit('IMPORT_WARNING', {
                chartId: this._chart.id,
                warnings: this._importWarnings,
            });
        }
    }

    /**
     * Begin audio-driven play loop.
     *
     * Args:
     *   None
     *
     * Returns:
     *   Promise<void>
     *
     * Raises:
     *   Error: If nothing loaded.
     */
    async start() {
        if (!this._chart || !this._audio) {
            throw new Error('Nothing loaded');
        }

        this._state.scene = 'playing';
        this._state.isRunning = true;
        this._state.isPaused = false;

        await this._audio.play();
        this._bus.emit('GAME_STARTED', {
            songId: this._chart.songId,
            chartId: this._chart.id,
            startTimeMs: this._clock.getCurrentTimeMs(),
        });

        this._startLoop();
    }

    /**
     * Pause gameplay and audio.
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
    pause() {
        if (this._state.scene !== 'playing') return;
        this._state.scene = 'paused';
        this._state.isPaused = true;
        this._clock.pause();
        if (this._audio) this._audio.pause();
        this._cancelLoop();
        this._bus.emit('SCENE_CHANGED', { previousScene: 'playing', nextScene: 'paused' });
    }

    /**
     * Resume from pause.
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
    resume() {
        if (this._state.scene !== 'paused') return;
        this._state.scene = 'playing';
        this._state.isPaused = false;
        this._clock.resume();
        if (this._audio) this._audio.play();
        this._startLoop();
        this._bus.emit('SCENE_CHANGED', { previousScene: 'paused', nextScene: 'playing' });
    }

    /**
     * Restart current chart from beginning.
     *
     * Args:
     *   None
     *
     * Returns:
     *   Promise<void>
     *
     * Raises:
     *   Error: If no chart.
     */
    async restart() {
        if (!this._chart) throw new Error('No chart to restart');
        const chartId = this._chart.id;
        this.stopPlayback();
        this._bus.emit('SCENE_CHANGED', { previousScene: 'result', nextScene: 'loading' });
        await this.load(chartId);
        await this.start();
    }

    /**
     * Called each animation frame.
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
    updateFrame() {
        if (this._state.scene !== 'playing') return;
        const t = this._clock.getCurrentTimeMs();
        const missResults = this._engine.tick(t);

        for (const mr of missResults) {
            this._bus.emit('NOTE_MISSED', {
                noteId: mr.noteId,
                laneIndex: mr.laneIndex,
                currentTimeMs: t,
            });
        }

        const pfHeight = this._gameView.getPlayfieldHeight();
        this._gameView.render(this._engine.getRenderSnapshot(t, pfHeight));
        this._bus.emit('SCORE_UPDATED', {
            score: this._state.score,
            combo: this._state.combo,
            accuracy: this._state.accuracy,
            lastJudgement: this._state.lastJudgement,
        });

        if (this._audio && this._audio.ended) {
            this._finish();
        }
    }

    /**
     * Handle a lane press from InputController.
     *
     * Args:
     *   laneIndex (number): Lane pressed.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    handleLaneInput(laneIndex) {
        if (this._state.scene !== 'playing') return;
        const t = this._clock.getCurrentTimeMs();
        const jr = this._engine.handleLaneInput(laneIndex, t);
        if (!jr) return;
        this._bus.emit('NOTE_HIT', {
            noteId: jr.noteId,
            laneIndex: jr.laneIndex,
            judgement: jr.judgement,
            deltaMs: jr.deltaMs,
            score: jr.awardedScore,
            combo: jr.comboAfterHit,
        });
    }

    /**
     * Stop audio and animation loop.
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
    stopPlayback() {
        this._cancelLoop();
        this._clock.stop();
        if (this._audio) {
            this._audio.pause();
            this._audio.currentTime = 0;
            this._audio = null;
        }
        this._state.isRunning = false;
    }

    /**
     * Get loaded chart keymap.
     *
     * Args:
     *   None
     *
     * Returns:
     *   string[]
     *
     * Raises:
     *   None
     */
    getKeymap() {
        return this._chart ? [...this._chart.keymap] : ['1', '2', '3', '4'];
    }

    /**
     * Expose game state snapshot.
     *
     * Args:
     *   None
     *
     * Returns:
     *   import('../model/GameState.js').GameState
     *
     * Raises:
     *   None
     */
    getState() {
        return this._state;
    }

    /** @private */
    _startLoop() {
        this._cancelLoop();
        const loop = () => {
            this.updateFrame();
            if (this._state.scene === 'playing') {
                this._raf = requestAnimationFrame(loop);
            }
        };
        this._raf = requestAnimationFrame(loop);
    }

    /** @private */
    _cancelLoop() {
        if (this._raf != null) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
    }

    /** @private */
    _finish() {
        this._cancelLoop();
        this._state.scene = 'result';
        this._state.isRunning = false;
        this._clock.stop();
        this._bus.emit('GAME_FINISHED', {
            songId: this._chart?.songId,
            chartId: this._chart?.id,
            score: this._state.score,
            accuracy: this._state.accuracy,
            maxCombo: this._state.maxCombo,
            judgementCounts: {
                perfect: this._state.perfectCount,
                great: this._state.greatCount,
                good: this._state.goodCount,
                miss: this._state.missCount,
            },
        });
    }
}

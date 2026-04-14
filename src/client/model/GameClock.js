/**
 * Audio element is the single source of truth for gameplay time.
 * Supports start / pause / resume / stop lifecycle.
 */
export class GameClock {
    constructor() {
        /** @type {HTMLAudioElement | null} */
        this._audio = null;
        this._offsetMs = 0;
        this._running = false;
    }

    /**
     * Start clock bound to an audio element.
     *
     * Args:
     *   audioElement (HTMLAudioElement): Loaded audio.
     *   calibrationOffsetMs (number): Chart offset in ms.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    start(audioElement, calibrationOffsetMs = 0) {
        this._audio = audioElement;
        this._offsetMs = calibrationOffsetMs;
        this._running = true;
    }

    /**
     * Pause clock (audio still bound).
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
        this._running = false;
    }

    /**
     * Resume after pause.
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
        this._running = true;
    }

    /**
     * Stop and detach audio.
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
    stop() {
        this._running = false;
        this._audio = null;
    }

    /**
     * Current gameplay time in ms from audio + offset.
     *
     * Args:
     *   None
     *
     * Returns:
     *   number
     *
     * Raises:
     *   None
     */
    getCurrentTimeMs() {
        if (!this._audio) return this._offsetMs;
        return this._audio.currentTime * 1000 + this._offsetMs;
    }

    /**
     * Whether the clock is in running state.
     *
     * Args:
     *   None
     *
     * Returns:
     *   boolean
     *
     * Raises:
     *   None
     */
    isRunning() {
        return this._running;
    }
}

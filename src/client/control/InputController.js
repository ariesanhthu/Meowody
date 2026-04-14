import { EventBus } from '../shared/EventBus.js';

/**
 * Maps keyboard keys to lane indices; emits lane events. No judgement computation.
 */
export class InputController {
    /**
     * @param {EventBus} bus
     */
    constructor(bus) {
        this._bus = bus;
        /** @type {string[]} */
        this._keymap = ['1', '2', '3', '4'];
        this._onKeyDown = this._onKeyDown.bind(this);
        this._bound = false;
    }

    /**
     * Set current keymap (lane-index order).
     *
     * Args:
     *   keymap (string[]): Array of key strings per lane.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    setKeymap(keymap) {
        this._keymap = keymap.map(String);
    }

    /**
     * Start listening to keyboard input.
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
    bind() {
        if (this._bound) return;
        window.addEventListener('keydown', this._onKeyDown);
        this._bound = true;
    }

    /**
     * Stop listening.
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
    unbind() {
        if (!this._bound) return;
        window.removeEventListener('keydown', this._onKeyDown);
        this._bound = false;
    }

    /** @param {KeyboardEvent} ev */
    _onKeyDown(ev) {
        const idx = this._keymap.indexOf(ev.key);
        if (idx < 0) return;
        ev.preventDefault();
        this._bus.emit('input:lane', { laneIndex: idx, key: ev.key });
    }
}

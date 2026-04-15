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
        this._onPointerDown = this._onPointerDown.bind(this);
        this._bound = false;
        /** @type {HTMLElement | null} */
        this._pointerTarget = null;
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
     * Set pointer input target (lane grid element).
     *
     * Args:
     *   el (HTMLElement | null): Target element that receives pointer input.
     *
     * Returns:
     *   void
     */
    setPointerTarget(el) {
        if (this._bound && this._pointerTarget) {
            this._pointerTarget.removeEventListener('pointerdown', this._onPointerDown);
        }

        this._pointerTarget = el;

        if (this._bound && this._pointerTarget) {
            this._pointerTarget.addEventListener('pointerdown', this._onPointerDown);
        }
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
        this._pointerTarget?.addEventListener('pointerdown', this._onPointerDown);
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
        this._pointerTarget?.removeEventListener('pointerdown', this._onPointerDown);
        this._bound = false;
    }

    /** @param {KeyboardEvent} ev */
    _onKeyDown(ev) {
        const idx = this._keymap.indexOf(ev.key);
        if (idx < 0) return;
        ev.preventDefault();
        this._bus.emit('input:lane', { laneIndex: idx, key: ev.key });
    }

    /** @param {PointerEvent} ev */
    _onPointerDown(ev) {
        if (ev.button !== 0 || !this._pointerTarget) return;

        let laneIndex = -1;
        const laneEl = ev.target instanceof Element
            ? ev.target.closest('.lane[data-lane]')
            : null;

        if (laneEl) {
            laneIndex = Number(laneEl.dataset.lane);
        } else {
            const rect = this._pointerTarget.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            if (x < 0 || x > rect.width || rect.width <= 0) return;
            laneIndex = Math.floor((x / rect.width) * this._keymap.length);
        }

        if (!Number.isInteger(laneIndex) || laneIndex < 0 || laneIndex >= this._keymap.length) {
            return;
        }

        ev.preventDefault();
        this._bus.emit('input:lane', {
            laneIndex,
            key: this._keymap[laneIndex],
            source: 'pointer',
        });
    }
}

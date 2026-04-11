/**
 * Minimal pub/sub for cross-module events. No gameplay rules.
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();
    }

    /**
     * Subscribe to an event name.
     *
     * Args:
     *   event (string): Event channel.
     *   handler (Function): Callback invoked with optional payload.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    on(event, handler) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(handler);
    }

    /**
     * Unsubscribe a handler.
     *
     * Args:
     *   event (string): Event channel.
     *   handler (Function): Same function reference passed to on().
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    off(event, handler) {
        this._listeners.get(event)?.delete(handler);
    }

    /**
     * Emit an event to subscribers.
     *
     * Args:
     *   event (string): Event channel.
     *   payload (any): Optional data.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    emit(event, payload) {
        const set = this._listeners.get(event);
        if (!set) return;
        for (const fn of set) {
            fn(payload);
        }
    }
}

/**
 * Renders colored lane columns with per-lane receptor glow. Supports pressed state via class toggle.
 */
export class LaneView {
    constructor() {
        /** @type {HTMLElement[]} */
        this._lanes = [];
        this._pressTimers = {};
    }

    /**
     * Build lane columns with receptors.
     *
     * Args:
     *   container (HTMLElement): Parent for lanes.
     *   laneCount (number): Number of lanes.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    render(container, laneCount) {
        container.innerHTML = '';
        this._lanes = [];
        for (let i = 0; i < laneCount; i++) {
            const lane = document.createElement('div');
            lane.className = 'lane';
            lane.dataset.lane = String(i);
            const receptor = document.createElement('div');
            receptor.className = 'lane-receptor';
            lane.appendChild(receptor);
            container.appendChild(lane);
            this._lanes.push(lane);
        }
    }

    /**
     * Flash a lane pressed state for a brief duration.
     *
     * Args:
     *   laneIndex (number): Lane to flash.
     *   durationMs (number): Flash duration.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    flashPressed(laneIndex, durationMs = 100) {
        const lane = this._lanes[laneIndex];
        if (!lane) return;
        lane.classList.add('pressed');
        clearTimeout(this._pressTimers[laneIndex]);
        this._pressTimers[laneIndex] = setTimeout(() => {
            lane.classList.remove('pressed');
        }, durationMs);
    }

    /**
     * Get the lane DOM elements.
     *
     * Args:
     *   None
     *
     * Returns:
     *   HTMLElement[]
     *
     * Raises:
     *   None
     */
    getLanes() {
        return this._lanes;
    }
}

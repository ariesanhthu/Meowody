/** @typedef {import('../model/DataModels.js').RenderSnapshot} RenderSnapshot */

/**
 * Displays score, combo, accuracy with improved visual hierarchy. Futuristic layout.
 */
export class HUDView {
    constructor() {
        /** @type {HTMLElement | null} */
        this._root = null;
        this._els = {};
    }

    /**
     * Mount HUD into host.
     *
     * Args:
     *   host (HTMLElement): Container.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    mount(host) {
        this._root = host;
        this._root.innerHTML = `
            <div class="hud">
                <div class="hud-block">
                    <span class="hud-label">Score</span>
                    <span class="hud-value" id="hud-score">0</span>
                </div>
                <div class="hud-block hud-combo-wrap">
                    <span class="hud-label">Combo</span>
                    <span class="hud-combo-value" id="hud-combo">0</span>
                </div>
                <div class="hud-block">
                    <span class="hud-label">Accuracy</span>
                    <span class="hud-value" id="hud-acc">0.0%</span>
                </div>
            </div>
        `;
        this._els = {
            combo: this._root.querySelector('#hud-combo'),
            score: this._root.querySelector('#hud-score'),
            acc: this._root.querySelector('#hud-acc'),
        };
    }

    /**
     * Update HUD values from render snapshot.
     *
     * Args:
     *   snapshot (RenderSnapshot): Latest frame data.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    render(snapshot) {
        if (!this._els.combo) return;
        this._els.combo.textContent = String(snapshot.combo);
        this._els.score.textContent = String(snapshot.score);
        this._els.acc.textContent = (snapshot.accuracy * 100).toFixed(1) + '%';
    }
}

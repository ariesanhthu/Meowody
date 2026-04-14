/**
 * Fullscreen visual effects (e.g. PERFECT rainbow bloom).
 * Purely presentation-layer; no gameplay logic here.
 */
export class ScreenEffectView {
    constructor() {
        this._overlayEl = null;
        this._rainbowEl = null;
        this._rainbow2El = null;
        this._pulseEl = null;
        this._timeline = null;
        this._lastPerfectAt = 0;
        this._perfectChain = 0;
    }

    /**
     * Mount fullscreen effect DOM inside playfield.
     *
     * Args:
     *   host (HTMLElement): Playfield host.
     *
     * Returns:
     *   void
     */
    mount(host) {
        if (!host || this._overlayEl) return;

        const overlay = document.createElement('div');
        overlay.className = 'gs-perfect-overlay';
        overlay.innerHTML = `
            <div class="gs-perfect-pulse"></div>
            <div class="gs-perfect-rainbow"></div>
            <div class="gs-perfect-rainbow-2"></div>
        `;
        host.appendChild(overlay);

        this._overlayEl = overlay;
        this._pulseEl = overlay.querySelector('.gs-perfect-pulse');
        this._rainbowEl = overlay.querySelector('.gs-perfect-rainbow');
        this._rainbow2El = overlay.querySelector('.gs-perfect-rainbow-2');
        this._primeEffectState();
    }

    /**
     * Play fullscreen 7-color perfect effect.
     *
     * Args:
     *   None
     *
     * Returns:
     *   void
     */
    playPerfectEffect() {
        const animeApi = window.anime;
        if (!animeApi || !this._overlayEl || !this._rainbowEl || !this._rainbow2El || !this._pulseEl) return;
        const now = performance.now();
        if (now - this._lastPerfectAt < 90) return;
        if (now - this._lastPerfectAt > 1100) this._perfectChain = 0;
        this._lastPerfectAt = now;
        this._perfectChain = Math.min(this._perfectChain + 1, 8);

        const chainBoost = this._perfectChain / 8; // 0..1
        const speedFactor = 1 - chainBoost * 0.34; // chain càng cao càng nhanh
        const overlayPeak = 0.38 + chainBoost * 0.22; // base mờ hơn, tăng dần
        const rainbowPeak = 0.45 + chainBoost * 0.30;
        const rainbow2Peak = 0.30 + chainBoost * 0.22;
        const pulsePeak = 0.42 + chainBoost * 0.30;

        if (this._timeline) this._timeline.pause();

        animeApi.remove([this._overlayEl, this._rainbowEl, this._rainbow2El, this._pulseEl]);
        this._primeEffectState();

        this._timeline = animeApi.timeline({ easing: 'easeOutCubic' })
            .add({
                targets: this._overlayEl,
                opacity: [
                    { value: overlayPeak, duration: 110 * speedFactor, easing: 'linear' },
                    { value: overlayPeak * 0.92, duration: 330 * speedFactor, easing: 'linear' },
                    { value: 0, duration: 320 * speedFactor, easing: 'easeInQuad' },
                ],
            }, 0)
            .add({
                targets: this._pulseEl,
                opacity: [
                    { value: pulsePeak, duration: 120 * speedFactor, easing: 'easeOutQuad' },
                    { value: 0, duration: 340 * speedFactor, easing: 'easeInQuad' },
                ],
                scale: [0.2, 5.1 + chainBoost * 1.2],
                duration: 460 * speedFactor,
                easing: 'easeOutCubic',
            }, 0)
            .add({
                targets: this._rainbowEl,
                opacity: [
                    { value: rainbowPeak, duration: 130 * speedFactor, easing: 'easeOutQuad' },
                    { value: rainbowPeak * 0.58, duration: 260 * speedFactor, easing: 'linear' },
                    { value: 0, duration: 340 * speedFactor, easing: 'easeInQuad' },
                ],
                scale: [
                    { value: 1.01 + chainBoost * 0.12, duration: 300 * speedFactor, easing: 'easeOutCubic' },
                    { value: 1.09 + chainBoost * 0.13, duration: 430 * speedFactor, easing: 'easeOutQuad' },
                ],
                duration: 730 * speedFactor,
            }, 0)
            .add({
                targets: this._rainbow2El,
                opacity: [
                    { value: rainbow2Peak, duration: 150 * speedFactor, easing: 'easeOutQuad' },
                    { value: rainbow2Peak * 0.52, duration: 220 * speedFactor, easing: 'linear' },
                    { value: 0, duration: 320 * speedFactor, easing: 'easeInQuad' },
                ],
                scale: [0.9, 1.06 + chainBoost * 0.22],
                rotate: [0, 8 + chainBoost * 14],
                duration: 690 * speedFactor,
            }, 30 * speedFactor);
    }

    /**
     * Reset progressive perfect intensity (call on MISS).
     *
     * Args:
     *   None
     *
     * Returns:
     *   void
     */
    resetPerfectProgress() {
        this._perfectChain = 0;
        this._lastPerfectAt = 0;
        if (this._timeline) {
            this._timeline.pause();
            this._timeline = null;
        }
        const animeApi = window.anime;
        if (animeApi && this._overlayEl && this._rainbowEl && this._rainbow2El && this._pulseEl) {
            animeApi.remove([this._overlayEl, this._rainbowEl, this._rainbow2El, this._pulseEl]);
        }
        this._primeEffectState();
    }

    /** @private */
    _primeEffectState() {
        if (!this._overlayEl || !this._rainbowEl || !this._rainbow2El || !this._pulseEl) return;
        this._overlayEl.style.opacity = '0';
        this._rainbowEl.style.opacity = '0';
        this._rainbow2El.style.opacity = '0';
        this._pulseEl.style.opacity = '0';
        this._rainbowEl.style.transform = 'translate3d(0,0,0) scale(0.82)';
        this._rainbow2El.style.transform = 'translate3d(0,0,0) scale(0.88) rotate(0deg)';
        this._pulseEl.style.transform = 'translateX(-50%) translate3d(0,0,0) scale(0.2)';
    }
}

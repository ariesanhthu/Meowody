/**
 * Renders colored lane columns with per-lane receptor glow. Supports pressed state via class toggle.
 */
const LANE_WAVE_RGB = [
    [255, 110, 185], // lane 0
    [70, 200, 255],  // lane 1
    [120, 235, 150], // lane 2
    [255, 185, 90],  // lane 3
];

const JUDGEMENT_WAVE_PROFILE = {
    good: { peakOpacity: 0.72, midOpacity: 0.34, durationMs: 460, scalePeak: 1.05 },
    great: { peakOpacity: 0.98, midOpacity: 0.52, durationMs: 540, scalePeak: 1.12 },
};

export class LaneView {
    constructor() {
        /** @type {HTMLElement[]} */
        this._lanes = [];
        this._pressTimers = {};
        this._waveAnimations = {};
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
        this._waveAnimations = {};
        for (let i = 0; i < laneCount; i++) {
            const lane = document.createElement('div');
            lane.className = 'lane';
            lane.dataset.lane = String(i);
            const base = document.createElement('div');
            base.className = 'lane-base';
            const wave = document.createElement('div');
            wave.className = 'lane-wave';
            const receptor = document.createElement('div');
            receptor.className = 'lane-receptor';
            const content = document.createElement('div');
            content.className = 'lane-content';
            content.appendChild(receptor);
            lane.appendChild(base);
            lane.appendChild(wave);
            lane.appendChild(content);
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
     * Play sea-wave overlay effect for lane judgement.
     *
     * Args:
     *   laneIndex (number): Lane index.
     *   judgement (string): Judgement label.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    playJudgementEffect(laneIndex, judgement) {
        const lane = this._lanes[laneIndex];
        const animeApi = window.anime;
        if (!lane || !animeApi) return;

        const waveEl = lane.querySelector('.lane-wave');
        if (!waveEl) return;
        const profile = JUDGEMENT_WAVE_PROFILE[judgement];
        if (!profile) return;

        const [r, g, b] = LANE_WAVE_RGB[laneIndex] || LANE_WAVE_RGB[0];
        const crestA = Math.min(profile.peakOpacity, 1).toFixed(2);
        const midA = Math.min(profile.midOpacity, 1).toFixed(2);

        waveEl.style.background = `
            radial-gradient(circle at 50% 100%, rgba(${r}, ${g}, ${b}, ${crestA}), transparent 42%),
            linear-gradient(
                to top,
                rgba(${r}, ${g}, ${b}, ${crestA}) 0%,
                rgba(${r}, ${g}, ${b}, ${midA}) 32%,
                rgba(${r}, ${g}, ${b}, 0.14) 66%,
                rgba(255, 255, 255, 0) 100%
            )
        `;

        if (this._waveAnimations[laneIndex]) {
            this._waveAnimations[laneIndex].pause();
        }

        animeApi.remove(waveEl);

        waveEl.style.opacity = '0';
        waveEl.style.transform = 'translateY(100%) scaleY(0.9)';

        this._waveAnimations[laneIndex] = animeApi({
            targets: waveEl,
            translateY: ['100%', '-8%'],
            scaleY: [0.9, profile.scalePeak, 1.0],
            opacity: [
                { value: profile.peakOpacity, duration: 90, easing: 'easeOutQuad' },
                { value: profile.midOpacity, duration: 180, easing: 'linear' },
                { value: 0.0, duration: 220, easing: 'easeInQuad' },
            ],
            duration: profile.durationMs,
            easing: 'easeOutCubic',
        });
    }

    /**
     * Backward-compatible alias for GOOD effect.
     *
     * Args:
     *   laneIndex (number): Lane index.
     *
     * Returns:
     *   void
     */
    playGoodEffect(laneIndex) {
        this.playJudgementEffect(laneIndex, 'good');
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

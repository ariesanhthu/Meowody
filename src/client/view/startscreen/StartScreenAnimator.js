const animeApi = typeof window !== 'undefined' ? window.anime : null;

function _readAngleDeg(value, fallback = 9) {
    const amount = Number.parseFloat(String(value || '').trim());
    return Number.isFinite(amount) ? amount : fallback;
}

/**
 * Handles entrance and idle animation for the start screen.
 */
export class StartScreenAnimator {
    /**
     * @param {HTMLElement | null} root
     */
    constructor(root) {
        this._root = root;
        this._animations = [];
        this._isExiting = false;
    }

    start() {
        if (!animeApi || !this._root) return;

        const logo = this._root.querySelector('.start-logo');
        const catWrap = this._root.querySelector('.start-cat-wrap');
        const actions = this._root.querySelector('.start-actions');
        const meta = this._root.querySelector('.start-meta');
        const tail = this._root.querySelector('.start-cat-tail');
        const guitar = this._root.querySelector('.start-cat-guitar');
        const setting = this._root.querySelector('.start-btn-setting');
        const play = this._root.querySelector('.start-btn-play');
        const ring = this._root.querySelector('.start-btn-ring');
        const cat_right = this._root.querySelector('.start-cat-right');
        const particles = this._root.querySelectorAll('.start-particle');

        const intro = animeApi.timeline({ easing: 'easeOutCubic', duration: 700 });
        intro
            .add({
                targets: [catWrap, logo],
                opacity: [0, 1],
                translateY: [32, 0],
                delay: animeApi.stagger(120),
            })
            .add(
                {
                    targets: [actions, meta],
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 440,
                },
                '-=300',
            )
            .add(
                {
                    targets: particles,
                    opacity: [0, 1],
                    '--float-scale': ['0.65', '1'],
                    delay: animeApi.stagger(70),
                    duration: 460,
                },
                '-=380',
            );

        this._animations.push(intro);

        if (tail) {
            this._animations.push(
                animeApi({
                    targets: tail,
                    rotate: [-8, 10],
                    duration: 1500,
                    delay: 600,
                    easing: 'easeInOutSine',
                    direction: 'alternate',
                    loop: true,
                }),
            );
        }

        
        if (cat_right) {
            this._animations.push(
                animeApi({
                    targets: cat_right,
                    rotate: [0, -8, 0, 6, 0],
                    translateY: [0, -6, 0],
                    duration: 1600,
                    delay: 500,
                    easing: 'easeInOutSine',
                    loop: true,
                }),
            );
        }

        if (guitar) {
            this._animations.push(
                animeApi({
                    targets: guitar,
                    rotate: [0, -4, 0, 4, 0],
                    translateY: [0, -6, 0],
                    duration: 1600,
                    delay: 500,
                    easing: 'easeInOutSine',
                    loop: true,
                }),
            );
        }

        if (setting) {
            this._animations.push(
                animeApi({
                    targets: setting,
                    rotate: ['0deg', '360deg'],
                    duration: 9000,
                    easing: 'linear',
                    loop: true,
                }),
            );
        }

        if (play) {
            this._animations.push(
                animeApi({
                    targets: play,
                    scale: [1, 1.06, 1],
                    duration: 1600,
                    easing: 'easeInOutSine',
                    loop: true,
                }),
            );
        }

        if (ring) {
            this._animations.push(
                animeApi({
                    targets: ring,
                    opacity: [0.85, 0],
                    scale: [0.76, 1.25],
                    duration: 1600,
                    easing: 'easeOutQuad',
                    loop: true,
                }),
            );
        }

        particles.forEach((particle, index) => {
            const swingRaw = getComputedStyle(particle).getPropertyValue('--swing').trim() || '9deg';
            const swingDeg = _readAngleDeg(swingRaw, 9);
            const swingAtPeak = index % 2 === 0 ? -swingDeg : swingDeg;
            const motion = { y: 0, rot: 0 };

            this._animations.push(
                animeApi({
                    targets: motion,
                    y: [0, -12, 0],
                    rot: [0, swingAtPeak, 0],
                    duration: 1500 + index * 100,
                    delay: 350 + index * 80,
                    easing: 'easeInOutSine',
                    loop: true,
                    update: () => {
                        particle.style.setProperty('--float-y', `${motion.y}px`);
                        particle.style.setProperty('--float-rot', `${motion.rot}deg`);
                    },
                }),
            );
        });
    }

    playExit(onComplete) {
        if (this._isExiting) return;
        this._isExiting = true;

        if (!animeApi || !this._root) {
            onComplete?.();
            return;
        }

        this._animations.forEach((anim) => {
            if (anim && typeof anim.pause === 'function') {
                anim.pause();
            }
        });
        this._animations = [];

        const movingTargets = this._root.querySelectorAll(
            '.start-logo, .start-cat-wrap, .start-actions, .start-meta',
        );
        const particleTargets = this._root.querySelectorAll('.start-particle');

        const outro = animeApi.timeline({
            duration: 320,
            easing: 'easeInCubic',
            complete: () => onComplete?.(),
        });

        outro.add({
            targets: movingTargets,
            opacity: [1, 0],
            translateY: [0, 18],
        });

        outro.add(
            {
                targets: particleTargets,
                opacity: [1, 0],
                duration: 220,
                easing: 'linear',
            },
            0,
        );
    }

    stop() {
        if (!this._root) return;

        this._animations.forEach((anim) => {
            if (anim && typeof anim.pause === 'function') {
                anim.pause();
            }
        });
        this._animations = [];

        if (animeApi) {
            animeApi.remove(this._root.querySelectorAll('*'));
        }
    }
}

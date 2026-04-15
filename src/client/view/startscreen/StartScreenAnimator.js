function getAnimeApi() {
    return typeof globalThis !== 'undefined' ? globalThis.anime : null;
}

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
        this._introTimeline = null;
        this._isExiting = false;
        this._started = false;
    }

    start() {
        const animeApi = getAnimeApi();
        if (!animeApi || !this._root) return;

        // Quan trọng: chặn start chồng lên start cũ
        if (this._started) return;

        // Nếu có animation rác từ vòng trước thì dọn sạch
        this.stop(false);

        const { animate, createTimeline, remove } = animeApi;

        const logo = this._root.querySelector('.start-logo');
        const catWrap = this._root.querySelector('.start-cat-wrap');
        const actions = this._root.querySelector('.start-actions');
        const meta = this._root.querySelector('.start-meta');
        const tail = this._root.querySelector('.start-cat-tail');
        const guitar = this._root.querySelector('.start-cat-guitar');
        const setting = this._root.querySelector('.start-btn-setting');
        const play = this._root.querySelector('.start-btn-play');
        const ring = this._root.querySelector('.start-btn-ring');
        const catRight = this._root.querySelector('.start-cat-right');
        const particles = this._root.querySelectorAll('.start-particle');

        // Dọn animation cũ trên DOM trước khi animate mới
        remove(this._root.querySelectorAll('*'));

        this._started = true;
        this._isExiting = false;

        const introTargets = [];
        if (logo) introTargets.push(logo);
        if (catWrap) introTargets.push(catWrap);
        if (actions) introTargets.push(actions);
        if (meta) introTargets.push(meta);

        if (!introTargets.length && particles.length === 0) {
            this._startIdleLoops({ tail, catRight, guitar, setting, play, ring, particles }, animate);
            return;
        }

        this._introTimeline = createTimeline({
            defaults: {
                ease: 'outQuad',
            },
            onComplete: () => {
                this._introTimeline = null;
                if (!this._started || this._isExiting) return;
                this._startIdleLoops({ tail, catRight, guitar, setting, play, ring, particles }, animate);
            },
        });

        if (logo) {
            this._introTimeline.add(logo, {
                opacity: [0, 1],
                scale: [0.94, 1],
                translateY: [24, 0],
                duration: 760,
                ease: 'out(4)',
            });
        }

        if (catWrap) {
            this._introTimeline.add(
                catWrap,
                {
                    opacity: [0, 1],
                    scale: [0.96, 1],
                    translateX: [-28, 0],
                    duration: 740,
                    ease: 'out(4)',
                },
                '-=620',
            );
        }

        if (actions) {
            this._introTimeline.add(
                actions,
                {
                    opacity: [0, 1],
                    duration: 500,
                },
                '-=440',
            );
        }

        if (meta) {
            this._introTimeline.add(
                meta,
                {
                    opacity: [0, 1],
                    translateY: [12, 0],
                    duration: 460,
                },
                '-=430',
            );
        }

        if (particles.length) {
            this._introTimeline.add(
                Array.from(particles),
                {
                    opacity: [0, 1],
                    duration: 420,
                    ease: 'outQuad',
                    delay: (_el, i) => i * 24,
                },
                '-=640',
            );
        }
    }

    _startIdleLoops(nodes, animate) {
        const { tail, catRight, guitar, setting, play, ring, particles } = nodes;

        if (tail) {
            this._animations.push(
                animate(tail, {
                    rotate: [-8, 10],
                    duration: 1500,
                    delay: 600,
                    ease: 'inOutSine',
                    alternate: true,
                    loop: true,
                }),
            );
        }

        if (catRight) {
            this._animations.push(
                animate(catRight, {
                    rotate: [0, -8, 0, 6, 0],
                    translateY: [0, -6, 0],
                    duration: 1600,
                    delay: 500,
                    ease: 'inOutSine',
                    loop: true,
                }),
            );
        }

        if (guitar) {
            this._animations.push(
                animate(guitar, {
                    rotate: [0, -4, 0, 4, 0],
                    translateY: [0, -6, 0],
                    duration: 1600,
                    delay: 500,
                    ease: 'inOutSine',
                    loop: true,
                }),
            );
        }

        if (setting) {
            this._animations.push(
                animate(setting, {
                    rotate: ['0deg', '360deg'],
                    duration: 9000,
                    ease: 'linear',
                    loop: true,
                }),
            );
        }

        if (play) {
            this._animations.push(
                animate(play, {
                    scale: [1, 1.06, 1],
                    duration: 1600,
                    ease: 'inOutSine',
                    loop: true,
                }),
            );
        }

        if (ring) {
            this._animations.push(
                animate(ring, {
                    opacity: [0.8, 0],
                    scale: [0.78, 1.24],
                    duration: 1600,
                    ease: 'outQuad',
                    loop: true,
                    loopDelay: 120,
                }),
            );
        }

        particles.forEach((particle, index) => {
            const swingRaw = getComputedStyle(particle).getPropertyValue('--swing').trim() || '9deg';
            const swingDeg = _readAngleDeg(swingRaw, 9);
            const swingAtPeak = index % 2 === 0 ? -swingDeg : swingDeg;
            const motion = { translateY: 0, rotate: 0 };

            this._animations.push(
                animate(motion, {
                    translateY: [0, -12, 0],
                    rotate: [0, swingAtPeak, 0],
                    duration: 1500 + index * 100,
                    delay: 350 + index * 80,
                    ease: 'inOutSine',
                    loop: true,
                    onUpdate: () => {
                        particle.style.setProperty('--float-y', `${motion.translateY}px`);
                        particle.style.setProperty('--float-rot', `${motion.rotate}deg`);
                    },
                }),
            );
        });
    }

    playExit(onComplete) {
        if (this._isExiting) return;
        this._isExiting = true;

        const animeApi = getAnimeApi();
        if (!animeApi || !this._root) {
            this._started = false;
            onComplete?.();
            return;
        }

        const { createTimeline } = animeApi;

        if (this._introTimeline && typeof this._introTimeline.pause === 'function') {
            this._introTimeline.pause();
            this._introTimeline = null;
        }

        this._animations.forEach((anim) => {
            if (anim && typeof anim.pause === 'function') {
                anim.pause();
            }
        });
        this._animations = [];

        const movingTargets = this._root.querySelectorAll('.start-logo, .start-cat-wrap, .start-meta');
        const actionTargets = this._root.querySelectorAll('.start-actions');
        const particleTargets = this._root.querySelectorAll('.start-particle');

        const outro = createTimeline({
            defaults: {
                duration: 480,
                ease: 'inOutQuad',
            },
            onComplete: () => {
                this._started = false;
                this._isExiting = false;
                onComplete?.();
            },
        });

        if (movingTargets.length) {
            outro.add(movingTargets, {
                opacity: { to: 0 },
                translateY: { to: 14 },
                scale: { to: 0.98 },
            });
        }

        if (actionTargets.length) {
            outro.add(
                actionTargets,
                {
                    opacity: { to: 0 },
                    duration: 360,
                    ease: 'inQuad',
                },
                0,
            );
        }

        if (particleTargets.length) {
            outro.add(
                Array.from(particleTargets),
                {
                    opacity: { to: 0 },
                    duration: 300,
                    ease: 'inQuad',
                    delay: (_el, i) => i * 18,
                },
                0,
            );
        }

        if (!movingTargets.length && !actionTargets.length && !particleTargets.length) {
            this._started = false;
            this._isExiting = false;
            onComplete?.();
        }
    }

    stop(resetStarted = true) {
        if (!this._root) return;
        const animeApi = getAnimeApi();

        this._animations.forEach((anim) => {
            if (anim && typeof anim.pause === 'function') {
                anim.pause();
            }
        });
        this._animations = [];

        if (this._introTimeline && typeof this._introTimeline.pause === 'function') {
            this._introTimeline.pause();
            this._introTimeline = null;
        }

        if (animeApi) {
            animeApi.remove(this._root.querySelectorAll('*'));
        }

        this._isExiting = false;
        if (resetStarted) {
            this._started = false;
        }
    }
}
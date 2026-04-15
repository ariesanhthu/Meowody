    /**
     * Client entry: boot SceneController.
     */
    import { SceneController } from './control/SceneController.js';

    const INTRO_SEEN_KEY = 'mewody_intro_seen_v1';
    const INTRO_FADE_MS = 420;

    const root = document.getElementById('game-container');
    const introScreen = document.getElementById('intro-screen');
    const introVideo = document.getElementById('intro-video');
    const skipBtn = document.getElementById('intro-skip');
    const soundBtn = document.getElementById('intro-sound');
    const introLoadingText = document.getElementById('intro-loading-text');

    if (root) {
        const scenes = new SceneController(root);
        const hasSeenIntro = readIntroSeenFlag();

        if (
            hasSeenIntro ||
            !introScreen ||
            !(introVideo instanceof HTMLVideoElement) ||
            !(skipBtn instanceof HTMLButtonElement) ||
            !(soundBtn instanceof HTMLButtonElement)
        ) {
            if (introScreen) introScreen.remove();
            bootGame(scenes, root);
        } else {
            document.body.classList.add('show-intro');
            playIntroAndBoot(scenes, root, {
                introScreen,
                introVideo,
                skipBtn,
                soundBtn,
                introLoadingText,
            });
        }
    }

    function bootGame(scenes, root) {
        scenes.init().catch((err) => {
            console.error(err);
            root.textContent = `Fatal: ${err.message}`;
        });
    }

    function playIntroAndBoot(scenes, root, intro) {
        const { introScreen, introVideo, skipBtn, soundBtn, introLoadingText } = intro;
        let appReady = false;
        let videoDone = false;
        let finalized = false;

        scenes
            .init()
            .then(() => {
                appReady = true;
                tryEnterGame();
            })
            .catch((err) => {
                console.error(err);
                root.textContent = `Fatal: ${err.message}`;
                completeIntro(true);
            });

        introVideo.addEventListener('ended', onVideoDone, { once: true });
        introVideo.addEventListener('error', onVideoDone, { once: true });
        skipBtn.addEventListener('click', () => {
            introVideo.pause();
            onVideoDone();
        });
        soundBtn.addEventListener('click', () => {
            introVideo.muted = false;
            introVideo.volume = 1;
            soundBtn.textContent = 'Sound On';
            soundBtn.disabled = true;
            const resumePromise = introVideo.play();
            if (resumePromise && typeof resumePromise.catch === 'function') {
                resumePromise.catch(() => {
                    soundBtn.disabled = false;
                    soundBtn.textContent = 'Retry Sound';
                });
            }
        });

        const playPromise = introVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                onVideoDone();
            });
        }

        function onVideoDone() {
            videoDone = true;
            tryEnterGame();
            if (!appReady && introLoadingText) {
                introLoadingText.textContent = 'Loading assets...';
                skipBtn.disabled = true;
            }
        }

        function tryEnterGame() {
            if (!appReady || !videoDone) return;
            completeIntro(false);
        }

        function completeIntro(force) {
            if (finalized) return;
            finalized = true;
            if (!force && appReady) {
                writeIntroSeenFlag();
            }

            if (!force) {
                introScreen.classList.add('is-hidden');
                window.setTimeout(() => {
                    document.body.classList.remove('show-intro');
                    introScreen.remove();
                }, INTRO_FADE_MS);
                return;
            }
            document.body.classList.remove('show-intro');
            introScreen.remove();
        }
    }

    function readIntroSeenFlag() {
        try {
            return localStorage.getItem(INTRO_SEEN_KEY) === '1';
        } catch {
            return false;
        }
    }

    function writeIntroSeenFlag() {
        try {
            localStorage.setItem(INTRO_SEEN_KEY, '1');
        } catch {
            // Ignore storage errors (private mode / blocked storage).
        }
    }
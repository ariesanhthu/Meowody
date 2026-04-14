import { StartScreenAnimator } from './StartScreenAnimator.js';

const ASSET = {
    white: 'assets/main_screen/white.png',
    logo: 'assets/main_screen/logo.png',
    start: 'assets/main_screen/start.png',
    setting: 'assets/main_screen/setting.png',
    catBody: 'assets/cat/cat_body.png',
    catLeft: 'assets/cat/cat_left.png',
    catRight: 'assets/cat/cat_right.png',
    catShadow: 'assets/cat/cat_shadow.png',
    catTail: 'assets/cat/cat_tail.png',
    guitar: 'assets/cat/guitar.png',
    note: 'assets/particle/note.png',
    doubleNote: 'assets/particle/double_note.png',
    electric: 'assets/particle/electric.png',
    triangle: 'assets/particle/triangle.png',
};

/**
 * Owns start-screen markup and interaction wiring.
 */
export class StartScreenView {
    constructor() {
        this._host = null;
        this._root = null;
        this._animator = null;
        this._playBtn = null;
        this._settingBtn = null;
        this._isLeaving = false;
        this._onPlayClick = null;
        this._onSettingClick = null;
    }

    /**
     * @param {HTMLElement} host
     * @param {{
     *  songCount?: number,
     *  onStart?: () => void,
     *  onSettings?: () => void,
     * }} options
     */
    render(host, options = {}) {
        this.destroy();

        const { songCount = 0, onStart, onSettings } = options;

        this._host = host;
        this._isLeaving = false;
        this._host.classList.add('start-overlay');
        this._host.innerHTML = _template(songCount);

        this._root = this._host.querySelector('.start-screen');
        this._playBtn = this._host.querySelector('[data-action="start"]');
        this._settingBtn = this._host.querySelector('[data-action="settings"]');

        this._onPlayClick = () => {
            this._leave(onStart);
        };
        this._onSettingClick = () => {
            this._leave(onSettings || onStart);
        };

        this._playBtn?.addEventListener('click', this._onPlayClick);
        this._settingBtn?.addEventListener('click', this._onSettingClick);

        this._animator = new StartScreenAnimator(this._root);
        this._animator.start();
    }

    destroy() {
        if (this._playBtn && this._onPlayClick) {
            this._playBtn.removeEventListener('click', this._onPlayClick);
        }
        if (this._settingBtn && this._onSettingClick) {
            this._settingBtn.removeEventListener('click', this._onSettingClick);
        }

        if (this._animator) {
            this._animator.stop();
            this._animator = null;
        }

        if (this._host) {
            this._host.classList.remove('start-overlay');
        }

        this._root = null;
        this._host = null;
        this._playBtn = null;
        this._settingBtn = null;
        this._onPlayClick = null;
        this._onSettingClick = null;
        this._isLeaving = false;
    }

    _leave(callback) {
        if (this._isLeaving) return;
        this._isLeaving = true;

        const done = () => {
            if (typeof callback === 'function') {
                callback();
            }
        };

        if (!this._animator) {
            done();
            return;
        }

        this._animator.playExit(done);
    }
}

function _template(songCount) {
    return `
        <section class="start-screen" aria-label="Start screen">
            <img class="start-bg-white" src="${ASSET.white}" alt="" aria-hidden="true">

            <div class="start-particles" aria-hidden="true">
                <img class="start-particle start-particle-double-note" src="${ASSET.doubleNote}" style="--x: 20%; --y: 16%; --size: 100px; --rot: 0deg;" alt="">
                <img class="start-particle start-particle-double-note" src="${ASSET.doubleNote}" style="--x: 94%; --y: 11%; --size: 80px; --rot: 16deg;" alt="">
                <img class="start-particle start-particle-double-note" src="${ASSET.doubleNote}" style="--x: 79%; --y: 36%; --size: 78px; --rot: -20deg;" alt="">
                <img class="start-particle start-particle-double-note" src="${ASSET.doubleNote}" style="--x: 50%; --y: 84%; --size: 76px; --rot: -10deg;" alt="">
                <img class="start-particle start-particle-electric" src="${ASSET.electric}" style="--x: 43%; --y: 41%; --size: 140px; --rot: 7deg;" alt="">
                <img class="start-particle start-particle-triangle" src="${ASSET.triangle}" style="--x: 8%; --y: 76%; --size: 30px; --rot: -50deg;" alt="">
                <img class="start-particle start-particle-triangle" src="${ASSET.triangle}" style="--x: 40%; --y: 80%; --size: 20px; --rot: 25deg;" alt="">
                <img class="start-particle start-particle-note" src="${ASSET.note}" style="--x: 97%; --y: 58%; --size: 84px; --rot: 20deg;" alt="">
                <img class="start-particle start-particle-note" src="${ASSET.note}" style="--x: 69%; --y: 92%; --size: 72px; --rot: -8deg;" alt="">
                <img class="start-particle start-particle-triangle" src="${ASSET.triangle}" style="--x: 15%; --y: 40%; --size: 44px; --rot: 8deg;" alt="">
                <img class="start-particle start-particle-electric" src="${ASSET.electric}" style="--x: 40%; --y: 35%; --size: 90px; --rot: -26deg;" alt="">
            </div>

            <img class="start-logo" src="${ASSET.logo}" alt="Meowody">

            <div class="start-cat-wrap" aria-hidden="true">
                <img class="start-cat-part start-cat-shadow" src="${ASSET.catShadow}" alt="">
                <img class="start-cat-part start-cat-tail" src="${ASSET.catTail}" alt="">
                <img class="start-cat-part start-cat-body" src="${ASSET.catBody}" alt="">
                <img class="start-cat-part start-cat-left" src="${ASSET.catLeft}" alt="">
                <img class="start-cat-part start-cat-right" src="${ASSET.catRight}" alt="">
                <img class="start-cat-part start-cat-guitar" src="${ASSET.guitar}" alt="">
            </div>

            <div class="start-actions">
                <button class="start-action-btn start-btn-play" type="button" data-action="start" aria-label="Start game">
                    <span class="start-btn-ring" aria-hidden="true"></span>
                    <img src="${ASSET.start}" alt="" aria-hidden="true">
                </button>

                <button class="start-action-btn start-btn-setting" type="button" data-action="settings" aria-label="Open settings">
                    <img src="${ASSET.setting}" alt="" aria-hidden="true">
                </button>
            </div>

            <div class="start-meta">${songCount} songs ready<br>Press play to begin</div>
        </section>
    `;
}

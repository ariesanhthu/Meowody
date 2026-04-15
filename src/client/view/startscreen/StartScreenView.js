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
        this._settingsPanel = null;
        this._settingsErrorEl = null;
        this._bindingBtns = [];
        this._keymap = ['1', '2', '3', '4'];
        this._capturingIndex = null;
        this._isLeaving = false;
        this._onPlayClick = null;
        this._onSettingClick = null;
        this._onSettingsCloseClick = null;
        this._onSettingsSaveClick = null;
        this._onSettingsBackdropClick = null;
        this._onSettingsKeyDown = null;
        this._onBindingClicks = [];
        this._onSaveSettings = null;
    }

    /**
     * @param {HTMLElement} host
     * @param {{
     *  songCount?: number,
     *  onStart?: () => void,
     *  keymap?: string[],
     *  onSaveSettings?: (keymap: string[]) => void,
     * }} options
     */
    render(host, options = {}) {
        this.destroy();

        const {
            songCount = 0,
            onStart,
            keymap = ['1', '2', '3', '4'],
            onSaveSettings,
        } = options;

        this._host = host;
        this._isLeaving = false;
        this._capturingIndex = null;
        this._keymap = this._sanitizeKeymap(keymap);
        this._onSaveSettings = onSaveSettings;
        this._host.classList.add('start-overlay');
        this._host.innerHTML = _template(songCount, this._keymap);

        this._root = this._host.querySelector('.start-screen');
        this._playBtn = this._host.querySelector('[data-action="start"]');
        this._settingBtn = this._host.querySelector('[data-action="settings"]');
        this._settingsPanel = this._host.querySelector('.start-setting-modal');
        this._settingsErrorEl = this._host.querySelector('.start-setting-error');
        this._bindingBtns = Array.from(this._host.querySelectorAll('.start-keybind-btn'));

        const closeBtn = this._host.querySelector('[data-action="close-settings"]');
        const saveBtn = this._host.querySelector('[data-action="save-settings"]');

        this._onPlayClick = () => {
            this._leave(onStart);
        };
        this._onSettingClick = () => {
            this._openSettings();
        };
        this._onSettingsCloseClick = () => {
            this._closeSettings();
        };
        this._onSettingsSaveClick = () => {
            this._saveSettings();
        };
        this._onSettingsBackdropClick = (ev) => {
            if (ev.target === this._settingsPanel) {
                this._closeSettings();
            }
        };
        this._onSettingsKeyDown = (ev) => {
            if (!this._settingsPanel || this._settingsPanel.hidden || this._capturingIndex == null) {
                return;
            }
            if (ev.key === 'Escape') {
                ev.preventDefault();
                this._capturingIndex = null;
                this._refreshBindingButtons();
                return;
            }

            const normalized = this._normalizeKey(ev.key);
            if (!normalized) return;

            ev.preventDefault();
            this._keymap[this._capturingIndex] = normalized;
            this._capturingIndex = null;
            this._setSettingsError('');
            this._refreshBindingButtons();
        };

        this._playBtn?.addEventListener('click', this._onPlayClick);
        this._settingBtn?.addEventListener('click', this._onSettingClick);
        closeBtn?.addEventListener('click', this._onSettingsCloseClick);
        saveBtn?.addEventListener('click', this._onSettingsSaveClick);
        this._settingsPanel?.addEventListener('click', this._onSettingsBackdropClick);
        window.addEventListener('keydown', this._onSettingsKeyDown);

        this._bindingBtns.forEach((btn, idx) => {
            const handler = () => {
                this._capturingIndex = idx;
                this._setSettingsError('');
                this._refreshBindingButtons();
            };
            this._onBindingClicks.push(handler);
            btn.addEventListener('click', handler);
        });

        this._refreshBindingButtons();

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
        if (this._settingsPanel && this._onSettingsBackdropClick) {
            this._settingsPanel.removeEventListener('click', this._onSettingsBackdropClick);
        }

        const closeBtn = this._host?.querySelector('[data-action="close-settings"]');
        const saveBtn = this._host?.querySelector('[data-action="save-settings"]');
        if (closeBtn && this._onSettingsCloseClick) {
            closeBtn.removeEventListener('click', this._onSettingsCloseClick);
        }
        if (saveBtn && this._onSettingsSaveClick) {
            saveBtn.removeEventListener('click', this._onSettingsSaveClick);
        }

        if (this._onSettingsKeyDown) {
            window.removeEventListener('keydown', this._onSettingsKeyDown);
        }

        this._bindingBtns.forEach((btn, idx) => {
            const handler = this._onBindingClicks[idx];
            if (handler) {
                btn.removeEventListener('click', handler);
            }
        });

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
        this._settingsPanel = null;
        this._settingsErrorEl = null;
        this._bindingBtns = [];
        this._onPlayClick = null;
        this._onSettingClick = null;
        this._onSettingsCloseClick = null;
        this._onSettingsSaveClick = null;
        this._onSettingsBackdropClick = null;
        this._onSettingsKeyDown = null;
        this._onBindingClicks = [];
        this._onSaveSettings = null;
        this._capturingIndex = null;
        this._isLeaving = false;
    }

    _openSettings() {
        if (!this._settingsPanel) return;
        this._capturingIndex = null;
        this._setSettingsError('');
        this._refreshBindingButtons();
        this._settingsPanel.hidden = false;
    }

    _closeSettings() {
        if (!this._settingsPanel) return;
        this._capturingIndex = null;
        this._refreshBindingButtons();
        this._settingsPanel.hidden = true;
    }

    _saveSettings() {
        const lowered = this._keymap.map((k) => String(k).toLowerCase());
        const hasDuplicates = new Set(lowered).size !== lowered.length;
        if (hasDuplicates) {
            this._setSettingsError('Key binding must be unique.');
            return;
        }

        if (typeof this._onSaveSettings === 'function') {
            this._onSaveSettings([...this._keymap]);
        }
        this._closeSettings();
    }

    _setSettingsError(message) {
        if (!this._settingsErrorEl) return;
        this._settingsErrorEl.textContent = message || '';
    }

    _refreshBindingButtons() {
        this._bindingBtns.forEach((btn, idx) => {
            const isCapturing = idx === this._capturingIndex;
            btn.dataset.listening = isCapturing ? 'true' : 'false';
            btn.textContent = isCapturing
                ? 'Press a key...'
                : this._formatKeyLabel(this._keymap[idx] || '');
        });
    }

    _formatKeyLabel(key) {
        if (!key) return 'Unset';
        if (key === ' ') return 'Space';
        if (key.length === 1) return key.toUpperCase();
        return key;
    }

    _normalizeKey(key) {
        if (!key || key === 'Meta' || key === 'Control' || key === 'Shift' || key === 'Alt') {
            return '';
        }
        if (key === 'Spacebar') return ' ';
        if (key === ' ') return ' ';
        if (key.length === 1) return key.toUpperCase();
        return key;
    }

    _sanitizeKeymap(keymap) {
        const fallback = ['1', '2', '3', '4'];
        if (!Array.isArray(keymap) || keymap.length !== 4) return fallback;
        return keymap.map((k, i) => {
            const normalized = this._normalizeKey(String(k || ''));
            return normalized || fallback[i];
        });
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

function _template(songCount, keymap) {
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

            <div class="start-setting-modal" hidden>
                <div class="start-setting-panel" role="dialog" aria-modal="true" aria-label="Setting">
                    <h2 class="start-setting-title">Setting</h2>
                    <div class="start-setting-section">
                        <div class="start-setting-section-title">Key binding</div>
                        <div class="start-keybind-grid">
                            ${keymap
                                .map(
                                    (k, i) => `
                                <div class="start-keybind-row">
                                    <span class="start-keybind-label">Lane ${i + 1}</span>
                                    <button class="start-keybind-btn" type="button" data-bind-index="${i}">${k}</button>
                                </div>
                            `,
                                )
                                .join('')}
                        </div>
                        <div class="start-setting-hint">Click 1 lane and press a key. Keys must be unique.</div>
                        <div class="start-setting-error" aria-live="polite"></div>
                    </div>
                    <div class="start-setting-actions">
                        <button class="btn" type="button" data-action="close-settings">Close</button>
                        <button class="btn primary" type="button" data-action="save-settings">Save</button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

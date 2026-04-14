const ASSET = {
    bg: 'assets/song_selection_screen/song_select_bg.png',
    disk: 'assets/song_selection_screen/disk.png',
};

const DISKS_PER_PAGE = 3;

/**
 * Renders the paw-themed song selection screen with spinning vinyl disks.
 */
export class SelectScreenView {
    constructor() {
        /** @type {HTMLElement|null} */
        this._host = null;
        /** @type {HTMLElement|null} */
        this._root = null;
        /** @type {object[]} */
        this._songs = [];
        /** @type {number} */
        this._page = 0;
        /** @type {object[]} */
        this._animations = [];
        /** @type {Record<string, Function>} */
        this._handlers = {};
        /** @type {Function|null} */
        this._onSelectSong = null;
        /** @type {Function|null} */
        this._onBack = null;
    }

    /**
     * Mount the song selection UI into the given host element.
     *
     * Args:
     *   host (HTMLElement): Container to render into.
     *   options (object): { songs, onSelectSong, onBack }
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    render(host, options = {}) {
        this.destroy();

        const { songs = [], onSelectSong, onBack } = options;

        this._host = host;
        this._songs = songs;
        this._page = 0;
        this._onSelectSong = onSelectSong;
        this._onBack = onBack;

        this._host.classList.add('select-overlay');
        this._host.innerHTML = _template(
            this._getPageSongs(),
            this._page,
            this._totalPages(),
        );

        this._root = this._host.querySelector('.select-screen');
        this._wireEvents();
        this._playEntrance();
    }

    /**
     * Tear down DOM, animations, and event listeners.
     *
     * Args:
     *   None
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    destroy() {
        this._stopAnimations();
        this._unwireEvents();

        if (this._host) {
            this._host.classList.remove('select-overlay');
        }

        this._host = null;
        this._root = null;
        this._songs = [];
        this._handlers = {};
        this._onSelectSong = null;
        this._onBack = null;
    }

    /** @private */
    _getPageSongs() {
        const start = this._page * DISKS_PER_PAGE;
        return this._songs.slice(start, start + DISKS_PER_PAGE);
    }

    /** @private */
    _totalPages() {
        return Math.max(1, Math.ceil(this._songs.length / DISKS_PER_PAGE));
    }

    /** @private */
    _wireEvents() {
        if (!this._root) return;

        this._handlers.diskClick = (e) => {
            const slot = e.target.closest('[data-song-id]');
            if (!slot) return;
            this._onDiskSelect(slot);
        };

        this._handlers.prevClick = () => this._changePage(-1);
        this._handlers.nextClick = () => this._changePage(1);

        this._handlers.backClick = () => {
            if (typeof this._onBack === 'function') this._onBack();
        };

        this._root.querySelector('.select-disks')
            ?.addEventListener('click', this._handlers.diskClick);
        this._root.querySelector('.select-arrow-left')
            ?.addEventListener('click', this._handlers.prevClick);
        this._root.querySelector('.select-arrow-right')
            ?.addEventListener('click', this._handlers.nextClick);
        this._root.querySelector('.select-back-btn')
            ?.addEventListener('click', this._handlers.backClick);
    }

    /** @private */
    _unwireEvents() {
        if (!this._root) return;

        this._root.querySelector('.select-disks')
            ?.removeEventListener('click', this._handlers.diskClick);
        this._root.querySelector('.select-arrow-left')
            ?.removeEventListener('click', this._handlers.prevClick);
        this._root.querySelector('.select-arrow-right')
            ?.removeEventListener('click', this._handlers.nextClick);
        this._root.querySelector('.select-back-btn')
            ?.removeEventListener('click', this._handlers.backClick);
    }

    /** @private */
    _onDiskSelect(slotEl) {
        const anime = window.anime;
        if (anime) {
            anime({
                targets: slotEl.querySelector('.select-disk-img'),
                scale: [1, 1.15, 1],
                duration: 300,
                easing: 'easeInOutSine',
            });
        }

        const songId = slotEl.dataset.songId;
        setTimeout(() => {
            if (typeof this._onSelectSong === 'function') {
                this._onSelectSong(songId);
            }
        }, 180);
    }

    /** @private */
    _changePage(delta) {
        const total = this._totalPages();
        const next = this._page + delta;
        if (next < 0 || next >= total) return;
        this._page = next;
        this._refreshDisks();
    }

    /** @private */
    _refreshDisks() {
        const disksEl = this._root?.querySelector('.select-disks');
        const indicatorEl = this._root?.querySelector('.select-page-indicator');
        if (!disksEl) return;

        this._stopDiskAnimations();
        disksEl.innerHTML = _diskSlots(this._getPageSongs());

        if (indicatorEl) {
            indicatorEl.textContent = `${this._page + 1} / ${this._totalPages()}`;
        }

        this._updateArrowState();
        this._animateDisksEntrance();
        this._spinDisks();
    }

    /** @private */
    _updateArrowState() {
        const left = this._root?.querySelector('.select-arrow-left');
        const right = this._root?.querySelector('.select-arrow-right');
        if (left) left.disabled = this._page === 0;
        if (right) right.disabled = this._page >= this._totalPages() - 1;
    }

    /** @private */
    _playEntrance() {
        const anime = window.anime;
        if (!anime || !this._root) return;

        const frame = this._root.querySelector('.select-frame');
        const title = this._root.querySelector('.select-title');
        const slots = this._root.querySelectorAll('.select-disk-slot');
        const nav = this._root.querySelector('.select-nav');
        const backBtn = this._root.querySelector('.select-back-btn');

        const tl = anime.timeline({ easing: 'easeOutCubic' });

        tl.add({
            targets: frame,
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 600,
        })
        .add({
            targets: title,
            opacity: [0, 1],
            translateY: [-10, 0],
            duration: 400,
        }, '-=300')
        .add({
            targets: slots,
            opacity: [0, 1],
            scale: [0.6, 1],
            delay: anime.stagger(100),
            duration: 450,
        }, '-=200')
        .add({
            targets: [nav, backBtn],
            opacity: [0, 1],
            duration: 300,
        }, '-=200');

        this._animations.push(tl);
        this._updateArrowState();
        this._spinDisks();
    }

    /** @private */
    _animateDisksEntrance() {
        const anime = window.anime;
        if (!anime || !this._root) return;

        const slots = this._root.querySelectorAll('.select-disk-slot');
        const anim = anime({
            targets: slots,
            opacity: [0, 1],
            scale: [0.6, 1],
            delay: anime.stagger(80),
            duration: 400,
            easing: 'easeOutCubic',
        });
        this._animations.push(anim);
    }

    /** @private */
    _spinDisks() {
        const anime = window.anime;
        if (!anime || !this._root) return;

        const disks = this._root.querySelectorAll('.select-disk-img');
        disks.forEach((disk, i) => {
            const anim = anime({
                targets: disk,
                rotate: '1turn',
                duration: 4000 + i * 600,
                easing: 'linear',
                loop: true,
            });
            this._animations.push(anim);
        });
    }

    /** @private */
    _stopDiskAnimations() {
        const anime = window.anime;
        if (anime && this._root) {
            anime.remove(this._root.querySelectorAll('.select-disk-img, .select-disk-slot'));
        }
        this._animations = this._animations.filter((a) => {
            if (!a || !a.animatables) return true;
            const isDisk = a.animatables.some((t) =>
                t.target?.classList?.contains('select-disk-img') ||
                t.target?.classList?.contains('select-disk-slot'),
            );
            if (isDisk && typeof a.pause === 'function') a.pause();
            return !isDisk;
        });
    }

    /** @private */
    _stopAnimations() {
        this._animations.forEach((a) => {
            if (a && typeof a.pause === 'function') a.pause();
        });
        this._animations = [];

        const anime = window.anime;
        if (anime && this._root) {
            anime.remove(this._root.querySelectorAll('*'));
        }
    }
}

/* ── Template helpers ── */

function _esc(s) {
    const el = document.createElement('span');
    el.textContent = s || '';
    return el.innerHTML;
}

function _diskSlots(songs) {
    if (songs.length === 0) {
        return '<div class="select-empty">No songs available</div>';
    }
    return songs
        .map(
            (s) => `
        <div class="select-disk-slot" data-song-id="${_esc(s.id)}">
            <div class="select-disk-wrap">
                <img class="select-disk-img" src="${ASSET.disk}" alt="${_esc(s.title)}" draggable="false">
            </div>
            <div class="select-disk-info">
                <div class="select-disk-title">${_esc(s.title)}</div>
                <div class="select-disk-artist">${_esc(s.artist)}</div>
            </div>
        </div>
    `,
        )
        .join('');
}

function _template(pageSongs, page, totalPages) {
    return `
        <section class="select-screen" aria-label="Song selection">
            <div class="select-frame">
                <img class="select-frame-bg" src="${ASSET.bg}" alt="" aria-hidden="true" draggable="false">
                <div class="select-content">
                    <div class="select-title">Pawlist</div>
                    <div class="select-disks">${_diskSlots(pageSongs)}</div>
                    <div class="select-controls">
                        <div class="select-nav">
                            <button class="select-arrow select-arrow-left" type="button" aria-label="Previous page">&lsaquo;</button>
                            <span class="select-page-indicator">${page + 1} / ${totalPages}</span>
                            <button class="select-arrow select-arrow-right" type="button" aria-label="Next page">&rsaquo;</button>
                        </div>
                        <button class="select-back-btn" type="button">Back</button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

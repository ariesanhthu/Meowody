/** @typedef {import('../model/DataModels.js').RenderNote} RenderNote */

const NOTE_SRC = 'assets/game_screen/note.png';

/**
 * Renders original note sprite with a per-lane tint overlay.
 */
export class NoteView {
    constructor() {
        /** @type {HTMLElement | null} */
        this._layer = null;
    }

    /**
     * Attach the notes layer.
     *
     * Args:
     *   el (HTMLElement): Notes layer element.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    setLayer(el) {
        this._layer = el;
    }

    /**
     * Draw visible notes for this frame.
     *
     * Args:
     *   notes (RenderNote[]): Visible notes from snapshot.
     *   laneCount (number): Lane count.
     *
     * Returns:
     *   void
     *
     * Raises:
     *   None
     */
    render(notes, laneCount) {
        if (!this._layer) return;
        this._layer.innerHTML = '';
        const frag = document.createDocumentFragment();
        const laneWidthPct = 100 / laneCount;

        for (const n of notes) {
            const note = document.createElement('div');
            note.className = 'note';
            note.dataset.id = n.id;
            note.dataset.lane = String(n.laneIndex);
            note.style.top = `${n.y}px`;
            note.style.left = `${laneWidthPct * n.laneIndex + laneWidthPct / 2}%`;

            const sprite = document.createElement('img');
            sprite.className = 'note-sprite';
            sprite.src = NOTE_SRC;
            sprite.alt = '';
            sprite.draggable = false;

            const tint = document.createElement('span');
            tint.className = 'note-tint';

            note.appendChild(sprite);
            note.appendChild(tint);
            frag.appendChild(note);
        }
        this._layer.appendChild(frag);
    }
}

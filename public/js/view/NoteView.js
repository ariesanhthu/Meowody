/** @typedef {import('../model/DataModels.js').RenderNote} RenderNote */

const NOTE_SRC = 'assets/game_screen/note.png';

/**
 * Renders note sprites as <img> elements. Position driven by render snapshot only.
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
     * Draw visible notes for this frame using <img> elements.
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
            const img = document.createElement('img');
            img.className = 'note';
            img.src = NOTE_SRC;
            img.alt = '';
            img.draggable = false;
            img.dataset.id = n.id;
            img.dataset.lane = String(n.laneIndex);
            img.style.top = `${n.y}px`;
            img.style.left = `${laneWidthPct * n.laneIndex + laneWidthPct / 2}%`;
            frag.appendChild(img);
        }
        this._layer.appendChild(frag);
    }
}

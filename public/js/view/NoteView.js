/** @typedef {import('../model/DataModels.js').RenderNote} RenderNote */

/**
 * Renders note sprites with per-lane colors. Position driven by render snapshot only.
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
     * Draw visible notes for this frame with per-lane coloring.
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
            const el = document.createElement('div');
            el.className = 'note';
            el.dataset.id = n.id;
            el.dataset.lane = String(n.laneIndex);
            el.style.top = `${n.y}px`;
            el.style.left = `${laneWidthPct * n.laneIndex + laneWidthPct / 2}%`;
            frag.appendChild(el);
        }
        this._layer.appendChild(frag);
    }
}

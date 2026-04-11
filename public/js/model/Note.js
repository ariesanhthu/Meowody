/**
 * FILE: Note.js
 * PURPOSE: Internal canonical model for a single interactable note inside gameplay.
 */
export class Note {
    constructor(data = {}) {
        this.id = data.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        this.laneIndex = data.laneIndex !== undefined ? data.laneIndex : 0;
        this.hitTimeMs = data.hitTimeMs || 0;
        this.noteType = data.noteType || 'tap';
        this.durationMs = data.durationMs !== undefined && data.durationMs !== null ? data.durationMs : null;
        this.status = data.status || 'pending';
    }
}

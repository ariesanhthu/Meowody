/**
 * Internal canonical model for a level's chart. Exposes note queries for the engine.
 */
export class Chart {
    constructor(data = {}) {
        this.id = data.id || 'default_chart';
        this.songId = data.songId || '';
        this.difficulty = data.difficulty || 'normal';
        this.laneCount = data.laneCount || 4;
        this.bpm = data.bpm || 120;
        this.offsetMs = data.offsetMs || 0;
        this.keymap = data.keymap || [];
        /** @type {import('./Note.js').Note[]} sorted ascending by hitTimeMs */
        this.notes = data.notes || [];
        this.metadata = data.metadata || {};
    }

    /**
     * Get notes within a time window around currentTimeMs.
     *
     * Args:
     *   currentTimeMs (number): Audio-derived time.
     *   appearWindowMs (number): How far ahead to look (ms).
     *
     * Returns:
     *   Note[]
     *
     * Raises:
     *   None
     */
    getVisibleNotes(currentTimeMs, appearWindowMs) {
        const result = [];
        for (const n of this.notes) {
            if (n.status !== 'pending') continue;
            const delta = n.hitTimeMs - currentTimeMs;
            if (delta > appearWindowMs) break;
            if (delta < -500) continue;
            result.push(n);
        }
        return result;
    }

    /**
     * Find the next pending note in a lane within hit window.
     *
     * Args:
     *   laneIndex (number): Lane to search.
     *   currentTimeMs (number): Current audio time.
     *   hitWindowMs (number): Maximum timing error allowed.
     *
     * Returns:
     *   Note | null
     *
     * Raises:
     *   None
     */
    getNextHittableNote(laneIndex, currentTimeMs, hitWindowMs) {
        let best = null;
        let bestAbs = Infinity;
        for (const n of this.notes) {
            if (n.status !== 'pending') continue;
            if (n.laneIndex !== laneIndex) continue;
            const delta = Math.abs(n.hitTimeMs - currentTimeMs);
            if (delta > hitWindowMs) {
                if (n.hitTimeMs > currentTimeMs + hitWindowMs) break;
                continue;
            }
            if (delta < bestAbs) {
                bestAbs = delta;
                best = n;
            }
        }
        return best;
    }

    /**
     * Mark notes that have passed the miss window.
     *
     * Args:
     *   currentTimeMs (number): Current audio time.
     *   missWindowMs (number): How far past hitTimeMs to auto-miss.
     *
     * Returns:
     *   Note[] — newly missed notes.
     *
     * Raises:
     *   None
     */
    markMissedNotes(currentTimeMs, missWindowMs) {
        const missed = [];
        for (const n of this.notes) {
            if (n.status !== 'pending') continue;
            if (n.hitTimeMs + missWindowMs < currentTimeMs) {
                n.status = 'missed';
                missed.push(n);
            }
            if (n.hitTimeMs > currentTimeMs + missWindowMs) break;
        }
        return missed;
    }
}

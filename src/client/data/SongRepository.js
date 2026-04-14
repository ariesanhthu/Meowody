/**
 * Fetches song list and song details from the Express API.
 */
export class SongRepository {
    /**
     * @param {string} [baseUrl]
     */
    constructor(baseUrl = '') {
        this._base = baseUrl.replace(/\/$/, '');
    }

    /**
     * Load all song summaries.
     *
     * Args:
     *   None
     *
     * Returns:
     *   Promise<import('../model/DataModels.js').SongSummary[]>
     *
     * Raises:
     *   Error: On network or HTTP errors.
     */
    async listSummaries() {
        const res = await fetch(`${this._base}/api/songs`);
        if (!res.ok) {
            throw new Error(`GET /api/songs failed: ${res.status}`);
        }
        const data = await res.json();
        return Array.isArray(data.items) ? data.items : [];
    }

    /**
     * Load details for one song.
     *
     * Args:
     *   songId (string): Song identifier.
     *
     * Returns:
     *   Promise<import('../model/DataModels.js').SongDetails>
     *
     * Raises:
     *   Error: On network or HTTP errors.
     */
    async getDetails(songId) {
        const res = await fetch(`${this._base}/api/songs/${encodeURIComponent(songId)}`);
        if (!res.ok) {
            throw new Error(`GET /api/songs/${songId} failed: ${res.status}`);
        }
        return res.json();
    }
}

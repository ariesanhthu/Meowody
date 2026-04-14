/**
 * Fetches raw chart JSON from the server (never bypasses validation in gameplay).
 */
export class ChartRepository {
    /**
     * @param {string} [baseUrl]
     */
    constructor(baseUrl = '') {
        this._base = baseUrl.replace(/\/$/, '');
    }

    /**
     * Load raw chart JSON by id.
     *
     * Args:
     *   chartId (string): Chart identifier.
     *
     * Returns:
     *   Promise<object>
     *
     * Raises:
     *   Error: On network or HTTP errors.
     */
    async getRawChart(chartId) {
        const res = await fetch(`${this._base}/api/charts/${encodeURIComponent(chartId)}`);
        if (!res.ok) {
            throw new Error(`GET /api/charts/${chartId} failed: ${res.status}`);
        }
        return res.json();
    }
}

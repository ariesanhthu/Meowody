/**
 * Reusable inline SVG fallback for missing/broken images. Futuristic neon style.
 */

const FALLBACK_CACHE = {};

/**
 * Generate an inline SVG data URI for a given size and type.
 *
 * Args:
 *   type (string): 'thumbnail' | 'banner' | 'generic'
 *   width (number): SVG width.
 *   height (number): SVG height.
 *
 * Returns:
 *   string — data:image/svg+xml URI.
 *
 * Raises:
 *   None
 */
export function getFallbackSvg(type = 'generic', width = 200, height = 200) {
    const key = `${type}_${width}_${height}`;
    if (FALLBACK_CACHE[key]) return FALLBACK_CACHE[key];

    const configs = {
        thumbnail: { icon: _musicIcon(), bg: '#0a0e17', accent: '#00e5ff' },
        banner: { icon: _waveIcon(), bg: '#0a0e17', accent: '#ff3e8e' },
        generic: { icon: _hexIcon(), bg: '#0a0e17', accent: '#6cf' },
    };
    const cfg = configs[type] || configs.generic;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="${cfg.bg}"/>
        <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="${cfg.accent}" stroke-width="1" stroke-opacity="0.2"/>
        <g transform="translate(${width / 2},${height / 2})" opacity="0.35">${cfg.icon}</g>
    </svg>`;

    const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    FALLBACK_CACHE[key] = uri;
    return uri;
}

/**
 * Attach error handler to an <img> element that swaps to fallback on failure.
 *
 * Args:
 *   img (HTMLImageElement): Target image element.
 *   type (string): Fallback type.
 *   width (number): Fallback width.
 *   height (number): Fallback height.
 *
 * Returns:
 *   void
 *
 * Raises:
 *   None
 */
export function attachFallback(img, type = 'generic', width = 200, height = 200) {
    const fallback = getFallbackSvg(type, width, height);
    img.addEventListener('error', () => {
        img.src = fallback;
    }, { once: true });
    if (img.complete && img.naturalWidth === 0) {
        img.src = fallback;
    }
}

function _musicIcon() {
    return `<circle r="18" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M-6,-10 L-6,8 M-6,8 A5,5 0 1,1 -6,3 M6,-14 L6,4 M6,4 A5,5 0 1,1 6,-1 M-6,-10 L6,-14" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
}
function _waveIcon() {
    return `<path d="M-30,0 Q-20,-18 -10,0 Q0,18 10,0 Q20,-18 30,0" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M-30,8 Q-20,-10 -10,8 Q0,26 10,8 Q20,-10 30,8" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>`;
}
function _hexIcon() {
    return `<polygon points="0,-20 17.3,-10 17.3,10 0,20 -17.3,10 -17.3,-10" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
}

/**
 * Centralized asset loader. Probes image URLs and caches results.
 * Falls back to CSS/SVG rendering when asset files are missing.
 */

import { getFallbackSvg } from './ImageFallback.js';

const ASSET_BASE = 'assets';

const ASSET_MAP = {
    note: (lane) => `${ASSET_BASE}/notes/note-${lane}.png`,
    receptor: (lane) => `${ASSET_BASE}/receptors/receptor-${lane}.png`,
    background: () => `${ASSET_BASE}/backgrounds/playfield.png`,
    btnPlay: () => `${ASSET_BASE}/ui/btn-play.png`,
    btnPause: () => `${ASSET_BASE}/ui/btn-pause.png`,
    btnRestart: () => `${ASSET_BASE}/ui/btn-restart.png`,
    btnMenu: () => `${ASSET_BASE}/ui/btn-menu.png`,
};

const _cache = new Map();

/**
 * Probe whether an image URL is loadable. Result is cached.
 *
 * Args:
 *   url (string): Image URL to probe.
 *
 * Returns:
 *   Promise<boolean>
 *
 * Raises:
 *   None
 */
async function _probe(url) {
    if (_cache.has(url)) return _cache.get(url);

    const ok = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });

    _cache.set(url, ok);
    return ok;
}

/**
 * Get the URL for a per-lane asset (note or receptor).
 * Returns the image URL if the file exists, otherwise null.
 *
 * Args:
 *   type (string): 'note' | 'receptor'
 *   laneIndex (number): Lane index (0-based).
 *
 * Returns:
 *   Promise<string | null>
 *
 * Raises:
 *   None
 */
export async function getLaneAsset(type, laneIndex) {
    const fn = ASSET_MAP[type];
    if (!fn) return null;
    const url = fn(laneIndex);
    return (await _probe(url)) ? url : null;
}

/**
 * Get the URL for a named asset.
 * Returns the image URL if the file exists, otherwise null.
 *
 * Args:
 *   name (string): Asset name key (e.g. 'background', 'btnPlay').
 *
 * Returns:
 *   Promise<string | null>
 *
 * Raises:
 *   None
 */
export async function getAsset(name) {
    const fn = ASSET_MAP[name];
    if (!fn) return null;
    const url = fn();
    return (await _probe(url)) ? url : null;
}

/**
 * Preload all game assets and return an availability map.
 * Keys: 'note-0'..'note-3', 'receptor-0'..'receptor-3', 'background',
 *       'btnPlay', 'btnPause', 'btnRestart', 'btnMenu'.
 *
 * Args:
 *   laneCount (number): Number of lanes.
 *
 * Returns:
 *   Promise<Record<string, string | null>> — key → url or null.
 *
 * Raises:
 *   None
 */
export async function preloadAll(laneCount = 4) {
    const entries = [];

    for (let i = 0; i < laneCount; i++) {
        entries.push([`note-${i}`, getLaneAsset('note', i)]);
        entries.push([`receptor-${i}`, getLaneAsset('receptor', i)]);
    }
    entries.push(['background', getAsset('background')]);
    entries.push(['btnPlay', getAsset('btnPlay')]);
    entries.push(['btnPause', getAsset('btnPause')]);
    entries.push(['btnRestart', getAsset('btnRestart')]);
    entries.push(['btnMenu', getAsset('btnMenu')]);

    const results = await Promise.all(entries.map(async ([k, p]) => [k, await p]));
    return Object.fromEntries(results);
}

/**
 * Apply an image as the background-image of an element, with SVG fallback.
 *
 * Args:
 *   el (HTMLElement): Target element.
 *   url (string | null): Image URL or null for fallback.
 *   fallbackType (string): Fallback type for getFallbackSvg.
 *   width (number): Fallback width.
 *   height (number): Fallback height.
 *
 * Returns:
 *   void
 *
 * Raises:
 *   None
 */
export function applyBackground(el, url, fallbackType = 'generic', width = 200, height = 200) {
    if (url) {
        el.style.backgroundImage = `url('${url}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
    } else {
        el.style.backgroundImage = `url('${getFallbackSvg(fallbackType, width, height)}')`;
        el.style.backgroundSize = 'cover';
    }
}

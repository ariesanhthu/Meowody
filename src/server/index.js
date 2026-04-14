const http = require('http');
const express = require('express');
const path = require('path');
const { discoverSongs } = require('./SongCatalogService');

const app = express();
const PREFERRED_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_OFFSET = 40;

const ROOT = path.join(__dirname, '..', '..');
const PUBLIC = path.join(ROOT, 'public');
const SONGS_ROOT = path.join(ROOT, 'data', 'songs');
const { songs, chartIndex, importWarnings } = discoverSongs(SONGS_ROOT);

if (importWarnings.length) {
    console.warn('[import] Warnings:');
    importWarnings.forEach((w) => console.warn('  ', w));
}
console.log(`[catalog] ${songs.length} song(s), ${chartIndex.size} chart(s) discovered`);

const songMap = new Map(songs.map((s) => [s.id, s]));

app.use(express.static(PUBLIC));
app.use('/app', express.static(path.join(ROOT, 'src', 'client')));
app.use('/data', express.static(path.join(ROOT, 'data')));

app.get('/api/songs', (_req, res) => {
    const items = songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        audioUrl: s.audioUrl,
        bannerUrl: s.bannerUrl || '',
        sourceFormat: s.sourceFormat,
        chartCount: s.chartCount,
        availableCharts: s.availableCharts,
    }));
    res.json({ items });
});

app.get('/api/songs/:songId', (req, res) => {
    const song = songMap.get(req.params.songId);
    if (!song) {
        return res.status(404).json({ error: 'Song not found', code: 'SONG_NOT_FOUND' });
    }
    res.json(song);
});

app.get('/api/charts/:chartId', (req, res) => {
    const chart = chartIndex.get(req.params.chartId);
    if (!chart) {
        return res.status(404).json({ error: 'Chart not found', code: 'CHART_NOT_FOUND' });
    }
    res.json(chart);
});

const server = http.createServer(app);
let announcedListen = false;

/**
 * Bind server, trying next ports if the preferred one is busy.
 *
 * Args:
 *   port (number): Port to try.
 *
 * Returns:
 *   void
 *
 * Raises:
 *   None (exits process on fatal bind errors).
 */
function listenWithFallback(port) {
    server.removeAllListeners('error');

    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && port < PREFERRED_PORT + MAX_PORT_OFFSET) {
            console.warn(`[port] ${port} busy, trying ${port + 1}…`);
            server.close(() => listenWithFallback(port + 1));
            return;
        }
        if (err.code === 'EADDRINUSE') {
            console.error(
                `[EADDRINUSE] No free port in range ${PREFERRED_PORT}–${PREFERRED_PORT + MAX_PORT_OFFSET}.`,
            );
            process.exit(1);
            return;
        }
        console.error(err);
        process.exit(1);
    });

    server.listen(port, () => {
        server.removeAllListeners('error');
        if (announcedListen) return;
        announcedListen = true;
        const addr = server.address();
        const actual = typeof addr === 'object' && addr ? addr.port : port;
        console.log(`Server is running at http://localhost:${actual}`);
        if (actual !== PREFERRED_PORT) {
            console.warn(`(PORT=${PREFERRED_PORT} was busy, bound to ${actual} instead)`);
        }
    });
}

listenWithFallback(PREFERRED_PORT);

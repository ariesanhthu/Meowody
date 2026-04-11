const fs = require('fs');
const path = require('path');
const { parseSsc } = require('./SscParser');
const { extractCharts } = require('./SscChartExtractor');

/**
 * Scan /data/songs for song folders, discover .ssc files and assets,
 * produce structured song index and chart catalog.
 */

/**
 * Discover all songs under a root directory (one folder = one song).
 *
 * Args:
 *   songsRoot (string): Absolute path to /data/songs.
 *
 * Returns:
 *   { songs: object[], chartIndex: Map<string, object>, importWarnings: string[] }
 *
 * Raises:
 *   None (individual folder errors are captured as warnings).
 */
function discoverSongs(songsRoot) {
  const entries = fs.readdirSync(songsRoot, { withFileTypes: true });
  const songs = [];
  const chartIndex = new Map();
  const importWarnings = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderName = entry.name;
    const folderPath = path.join(songsRoot, folderName);

    const sscFiles = fs
      .readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith('.ssc'));

    if (sscFiles.length === 0) continue;

    const sscFile = sscFiles[0];
    const sscPath = path.join(folderPath, sscFile);

    let sscText;
    try {
      sscText = fs.readFileSync(sscPath, 'utf8');
    } catch (err) {
      importWarnings.push(`[${folderName}] Cannot read ${sscFile}: ${err.message}`);
      continue;
    }

    let parsed;
    try {
      parsed = parseSsc(sscText);
    } catch (err) {
      importWarnings.push(`[${folderName}] Parse error: ${err.message}`);
      continue;
    }

    const songId = folderName;
    const meta = parsed.metadata;
    const musicFile = meta.MUSIC || '';
    const bannerFile = meta.BANNER || '';
    const bgFile = meta.BACKGROUND || '';

    const audioExists =
      musicFile && fs.existsSync(path.join(folderPath, musicFile));
    if (!audioExists) {
      importWarnings.push(`[${songId}] Audio "${musicFile}" not found in folder`);
    }

    const audioUrl = audioExists ? `/data/songs/${songId}/${musicFile}` : '';
    const bannerUrl =
      bannerFile && fs.existsSync(path.join(folderPath, bannerFile))
        ? `/data/songs/${songId}/${bannerFile}`
        : '';
    const backgroundUrl =
      bgFile && fs.existsSync(path.join(folderPath, bgFile))
        ? `/data/songs/${songId}/${bgFile}`
        : '';

    const { charts, importWarnings: chartWarnings } = extractCharts(parsed, songId);
    if (chartWarnings.length) importWarnings.push(...chartWarnings);

    const availableCharts = charts.map((c) => ({
      chartId: c.chartId,
      difficulty: c.difficulty,
      meter: c.meter,
      stepType: c.stepType,
    }));

    for (const chart of charts) {
      chartIndex.set(chart.chartId, chart);
    }

    const offsetSec = Number.parseFloat(meta.OFFSET);
    const offsetMs = Number.isFinite(offsetSec) ? offsetSec * 1000 : 0;

    songs.push({
      id: songId,
      title: meta.TITLE || songId,
      subtitle: meta.SUBTITLE || '',
      artist: meta.ARTIST || '',
      audioUrl,
      bannerUrl,
      backgroundUrl,
      offsetMs,
      sourceFormat: 'ssc',
      chartCount: charts.length,
      availableCharts,
    });
  }

  return { songs, chartIndex, importWarnings };
}

module.exports = { discoverSongs };
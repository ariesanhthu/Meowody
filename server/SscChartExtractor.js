const { parseBpmString, parseStopsString, parseNoteRows } = require('./SscParser');
const { buildBeatToMsFunction } = require('./SscTimingResolver');

const SUPPORTED_STEP_TYPES = new Set(['dance-single']);
const LANE_COUNTS = { 'dance-single': 4 };
const DEFAULT_KEYMAP = { 'dance-single': ['1', '2', '3', '4'] };

/**
 * Extract all playable chart payloads from a parsed simfile.
 *
 * Args:
 *   parsedSsc ({ metadata: object, noteDataBlocks: object[] }): Output of SscParser.
 *   songId (string): Stable song identifier.
 *
 * Returns:
 *   { charts: object[], importWarnings: string[] }
 *
 * Raises:
 *   None (unsupported charts are filtered with warnings).
 */
function extractCharts(parsedSsc, songId) {
  const { metadata, noteDataBlocks } = parsedSsc;
  const charts = [];
  const importWarnings = [];

  const globalBpmStr = metadata.BPMS || '';
  const globalStopsStr = metadata.STOPS || '';
  const globalDelaysStr = metadata.DELAYS || '';
  const globalOffsetSec = Number.parseFloat(metadata.OFFSET) || 0;

  for (let idx = 0; idx < noteDataBlocks.length; idx++) {
    const block = noteDataBlocks[idx];
    const stepType = (block.STEPSTYPE || '').trim().toLowerCase();

    if (!SUPPORTED_STEP_TYPES.has(stepType)) {
      importWarnings.push(`Chart #${idx}: step type "${stepType}" unsupported, skipped`);
      continue;
    }

    const difficulty = block.DIFFICULTY || 'Edit';
    const meter = Number.parseInt(block.METER, 10) || 1;
    const chartName = block.CHARTNAME || '';
    const laneCount = LANE_COUNTS[stepType];

    const bpmStr = block.BPMS || globalBpmStr;
    const stopsStr = block.STOPS || globalStopsStr;
    const delaysStr = block.DELAYS || globalDelaysStr;
    const offsetSec =
      block.OFFSET != null ? Number.parseFloat(block.OFFSET) : globalOffsetSec;

    const bpmSegments = parseBpmString(bpmStr);
    const stopSegments = parseStopsString(stopsStr);
    const delaySegments = parseStopsString(delaysStr);

    if (bpmSegments.length === 0) {
      importWarnings.push(`Chart #${idx} "${difficulty}": no BPM data, skipped`);
      continue;
    }

    const noteRows = parseNoteRows(block.notesRaw || '', laneCount);

    const chartId = `${songId}-${stepType}-${difficulty}-${idx}`
      .toLowerCase()
      .replace(/\s+/g, '-');

    const warnings = [];

    // Important:
    // beatToMs returns time relative to beat 0 only.
    // Simfile offset is NOT applied here.
    // Runtime GameClock must handle simfile offset consistently.
    const beatToMs = buildBeatToMsFunction(
      bpmSegments,
      0,
      stopSegments,
      delaySegments
    );

    const processedNoteRows = noteRows.map((row) => ({
      ...row,
      hitTimeMs: beatToMs(row.beat),
    }));

    const noteEvents = [];
    const holdStarts = new Map();
    let noteIdCounter = 0;

    for (const row of processedNoteRows) {
      for (let col = 0; col < laneCount; col++) {
        const token = row.tokens[col];
        if (token === '0') continue;

        if (token === '1') {
          noteEvents.push({
            id: `${chartId}_n${noteIdCounter++}`,
            laneIndex: col,
            hitTimeMs: row.hitTimeMs,
            noteType: 'tap',
            durationMs: null,
          });
          continue;
        }

        if (token === '2') {
          holdStarts.set(col, {
            id: `${chartId}_n${noteIdCounter++}`,
            laneIndex: col,
            hitTimeMs: row.hitTimeMs,
          });
          continue;
        }

        if (token === '3') {
          const start = holdStarts.get(col);
          if (start) {
            noteEvents.push({
              id: start.id,
              laneIndex: col,
              hitTimeMs: start.hitTimeMs,
              noteType: 'hold',
              durationMs: Math.max(0, row.hitTimeMs - start.hitTimeMs),
            });
            holdStarts.delete(col);
          } else {
            warnings.push(`Hold tail without head at beat ${row.beat} lane ${col} — skipped`);
          }
          continue;
        }

        if (token === '4') {
          warnings.push(`Roll head at beat ${row.beat} lane ${col} — treated as tap`);
          noteEvents.push({
            id: `${chartId}_n${noteIdCounter++}`,
            laneIndex: col,
            hitTimeMs: row.hitTimeMs,
            noteType: 'tap',
            durationMs: null,
          });
          continue;
        }

        if (token === 'M' || token === 'm') {
          warnings.push(`Mine at beat ${row.beat} lane ${col} — skipped`);
          continue;
        }

        if (token === 'L' || token === 'F') {
          warnings.push(`Token "${token}" at beat ${row.beat} lane ${col} — skipped`);
          continue;
        }

        warnings.push(`Unknown token "${token}" at beat ${row.beat} lane ${col} — skipped`);
      }
    }

    for (const col of holdStarts.keys()) {
      warnings.push(`Unclosed hold in lane ${col} — dropped`);
    }

    noteEvents.sort((a, b) => {
      if (a.hitTimeMs !== b.hitTimeMs) return a.hitTimeMs - b.hitTimeMs;
      return a.laneIndex - b.laneIndex;
    });

    if (warnings.length) {
      importWarnings.push(...warnings.map((w) => `[${chartId}] ${w}`));
    }

    const offsetMs = Number.isFinite(offsetSec) ? offsetSec * 1000 : 0;

    charts.push({
      sourceFormat: 'ssc',
      chartId,
      songId,
      title: metadata.TITLE || '',
      artist: metadata.ARTIST || '',
      difficulty,
      meter,
      chartName,
      stepType,
      laneCount,
      keymap: DEFAULT_KEYMAP[stepType] || [],
      offsetMs,
      bpmSegments,
      stopSegments: stopSegments.map((s) => ({
        beat: s.beat,
        durationMs: s.durationSec * 1000,
      })),
      delaySegments: delaySegments.map((d) => ({
        beat: d.beat,
        durationMs: d.durationSec * 1000,
      })),
      noteRows: processedNoteRows,
      noteEvents,
      importWarnings: warnings,
    });
  }

  return { charts, importWarnings };
}

/**
 * Get one chart by chartId from extracted charts.
 *
 * Args:
 *   charts (object[]): Array from extractCharts.
 *   chartId (string): Chart identifier.
 *
 * Returns:
 *   object | null
 *
 * Raises:
 *   None
 */
function selectChart(charts, chartId) {
  return charts.find((c) => c.chartId === chartId) || null;
}

module.exports = { extractCharts, selectChart };
/**
 * Parses .ssc simfile text into a structured object with metadata and chart blocks.
 */

/**
 * Parse a single #TAG:VALUE; line. Handles multi-line values ending with ;
 *
 * Args:
 *   text (string): Full .ssc file contents.
 *
 * Returns:
 *   { metadata: object, noteDataBlocks: object[] }
 *
 * Raises:
 *   Error: On malformed simfile structure.
 */
function parseSsc(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const metadata = {};
    const noteDataBlocks = [];
    let currentBlock = null;
    let collectingNotes = false;
    let notesBuffer = [];
    let collectingTag = null;
    let collectingValue = '';

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (trimmed.startsWith('//') || trimmed === '') continue;

        if (collectingNotes) {
            if (trimmed === ';') {
                currentBlock.notesRaw = notesBuffer.join('\n');
                noteDataBlocks.push(currentBlock);
                currentBlock = null;
                collectingNotes = false;
                notesBuffer = [];
            } else {
                notesBuffer.push(trimmed);
            }
            continue;
        }

        if (collectingTag) {
            const semiIdx = trimmed.indexOf(';');
            if (semiIdx >= 0) {
                collectingValue += trimmed.slice(0, semiIdx);
                _assignTag(collectingTag, collectingValue, metadata, currentBlock);
                collectingTag = null;
                collectingValue = '';
            } else {
                collectingValue += trimmed + '\n';
            }
            continue;
        }

        if (!trimmed.startsWith('#')) continue;

        const colonIdx = trimmed.indexOf(':');
        if (colonIdx < 0) continue;

        const tag = trimmed.slice(1, colonIdx).toUpperCase();
        const rest = trimmed.slice(colonIdx + 1);

        if (tag === 'NOTEDATA') {
            currentBlock = {};
            continue;
        }

        if (tag === 'NOTES') {
            collectingNotes = true;
            notesBuffer = [];
            const afterColon = rest.replace(/;$/, '').trim();
            if (afterColon) notesBuffer.push(afterColon);
            continue;
        }

        const semiIdx = rest.indexOf(';');
        if (semiIdx >= 0) {
            const value = rest.slice(0, semiIdx);
            _assignTag(tag, value, metadata, currentBlock);
        } else {
            collectingTag = tag;
            collectingValue = rest + '\n';
        }
    }

    return { metadata, noteDataBlocks };
}

/**
 * Assign parsed tag to either the current notedata block or global metadata.
 *
 * Args:
 *   tag (string): Uppercase tag name.
 *   value (string): Trimmed tag value.
 *   metadata (object): Global metadata accumulator.
 *   block (object|null): Current NOTEDATA block.
 *
 * Returns:
 *   void
 *
 * Raises:
 *   None
 */
function _assignTag(tag, value, metadata, block) {
    const target = block || metadata;
    target[tag] = value.trim();
}

/**
 * Parse #BPMS string into segments.
 *
 * Args:
 *   raw (string): e.g. "0.000=120.000,4.000=180.000"
 *
 * Returns:
 *   { beat: number, bpm: number }[]
 *
 * Raises:
 *   None
 */
function parseBpmString(raw) {
    if (!raw || !raw.trim()) return [];
    return raw.split(',').map((pair) => {
        const [b, v] = pair.split('=');
        return { beat: parseFloat(b), bpm: parseFloat(v) };
    }).filter((s) => !isNaN(s.beat) && !isNaN(s.bpm));
}

/**
 * Parse #STOPS or #DELAYS string into segments.
 *
 * Args:
 *   raw (string): e.g. "4.000=0.500"
 *
 * Returns:
 *   { beat: number, durationSec: number }[]
 *
 * Raises:
 *   None
 */
function parseStopsString(raw) {
    if (!raw || !raw.trim()) return [];
    return raw.split(',').map((pair) => {
        const [b, v] = pair.split('=');
        return { beat: parseFloat(b), durationSec: parseFloat(v) };
    }).filter((s) => !isNaN(s.beat) && !isNaN(s.durationSec));
}

/**
 * Parse raw notes text into structured note rows.
 *
 * Args:
 *   notesRaw (string): The note data between #NOTES: and ;
 *   laneCount (number): Expected columns per row.
 *
 * Returns:
 *   { measureIndex, rowIndexInMeasure, rowsInMeasure, beat, columns, tokens }[]
 *
 * Raises:
 *   None
 */
function parseNoteRows(notesRaw, laneCount) {
    const measures = notesRaw.split(',').map((m) => m.trim());
    const rows = [];
    for (let mi = 0; mi < measures.length; mi++) {
        const lines = measures[mi].split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('//'));
        const rowCount = lines.length;
        for (let ri = 0; ri < rowCount; ri++) {
            const columns = lines[ri];
            if (columns.length < laneCount) continue;
            const tokens = columns.slice(0, laneCount).split('');
            const beat = mi * 4 + (ri / rowCount) * 4;
            rows.push({
                measureIndex: mi,
                rowIndexInMeasure: ri,
                rowsInMeasure: rowCount,
                beat,
                columns: columns.slice(0, laneCount),
                tokens,
            });
        }
    }
    return rows;
}

module.exports = { parseSsc, parseBpmString, parseStopsString, parseNoteRows };

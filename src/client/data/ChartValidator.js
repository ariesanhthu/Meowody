/**
 * Validates simfile-derived external chart JSON before adapter normalization.
 */
const SUPPORTED_STEP_TYPES = new Set(['dance-single']);
const SUPPORTED_NOTE_TYPES = new Set(['tap', 'hold']);

export class ChartValidator {
    /**
     * Validate structured external chart payload from API.
     *
     * Args:
     *   raw (object): Simfile-derived chart JSON.
     *
     * Returns:
     *   { ok: true } | { ok: false, errors: string[] }
     *
     * Raises:
     *   None
     */
    static validate(raw) {
        const errors = [];

        if (!raw || typeof raw !== 'object') {
            return { ok: false, errors: ['Chart must be an object'] };
        }

        if (!raw.chartId || typeof raw.chartId !== 'string') {
            errors.push('chartId must be a non-empty string');
        }
        if (!raw.songId || typeof raw.songId !== 'string') {
            errors.push('songId must be a non-empty string');
        }
        if (!raw.stepType || typeof raw.stepType !== 'string') {
            errors.push('stepType must exist');
        } else if (!SUPPORTED_STEP_TYPES.has(raw.stepType)) {
            errors.push(`stepType "${raw.stepType}" is not supported`);
        }

        const laneCount = raw.laneCount;
        if (!Number.isInteger(laneCount) || laneCount < 1) {
            errors.push('laneCount must be an integer >= 1');
        }
        if (laneCount !== 4) {
            errors.push('Baseline only supports laneCount = 4');
        }

        const keymap = raw.keymap;
        if (!Array.isArray(keymap)) {
            errors.push('keymap must be an array');
        } else if (Number.isInteger(laneCount) && keymap.length !== laneCount) {
            errors.push('keymap length must equal laneCount');
        }

        if (typeof raw.offsetMs !== 'number') {
            errors.push('offsetMs must be numeric');
        }

        if (!Array.isArray(raw.bpmSegments) || raw.bpmSegments.length === 0) {
            errors.push('bpmSegments must be a non-empty array');
        } else {
            for (let i = 0; i < raw.bpmSegments.length; i++) {
                const seg = raw.bpmSegments[i];
                if (typeof seg.beat !== 'number' || seg.beat < 0) {
                    errors.push(`bpmSegments[${i}].beat must be >= 0`);
                }
                if (typeof seg.bpm !== 'number' || seg.bpm <= 0) {
                    errors.push(`bpmSegments[${i}].bpm must be > 0`);
                }
            }
        }

        if (!Array.isArray(raw.noteEvents)) {
            errors.push('noteEvents must be an array');
        } else {
            const seenIds = new Set();
            for (let i = 0; i < raw.noteEvents.length; i++) {
                const n = raw.noteEvents[i];
                if (!n || typeof n !== 'object') {
                    errors.push(`noteEvents[${i}] must be an object`);
                    continue;
                }
                if (!n.id || typeof n.id !== 'string') {
                    errors.push(`noteEvents[${i}].id must be a non-empty string`);
                } else if (seenIds.has(n.id)) {
                    errors.push(`Duplicate note id: ${n.id}`);
                } else {
                    seenIds.add(n.id);
                }
                if (!Number.isInteger(n.laneIndex) || n.laneIndex < 0 || (Number.isInteger(laneCount) && n.laneIndex >= laneCount)) {
                    errors.push(`noteEvents[${i}].laneIndex out of range`);
                }
                if (typeof n.hitTimeMs !== 'number' || n.hitTimeMs < 0) {
                    errors.push(`noteEvents[${i}].hitTimeMs must be >= 0`);
                }
                if (!n.noteType || !SUPPORTED_NOTE_TYPES.has(n.noteType)) {
                    errors.push(`noteEvents[${i}].noteType "${n.noteType}" not supported`);
                }
                if (n.noteType === 'hold' && (typeof n.durationMs !== 'number' || n.durationMs <= 0)) {
                    errors.push(`noteEvents[${i}].durationMs required for hold`);
                }
            }
        }

        return errors.length ? { ok: false, errors } : { ok: true };
    }
}

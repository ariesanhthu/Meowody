import { Chart } from '../model/Chart.js';
import { Note } from '../model/Note.js';

/**
 * Maps validated simfile-derived external chart JSON to canonical Chart + Note models.
 */
export class ChartAdapter {
    /**
     * Convert structured external chart to internal Chart.
     *
     * Args:
     *   raw (object): Validated simfile-derived chart payload.
     *
     * Returns:
     *   { chart: Chart, importWarnings: string[] }
     *
     * Raises:
     *   Error: If sourceFormat is unrecognized.
     */
    static toChart(raw) {
        const warnings = Array.isArray(raw.importWarnings) ? [...raw.importWarnings] : [];

        const notes = (raw.noteEvents || [])
            .filter((n) => {
                if (n.noteType === 'hold') {
                    warnings.push(`Hold note ${n.id} downgraded to tap (phase 1)`);
                    return true;
                }
                return true;
            })
            .map((n) =>
                new Note({
                    id: n.id,
                    laneIndex: n.laneIndex,
                    hitTimeMs: n.hitTimeMs,
                    noteType: n.noteType === 'hold' ? 'tap' : n.noteType,
                    durationMs: n.noteType === 'hold' ? n.durationMs : null,
                    status: 'pending',
                }),
            )
            .sort((a, b) => a.hitTimeMs - b.hitTimeMs);

        const bpm = Array.isArray(raw.bpmSegments) && raw.bpmSegments.length > 0
            ? raw.bpmSegments[0].bpm
            : 120;

        const chart = new Chart({
            id: raw.chartId,
            songId: raw.songId,
            difficulty: raw.difficulty || 'normal',
            laneCount: raw.laneCount || 4,
            bpm,
            offsetMs: typeof raw.offsetMs === 'number' ? raw.offsetMs : 0,
            keymap: Array.isArray(raw.keymap) ? raw.keymap.map(String) : ['1', '2', '3', '4'],
            notes,
            metadata: {
                meter: raw.meter,
                chartName: raw.chartName,
                stepType: raw.stepType,
                sourceFormat: raw.sourceFormat,
            },
        });

        return { chart, importWarnings: warnings };
    }
}

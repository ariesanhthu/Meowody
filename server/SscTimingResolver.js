/**
 * Converts beat-based timing into absolute milliseconds.
 */

/**
 * Build a lookup function that converts beat -> ms relative to beat 0.
 * Offset is NOT applied here — the runtime GameClock handles offset separately.
 *
 * Args:
 *   bpmSegments ({ beat: number, bpm: number }[]): BPM change points.
 *   _offsetSec (number): Unused, kept for call-site compat. Offset handled by GameClock.
 *   stopSegments ({ beat: number, durationSec: number }[]): #STOPS data.
 *   delaySegments ({ beat: number, durationSec: number }[]): #DELAYS data.
 *
 * Returns:
 *   (beat: number) => number  — converts beat to ms from beat 0.
 *
 * Raises:
 *   Error: If bpmSegments is empty.
 */
function buildBeatToMsFunction(bpmSegments, _offsetSec = 0, stopSegments = [], delaySegments = []) {
    if (!bpmSegments || bpmSegments.length === 0) {
        throw new Error('bpmSegments must not be empty');
    }

    const sorted = [...bpmSegments].sort((a, b) => a.beat - b.beat);
    const stops = [...stopSegments].sort((a, b) => a.beat - b.beat);
    const delays = [...delaySegments].sort((a, b) => a.beat - b.beat);

    const precomputed = [];
    let accMs = 0;
    for (let i = 0; i < sorted.length; i++) {
        const seg = sorted[i];
        precomputed.push({ beat: seg.beat, bpm: seg.bpm, startMs: accMs });
        if (i + 1 < sorted.length) {
            const next = sorted[i + 1];
            const beatDelta = next.beat - seg.beat;
            const msPerBeat = 60000 / seg.bpm;
            accMs += beatDelta * msPerBeat;

            for (const s of stops) {
                if (s.beat >= seg.beat && s.beat < next.beat) {
                    accMs += s.durationSec * 1000;
                }
            }
            for (const d of delays) {
                if (d.beat >= seg.beat && d.beat < next.beat) {
                    accMs += d.durationSec * 1000;
                }
            }
        }
    }

    return function beatToMs(beat) {
        let segIdx = 0;
        for (let i = precomputed.length - 1; i >= 0; i--) {
            if (beat >= precomputed[i].beat) {
                segIdx = i;
                break;
            }
        }
        const seg = precomputed[segIdx];
        const beatDelta = beat - seg.beat;
        const msPerBeat = 60000 / seg.bpm;
        let ms = seg.startMs + beatDelta * msPerBeat;

        for (const s of stops) {
            if (s.beat > seg.beat && s.beat <= beat) {
                ms += s.durationSec * 1000;
            }
        }
        for (const d of delays) {
            if (d.beat > seg.beat && d.beat <= beat) {
                ms += d.durationSec * 1000;
            }
        }

        return ms;
    };
}

module.exports = { buildBeatToMsFunction };

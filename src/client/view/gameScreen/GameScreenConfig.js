/**
 * Central config for game screen layout.
 * Tweak values here — they are injected as CSS custom properties at runtime.
 */
const GameScreenConfig = {

    /* ── Lane grid ── */
    lane: {
        widthPct: 60,
        minWidthPx: 320,
        maxWidthPx: 700,
        borderWidthPx: 5,
        dividerWidthPx: 4,
        borderColor: '#1a1a1a',
    },

    /* ── Sketch line style (SVG) ── */
    sketchLine: {
        mainStroke: 9,
        dividerStroke: 7,
        hitLineStroke: 9,
        color: '#000',
        ghost1Color: 'rgba(0,0,0,0.45)',
        ghost1Offset: [1, -1],
        ghost2Color: 'rgba(0,0,0,0.2)',
        ghost2Offset: [-1, 1],
        roughScale: 1.5,
        roughFreq: 0.8,
    },

    /* ── Hit line ── */
    hitLine: {
        bottomPct: 20,
        heightPx: 5,
        color: '#1a1a1a',
    },

    /* ── Receptor zone (below hit line) ── */
    receptorZone: {
        heightPct: 20,
        borderTopPx: 5,
        color: '#1a1a1a',
    },

    /* ── Notes ── */
    note: {
        widthPx: 80,
        heightPx: 80,
        shadowAlpha: 0.22,
    },

    /* ── Cat paws ── */
    paw: {
        bottomPct: -5,
        minWidthPx: 500,
        preferredVw: 38,
        maxWidthPx: 800,
        // lane index 0..3 tương ứng phím 1..4.
        // xOffsetPx: lệch thêm theo trục X so với tâm lane (px).
        // Nếu chart remap key (ví dụ keymap đảo thứ tự), dùng keyTargets bên dưới
        // để bám theo phím thực tế thay vì lane index.
        laneTargets: [
            { side: 'left', xOffsetPx: 200 },    // phím 1 (giảm lệch, canh về lane 1)
            { side: 'left', xOffsetPx: 220 },   // phím 2
            { side: 'right', xOffsetPx: -220 },  // phím 3
            { side: 'right', xOffsetPx: -200 },  // phím 4
        ],
        // Ưu tiên theo phím bấm thực tế (data.key). Sửa ở đây để chắc chắn "ăn".
        keyTargets: {
            '1': { side: 'left', xOffsetPx: 200 },
            '2': { side: 'left', xOffsetPx: 220 },
            '3': { side: 'right', xOffsetPx: -220 },
            '4': { side: 'right', xOffsetPx: -200 },
        },
        moveDurationMs: 100,
        slamUpPx: 14,
        slamScale: 1.06,
        idleBeforeReturnMs: 80,
        returnDurationMs: 180,
    },

    /* ── Cat head (combo pose) ── */
    catHead: {
        bottomPct: -20,
        minWidthPx: 320,
        preferredVw: 46,
        maxWidthPx: 800,
        sideLeftPct: 25,
        sideRightPct: 75,
        centerPct: 50,
        hiddenOffsetPx: 90,
        xMoveDurationMs: 170,
        riseDurationMs: 190,
        hideDurationMs: 140,
    },

    /* ── GUI overlay (fish score + pause icon) ── */
    gui: {
        boardWidthVw: 15,    // Size of the score board relative to screen width
        boardTopPct: 2,      // Distance from top of the screen
        boardLeftPct: 2,     // Distance from left of the screen
        scoreTopPct: 50,     // Position of the text inside the board
        scoreLeftPct: 50,    // Position of the text inside the board
        scoreFontSizeClamp: [1.2, 2.5, 2.5],

    },

    /* ── Judgement text (GOOD / MISS / PERFECT) ── */
    judgement: {
        baseOffsetYFromHitPx: 10,  // tăng giá trị để chữ hiện cao hơn
        offsetXPerLanePx: [0, 0, 0, 0],
        perfectRisePx: 38,
        missDropPx: 12,
        perfectScaleFrom: 1.28,
        missScaleFrom: 0.9,
        perfectDurationMs: 460,
        missDurationMs: 520,
    },

    /* ── Debug overlay ── */
    debug: {
        showCollisionJudgement: false,
        panelTopPx: 12,
        panelRightPx: 12,
    },

    /* ── Background ── */
    background: {
        color: '#f5f3ef',
    },
};

export default GameScreenConfig;

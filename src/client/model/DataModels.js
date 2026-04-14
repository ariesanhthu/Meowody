/**
 * FILE: DataModels.js
 * PURPOSE: Defines stable JSDoc/TypeDef records representing DTOs per 03_CANONICAL_MODELS.md
 */

/**
 * @typedef {Object} JudgementResult
 * @property {string} judgement - Name of judgement (e.g. 'perfect', 'great', 'good', 'miss')
 * @property {number} deltaMs - Offset between valid hit time and actual press time
 * @property {string} noteId - ID of matching note
 * @property {number} laneIndex - Lane index
 * @property {number} awardedScore - Score added by this judgement
 * @property {number} comboAfterHit - Combo value post-judgement
 */

/**
 * @typedef {Object} RenderNote
 * @property {string} id
 * @property {number} laneIndex
 * @property {number} y - Current vertical rendering position
 * @property {string} noteType
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} RenderSnapshot
 * @property {number} currentTimeMs
 * @property {RenderNote[]} visibleNotes
 * @property {number} score
 * @property {number} combo
 * @property {number} accuracy
 * @property {string|null} lastJudgement
 * @property {string} scene
 */

/**
 * @typedef {Object} SongSummary
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {number} bpm
 * @property {number} durationMs
 * @property {string[]} difficulties
 */

/**
 * @typedef {Object} SongDetails
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} audioUrl
 * @property {number} bpm
 * @property {number} durationMs
 * @property {string} defaultChartId
 */

export {}; // Ensure file behaves as module

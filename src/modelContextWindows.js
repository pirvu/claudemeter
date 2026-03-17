// Project:   Claudemeter
// File:      modelContextWindows.js
// Purpose:   Resolve context window size from Claude model identifiers and observed usage
// Language:  JavaScript (CommonJS)
//
// License:   MIT
// Copyright: (c) 2026 HYPERI PTY LIMITED

// Model ID format from JSONL: "claude-{family}-{major}-{minor}" with optional context suffix
// e.g. "claude-opus-4-6", "claude-sonnet-4-6[1m]", "claude-opus-4-6[2m]"
//
// Claude Code defaults ALL models to 200K context, even on Max plans.
// Extended context is only active when the user explicitly enables it
// via a suffix like [1m] or [2m] in the Claude Code model selector.
//
// The suffix is parsed dynamically: [Nm] = N * 1,000,000 tokens.
// This is future-proof — when context grows to 2M, 5M, etc., it just works.
//
// Detection strategy (priority order):
//   1. Read Claude Code's VS Code setting `claudeCode.selectedModel` (e.g. "opus[1m]")
//   2. Check model IDs from JSONL for [Nm] suffix (future-proofing)
//   3. If observed tokens exceed 200K, infer extended context
//   4. Default: 200K

const STANDARD_LIMIT = 200000;
const FALLBACK_LIMIT = STANDARD_LIMIT;

// Parse context suffix like [1m], [2m], [500k] into a token count
// Returns 0 if no suffix or unrecognised format
function parseContextSuffix(suffix) {
    if (!suffix) return 0;

    const mMatch = suffix.match(/^\[(\d+)m\]$/);
    if (mMatch) return parseInt(mMatch[1], 10) * 1000000;

    const kMatch = suffix.match(/^\[(\d+)k\]$/);
    if (kMatch) return parseInt(kMatch[1], 10) * 1000;

    return 0;
}

// Extract context limit from a Claude Code model alias
// e.g. "opus[1m]" -> 1000000, "sonnet" -> 0, "claude-opus-4-6[2m]" -> 2000000
// Works with both short aliases and full model IDs
function parseModelAlias(alias) {
    if (!alias || typeof alias !== 'string') return 0;

    const suffixMatch = alias.match(/\[(\d+[mk])\]$/);
    if (!suffixMatch) return 0;

    return parseContextSuffix(`[${suffixMatch[1]}]`);
}

// Parse "claude-opus-4-6" -> { family: "opus", version: 4.6, contextLimit: 0 }
// Parse "claude-opus-4-6[1m]" -> { family: "opus", version: 4.6, contextLimit: 1000000 }
// Parse "claude-opus-4-6[2m]" -> { family: "opus", version: 4.6, contextLimit: 2000000 }
// contextLimit of 0 means "no suffix — use default"
// Returns null for unrecognised formats
function parseModelId(modelId) {
    if (!modelId || typeof modelId !== 'string') return null;

    // Match: claude-{family}-{major}-{minor} with optional context suffix [Nm] or [Nk]
    const match = modelId.match(/^claude-([a-z]+)-(\d+)-(\d+)(?:[^[]*)?(\[\d+[mk]\])?/);
    if (!match) return null;

    const family = match[1];
    const major = parseInt(match[2], 10);
    const minor = parseInt(match[3], 10);

    return {
        family,
        version: parseFloat(`${major}.${minor}`),
        contextLimit: parseContextSuffix(match[4]),
        raw: modelId,
    };
}

// Find the highest context limit declared by any model suffix in the array
// Returns 0 if no model has a context suffix
function getHighestDeclaredLimit(modelIds) {
    if (!modelIds || modelIds.length === 0) return 0;

    let highest = 0;
    for (const id of modelIds) {
        const parsed = parseModelId(id);
        if (parsed && parsed.contextLimit > highest) {
            highest = parsed.contextLimit;
        }
    }
    return highest;
}

// Resolve context window limit for a single model ID
// Returns the suffix-declared limit or STANDARD_LIMIT if no suffix
function getModelContextWindow(modelId) {
    const parsed = parseModelId(modelId);
    if (!parsed) return FALLBACK_LIMIT;
    return parsed.contextLimit || STANDARD_LIMIT;
}

// Given an array of model IDs seen in a session, return the resolved context window.
// Uses the highest of: alias limit, suffix-declared limit, observed token count, or 200K.
// aliasDeclaredLimit: context limit from claudeCode.selectedModel setting (e.g. 1000000)
// maxObservedTokens: highest token count seen in the session (e.g. cache_read)
function resolveSessionContextWindow(modelIds, maxObservedTokens = 0, aliasDeclaredLimit = 0) {
    const jsonlDeclaredLimit = getHighestDeclaredLimit(modelIds);

    // If observed tokens exceed the standard limit, the actual limit is at least that high
    const observedFloor = maxObservedTokens > STANDARD_LIMIT
        ? maxObservedTokens
        : 0;

    return Math.max(STANDARD_LIMIT, aliasDeclaredLimit, jsonlDeclaredLimit, observedFloor);
}

// Return context window info for tooltip display
function getPlanContextSummary() {
    return [
        { label: 'Default', limit: STANDARD_LIMIT },
    ];
}

module.exports = {
    parseModelId,
    parseModelAlias,
    parseContextSuffix,
    getHighestDeclaredLimit,
    getModelContextWindow,
    resolveSessionContextWindow,
    getPlanContextSummary,
    FALLBACK_LIMIT,
    STANDARD_LIMIT,
};

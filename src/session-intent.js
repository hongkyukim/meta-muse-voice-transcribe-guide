/**
 * Provider-neutral session intent for a realtime ASR integration.
 *
 * This module deliberately does not serialize an API request. Meta's public
 * research announcement confirms the product capabilities, but the exact
 * current wire contract must be copied from the authenticated Meta developer
 * reference before a production connection is made.
 */
export const PCM_S16LE_16K_MONO = Object.freeze({
  encoding: "pcm_s16le",
  sampleRateHz: 16_000,
  channels: 1,
});

export function buildMuseSessionIntent({ language = "auto", hotwords = [] } = {}) {
  if (language !== "auto" && (typeof language !== "string" || !language.trim())) {
    throw new TypeError("language must be 'auto' or a non-empty language hint");
  }

  const keywords = sanitizeHotwords(hotwords);
  return Object.freeze({
    provider: "meta",
    product: "muse-voice-transcribe",
    mode: "push_to_talk",
    audio: PCM_S16LE_16K_MONO,
    languageHint: language === "auto" ? undefined : language.trim(),
    keywordBias: keywords,
    diarization: false,
    contextBias: undefined,
  });
}

export function sanitizeHotwords(hotwords) {
  if (!Array.isArray(hotwords)) throw new TypeError("hotwords must be an array");
  return [...new Set(hotwords
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean))];
}

/**
 * Maps raw recognizer updates to UI-safe transcript state. Partial hypotheses
 * replace (rather than append to) the last unconfirmed text.
 */
export function reduceTranscript(state, event) {
  const prior = state ?? { confirmed: [], partial: "" };
  if (event.type === "partial") {
    return { ...prior, partial: event.text };
  }
  if (event.type === "final") {
    return { confirmed: [...prior.confirmed, event.text], partial: "" };
  }
  return prior;
}

export function transcriptText(state) {
  return [...state.confirmed, state.partial].filter(Boolean).join(" ");
}

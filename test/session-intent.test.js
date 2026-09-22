import test from "node:test";
import assert from "node:assert/strict";
import { buildMuseSessionIntent, reduceTranscript, transcriptText } from "../src/session-intent.js";

test("builds a privacy-constrained realtime session intent", () => {
  const intent = buildMuseSessionIntent({ language: "Chinese", hotwords: ["Hermes", "Hermes", ""] });
  assert.deepEqual(intent.audio, { encoding: "pcm_s16le", sampleRateHz: 16_000, channels: 1 });
  assert.equal(intent.mode, "push_to_talk");
  assert.equal(intent.languageHint, "Chinese");
  assert.deepEqual(intent.keywordBias, ["Hermes"]);
  assert.equal(intent.diarization, false);
  assert.equal(intent.contextBias, undefined);
});

test("replaces partial hypotheses and preserves finalized segments", () => {
  let state = reduceTranscript(undefined, { type: "partial", text: "hello world" });
  state = reduceTranscript(state, { type: "partial", text: "hello world from Muse" });
  assert.equal(transcriptText(state), "hello world from Muse");
  state = reduceTranscript(state, { type: "final", text: state.partial });
  state = reduceTranscript(state, { type: "partial", text: "again" });
  assert.equal(transcriptText(state), "hello world from Muse again");
});

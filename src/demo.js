import { buildMuseSessionIntent, reduceTranscript, transcriptText } from "./session-intent.js";

const intent = buildMuseSessionIntent({
  language: "English",
  hotwords: ["Meta", "Muse", "WebSocket", "Muse"],
});

let transcript = reduceTranscript(undefined, { type: "partial", text: "Build a realtime" });
transcript = reduceTranscript(transcript, { type: "partial", text: "Build a realtime voice interface" });
transcript = reduceTranscript(transcript, { type: "final", text: transcript.partial });

console.log(JSON.stringify({ intent, transcript: transcriptText(transcript) }, null, 2));

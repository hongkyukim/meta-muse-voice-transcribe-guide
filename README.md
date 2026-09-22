# Meta Muse Voice Transcribe: developer guide

A runnable, contract-first starter for integrating **Meta Muse Voice Transcribe** into an application.

## What is Meta Muse?

Meta's published name is **Muse Voice Transcribe**, a hosted, real-time automatic speech-recognition (ASR) model in the Meta Model API ecosystem. Meta's research announcement describes streaming transcription, adaptive delay, endpointing, speaker diarization, code-switching, and language, keyword, and context biasing. This repository uses “Meta Muse” as the developer-facing shorthand.

This project is intentionally not an unofficial API SDK. The public research material establishes the capability, but API authentication, event names, limits, and request fields can change. Copy those details from the authenticated Meta developer reference before implementing the transport.

## What this repository provides

- A small, dependency-free Node.js module that models a privacy-constrained realtime session.
- A correct transcript reducer: partial hypotheses replace the in-progress text; finalized segments are retained.
- A dependency-graph workflow with four collaborating roles: session designer, transcriber, insight agent, action agent, and a final reviewer.
- Dynamic integration selection: application code chooses a provider by declared capability, while the Meta transport stays behind an injected adapter.
- A demo and tests that run without a Meta account, credential, microphone, or network call.
- Production integration guidance and an API-contract checklist.

## Run it

Prerequisite: Node.js 20 or newer.

```sh
npm test
npm run demo
```

The demo runs a complete collaborative workflow using a deterministic replay adapter. It prints the reviewed transcript, key points, and action candidates without calling Meta's service.

## Collaborative agent graph

`src/collaborative-agents.js` models a practical application workflow:

```text
session-designer → transcriber ─┬→ insight-agent ─┐
                                ├→ action-agent  ─┼→ review-agent
                                └─────────────────┘
```

The graph executor runs independent nodes concurrently after their dependencies complete. The current roles are deterministic application agents: they create a safe ASR intent, transcribe through a dynamically selected provider, identify sentence-level key points and action language, and combine the results in a review step. Replace only the role functions if you want an LLM to perform enrichment.

### Dynamic Meta Muse integration

`DynamicIntegrationRegistry` resolves a provider by capability (`realtime-transcription`), not by a hard-coded vendor branch. `createMetaMuseAdapter({ stream })` accepts an injected, provider-specific async event stream. Implement that one callback from the current official Meta contract; the graph, UI state, and collaboration logic do not change.

```js
const adapter = createMetaMuseAdapter({
  async *stream({ intent, audio }) {
    // Authenticate and translate `intent` using the current official API spec.
    // Send `audio` at realtime pace; yield only { type: "partial" | "final", text }.
  },
});
const registry = new DynamicIntegrationRegistry().register(adapter);
const result = await createCollaborativeMuseWorkflow({ registry }).execute({
  session: { language: "English", hotwords: ["Meta Muse"] },
  audio: microphoneChunks,
});
```

The repository's demo uses `createReplayMetaMuseAdapter()` instead. It is a credential-free test double, not a live API client.

## How to use Muse in an app

1. Create a Meta developer account, obtain an API key, and confirm that the account has Muse Voice Transcribe access.
2. In the official, authenticated API reference, record the current realtime endpoint, model identifier, authentication placement, configuration-frame schema, audio-frame format, end-of-input signal, and response events.
3. Capture microphone audio as the exact format required by that reference. A common integration target is raw mono signed-16-bit PCM at 16 kHz; validate it against the current reference rather than assuming it.
4. Open the realtime transport and wait for both the socket connection and the provider's explicit session-ready acknowledgment before reporting that recording has begun.
5. Send an explicit session configuration. Start with push-to-talk semantics, no diarization, no context biasing, and only user-approved keyword biasing.
6. Stream audio at approximately real-time speed. Do not upload a long buffered recording through the realtime connection in a burst.
7. Render partial results as replacements. On a final result, append it to confirmed text; when the user releases push-to-talk, send the provider's end-of-input message and keep listening until the final event arrives.
8. Test wrong credentials, rejected session setup, partial replacement, duplicate finals, normal close, network close, rate limiting, and user cancellation.

`src/session-intent.js` implements steps 5 and 7 as provider-independent application logic. Your real integration should translate `buildMuseSessionIntent()` into the official schema at a single boundary module.

## Safe product defaults

- Use push-to-talk first. Do not let provider endpointing silently control a user's recording lifecycle.
- Start with diarization disabled unless speaker labels are a product requirement.
- Keep context biasing off until users explicitly approve what application text may leave their device.
- Treat keyword biasing as user-provided configuration; never log the full keyword list.
- Do not log audio, access tokens, full transcripts, or raw provider events.

## Sources and verification boundary

- Meta Research: [Introducing Muse Voice Transcribe](https://research.meta.ai/blog/introducing-muse-voice-transcribe/)
- The current Meta developer console/API reference is the authoritative source for the live API contract.
- `docs/api-contract-checklist.md` defines the information that must be verified before a transport implementation is released.

## Repository layout

```text
src/session-intent.js          session policy and transcript reducer
src/workflow-graph.js          dependency-graph executor
src/integrations.js            dynamic provider registry and Meta adapter seam
src/collaborative-agents.js    collaborating role graph
src/demo.js                    no-credential runnable example
test/                  Node built-in test suite
docs/                  production API verification checklist
```

## Status

The local module is production-usable as application-side state logic. The provider transport is intentionally absent until it can be built from the current official Meta API contract and exercised with a real, entitled test account.

# Meta Muse Voice Transcribe API contract checklist

Complete this checklist from the authenticated Meta developer console before adding a production transport. The research announcement is not a wire-protocol specification.

## Access and compliance

- [ ] Account is entitled to the current Muse Voice Transcribe product.
- [ ] Accepted current product terms, pricing, quotas, regional availability, retention policy, and data-use policy.
- [ ] Stored the API key in a secret manager or platform secret store; it is never bundled in client code.
- [ ] Confirmed whether browser clients must call the provider through a server-side token exchange.

## Realtime connection

- [ ] Official WebSocket/streaming endpoint.
- [ ] Official model ID.
- [ ] Authentication location: HTTP upgrade headers, first protocol frame, or another mechanism.
- [ ] Session-ready acknowledgment event and its timeout.
- [ ] Server error and close-event schema.
- [ ] Rate, backlog, concurrency, audio-duration, and session-duration limits.

## Session configuration

- [ ] Exact config JSON schema and required event type.
- [ ] Current push-to-talk mode value.
- [ ] Audio encoding, sample rate, channels, byte order, frame size, and whether frames are binary or JSON/base64.
- [ ] Language-bias field and supported values.
- [ ] Keyword-bias field, count/length limits, and sanitation rules.
- [ ] Diarization field and response schema, if enabled.
- [ ] End-of-input/commit event.

## Result processing

- [ ] Partial event schema; determine whether text is a cumulative hypothesis or delta.
- [ ] Final transcript event schema.
- [ ] Completion event and ordering relative to the final transcript.
- [ ] Turn/request identifier behavior when multiple utterances are possible.
- [ ] Retry behavior and whether any session-resume mechanism exists.

## Integration acceptance tests

Use a non-production project and redacted fixtures.

- [ ] Valid key reaches explicit session ready.
- [ ] Invalid key fails before the UI calls the session ready.
- [ ] A short recording yields partial then final text.
- [ ] Repeated partials replace, not duplicate, the visible hypothesis.
- [ ] End input waits for final text before closing.
- [ ] A bad network close ends the UI session cleanly with a safe error.
- [ ] No token, audio, full transcript, or raw keyword content reaches logs/traces.
- [ ] Test English, another target language, and code-switching if your product supports them.

## Architecture boundary

Keep all verified provider-specific constants and serialization in one module, such as `src/meta-muse-transport.js`. Keep UI state and transcript reduction provider-neutral, as in this repository. This prevents an API change from spreading through the application.

import { reduceTranscript, transcriptText } from "./session-intent.js";

/** Runtime registry: integrations are chosen by declared capabilities, not names in app code. */
export class DynamicIntegrationRegistry {
  #providers = new Map();

  register(provider) {
    if (!provider?.id || typeof provider.transcribe !== "function") {
      throw new TypeError("provider requires an id and transcribe function");
    }
    this.#providers.set(provider.id, Object.freeze({ ...provider, capabilities: provider.capabilities ?? [] }));
    return this;
  }

  resolve({ capability, preferredId } = {}) {
    const candidates = preferredId ? [this.#providers.get(preferredId)] : [...this.#providers.values()];
    const provider = candidates.find((candidate) => candidate?.capabilities.includes(capability));
    if (!provider) throw new Error(`no integration supports capability: ${capability}`);
    return provider;
  }
}

/**
 * Adapter seam for the Meta transport. `stream` must be implemented from the
 * currently authenticated official API contract; this wrapper owns no token
 * and guesses no provider wire fields.
 */
export function createMetaMuseAdapter({ stream }) {
  if (typeof stream !== "function") throw new TypeError("stream must be a function");
  return Object.freeze({
    id: "meta-muse",
    capabilities: ["realtime-transcription"],
    async transcribe({ intent, audio }) {
      let state;
      for await (const event of stream({ intent, audio })) {
        if (!["partial", "final"].includes(event.type)) continue;
        state = reduceTranscript(state, event);
      }
      return Object.freeze({ text: transcriptText(state ?? { confirmed: [], partial: "" }), intent });
    },
  });
}

/** Credential-free deterministic adapter used by the demo and CI. */
export function createReplayMetaMuseAdapter(events) {
  return createMetaMuseAdapter({
    async *stream() {
      for (const event of events) yield event;
    },
  });
}

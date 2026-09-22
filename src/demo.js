import { createCollaborativeMuseWorkflow } from "./collaborative-agents.js";
import { createReplayMetaMuseAdapter, DynamicIntegrationRegistry } from "./integrations.js";

const registry = new DynamicIntegrationRegistry().register(createReplayMetaMuseAdapter([
  { type: "partial", text: "We should build a realtime voice interface" },
  { type: "final", text: "We should build a realtime voice interface." },
  { type: "partial", text: "The team will verify the API contract" },
  { type: "final", text: "The team will verify the API contract." },
]));

const results = await createCollaborativeMuseWorkflow({ registry }).execute({
  session: { language: "English", hotwords: ["Meta", "Muse", "WebSocket"] },
  audio: [],
});

console.log(JSON.stringify(results["review-agent"], null, 2));

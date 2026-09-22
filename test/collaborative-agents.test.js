import test from "node:test";
import assert from "node:assert/strict";
import { createCollaborativeMuseWorkflow } from "../src/collaborative-agents.js";
import { createReplayMetaMuseAdapter, DynamicIntegrationRegistry } from "../src/integrations.js";
import { WorkflowGraph } from "../src/workflow-graph.js";

test("runs collaborating agents through a Meta Muse integration selected at runtime", async () => {
  const registry = new DynamicIntegrationRegistry().register(createReplayMetaMuseAdapter([
    { type: "partial", text: "We should add the integration" },
    { type: "final", text: "We should add the integration." },
    { type: "partial", text: "The team will review the API contract" },
    { type: "final", text: "The team will review the API contract." },
  ]));
  const result = await createCollaborativeMuseWorkflow({ registry }).execute({
    session: { language: "English", hotwords: ["Meta Muse"] },
    audio: [new Uint8Array([1, 2, 3])],
  });

  assert.deepEqual(result["review-agent"], {
    transcript: "We should add the integration. The team will review the API contract.",
    keyPoints: ["We should add the integration", "The team will review the API contract"],
    actions: ["We should add the integration", "The team will review the API contract"],
    reviewed: true,
  });
  assert.equal(result.transcriber.intent.languageHint, "English");
});

test("rejects providers that do not declare a required capability", () => {
  const registry = new DynamicIntegrationRegistry().register({
    id: "other", capabilities: ["batch"], transcribe: async () => ({ text: "" }),
  });
  assert.throws(() => registry.resolve({ capability: "realtime-transcription" }), /no integration/);
});

test("detects invalid graph dependencies before executing agents", async () => {
  const graph = new WorkflowGraph().addNode({ id: "a", dependsOn: ["missing"], run: () => "unused" });
  await assert.rejects(() => graph.execute({}), /unknown node missing/);
});

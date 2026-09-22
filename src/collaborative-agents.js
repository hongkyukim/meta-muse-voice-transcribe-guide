import { buildMuseSessionIntent } from "./session-intent.js";
import { WorkflowGraph } from "./workflow-graph.js";

const sentenceList = (text) => text.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);

export function createCollaborativeMuseWorkflow({ registry, providerId } = {}) {
  if (!registry) throw new TypeError("registry is required");
  const graph = new WorkflowGraph();

  graph.addNode({
    id: "session-designer",
    run: ({ input }) => buildMuseSessionIntent(input.session),
  });
  graph.addNode({
    id: "transcriber",
    dependsOn: ["session-designer"],
    run: async ({ input, dependencies }) => {
      const provider = registry.resolve({ capability: "realtime-transcription", preferredId: providerId });
      return provider.transcribe({ intent: dependencies["session-designer"], audio: input.audio });
    },
  });
  graph.addNode({
    id: "insight-agent",
    dependsOn: ["transcriber"],
    run: ({ dependencies }) => {
      const transcript = dependencies.transcriber.text;
      return Object.freeze({ keyPoints: sentenceList(transcript).slice(0, 3) });
    },
  });
  graph.addNode({
    id: "action-agent",
    dependsOn: ["transcriber"],
    run: ({ dependencies }) => ({
      actions: sentenceList(dependencies.transcriber.text)
        .filter((sentence) => /\b(need|should|will|todo|action)\b/i.test(sentence)),
    }),
  });
  graph.addNode({
    id: "review-agent",
    dependsOn: ["transcriber", "insight-agent", "action-agent"],
    run: ({ dependencies }) => Object.freeze({
      transcript: dependencies.transcriber.text,
      keyPoints: dependencies["insight-agent"].keyPoints,
      actions: dependencies["action-agent"].actions,
      reviewed: true,
    }),
  });

  return graph;
}

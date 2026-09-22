/** A dependency graph executor for small, inspectable agent workflows. */
export class WorkflowGraph {
  #nodes = new Map();

  addNode({ id, dependsOn = [], run }) {
    if (!id || typeof id !== "string") throw new TypeError("node id must be a string");
    if (this.#nodes.has(id)) throw new Error(`duplicate workflow node: ${id}`);
    if (!Array.isArray(dependsOn) || dependsOn.includes(id)) {
      throw new Error(`invalid dependencies for node: ${id}`);
    }
    if (typeof run !== "function") throw new TypeError(`node ${id} must have a run function`);
    this.#nodes.set(id, { id, dependsOn: [...dependsOn], run });
    return this;
  }

  async execute(input) {
    this.#validate();
    const pending = new Set(this.#nodes.keys());
    const outputs = new Map();

    while (pending.size) {
      const ready = [...pending]
        .map((id) => this.#nodes.get(id))
        .filter((node) => node.dependsOn.every((id) => outputs.has(id)));
      if (!ready.length) throw new Error("workflow graph contains a dependency cycle");

      const completed = await Promise.all(ready.map(async (node) => {
        const dependencies = Object.freeze(Object.fromEntries(
          node.dependsOn.map((id) => [id, outputs.get(id)]),
        ));
        const context = Object.freeze({ input, dependencies, nodeId: node.id });
        return [node.id, await node.run(context)];
      }));
      for (const [id, output] of completed) {
        if (output === undefined) throw new Error(`workflow node ${id} returned undefined`);
        outputs.set(id, output);
        pending.delete(id);
      }
    }
    return Object.freeze(Object.fromEntries(outputs));
  }

  #validate() {
    for (const node of this.#nodes.values()) {
      for (const dependency of node.dependsOn) {
        if (!this.#nodes.has(dependency)) {
          throw new Error(`node ${node.id} depends on unknown node ${dependency}`);
        }
      }
    }
  }
}

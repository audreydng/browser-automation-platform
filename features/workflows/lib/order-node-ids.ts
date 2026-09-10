import toposort from "toposort"

// The nodes a run walks, in dependency order. Only connected nodes count —
// anything touching an edge — so orphans dropped on the canvas are left out.
//
// Shared by the run task and the console's pre-run preview so both list the
// same steps in the same order. Throws on a cycle, which is what the task
// wants; the console catches it, since a cycle mid-edit is just a canvas the
// user has not finished wiring.
export function orderNodeIds({
  nodes,
  edges,
}: {
  nodes: { id: string }[]
  edges: { source: string; target: string }[]
}): string[] {
  const connected = new Set(edges.flatMap((e) => [e.source, e.target]))

  return toposort
    .array(
      nodes.map((n) => n.id),
      edges.map((e) => [e.source, e.target])
    )
    .filter((id) => connected.has(id))
}

import { gate5AdapterRegistry } from "./teach-gate5-contracts.ts";
import { computeQuasicrystalStructuralAddress } from "./teach-quasicrystal-address.ts";

export type KnowledgeGraphNode = { id: string };
export type KnowledgeGraphEdge = { id: string; source: string; target: string; weight?: number };
export type KnowledgeGraphDelta = { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] };

const maxNodes = 128;
const maxEdges = 512;

function finiteWeight(value: unknown) {
  const weight = typeof value === "number" ? value : 1;
  if (!Number.isFinite(weight) || weight <= 0 || weight > 1000) throw new Error("Edge weights must be finite and in (0, 1000].");
  return weight;
}

function stableId(value: unknown, label: string) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value)) throw new Error(`${label} must be an opaque stable identifier.`);
  return value;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function computeKnowledgeGatewayReceipt(input: {
  pluginId: string;
  requestId: string;
  idempotencyKey: string;
  purpose: string;
  consentReceiptId: string;
  tenantPseudonym: string;
  graphDelta: KnowledgeGraphDelta;
}) {
  const nodes = [...input.graphDelta.nodes].map((node) => ({ id: stableId(node.id, "Node id") })).sort((left, right) => left.id.localeCompare(right.id));
  const edges = [...input.graphDelta.edges].map((edge) => ({
    id: stableId(edge.id, "Edge id"), source: stableId(edge.source, "Edge source"), target: stableId(edge.target, "Edge target"), weight: finiteWeight(edge.weight),
  })).sort((left, right) => left.id.localeCompare(right.id));
  if (!nodes.length || nodes.length > maxNodes || edges.length > maxEdges) throw new Error(`Graph delta must contain 1-${maxNodes} nodes and at most ${maxEdges} edges.`);
  if (new Set(nodes.map((node) => node.id)).size !== nodes.length || new Set(edges.map((edge) => edge.id)).size !== edges.length) throw new Error("Graph node and edge ids must be unique.");

  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));
  for (const edge of edges) if (!nodeIndex.has(edge.source) || !nodeIndex.has(edge.target)) throw new Error(`Edge ${edge.id} references an unknown node.`);

  const size = nodes.length;
  const adjacency = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const incidence = Array.from({ length: size }, () => Array<number>(edges.length).fill(0));
  const unweightedDegree = Array<number>(size).fill(0);
  edges.forEach((edge, edgeIndex) => {
    const source = nodeIndex.get(edge.source)!;
    const target = nodeIndex.get(edge.target)!;
    if (source === target) {
      adjacency[source][source] += 2 * edge.weight;
      unweightedDegree[source] += 2;
      return;
    }
    adjacency[source][target] += edge.weight;
    adjacency[target][source] += edge.weight;
    incidence[source][edgeIndex] = -1;
    incidence[target][edgeIndex] = 1;
    unweightedDegree[source] += 1;
    unweightedDegree[target] += 1;
  });
  const weightedDegree = adjacency.map((row) => row.reduce((sum, value) => sum + value, 0));
  const degree = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => row === column ? weightedDegree[row] : 0));
  const laplacian = degree.map((row, rowIndex) => row.map((value, columnIndex) => value - adjacency[rowIndex][columnIndex]));

  const active = new Set(unweightedDegree.map((value, index) => value > 0 ? index : -1).filter((index) => index >= 0));
  const visited = new Set<number>();
  const components: number[][] = [];
  for (const start of active) {
    if (visited.has(start)) continue;
    const component: number[] = [];
    const stack = [start];
    visited.add(start);
    while (stack.length) {
      const current = stack.pop()!;
      component.push(current);
      adjacency[current].forEach((value, neighbor) => {
        if (value > 0 && !visited.has(neighbor)) { visited.add(neighbor); stack.push(neighbor); }
      });
    }
    components.push(component.sort((left, right) => left - right));
  }
  const connectedForEuler = components.length <= 1;
  const oddDegreeVertices = unweightedDegree.map((value, index) => value % 2 === 1 ? nodes[index].id : "").filter(Boolean);
  const eulerianStatus = !connectedForEuler ? "none" : oddDegreeVertices.length === 0 ? "circuit" : oddDegreeVertices.length === 2 ? "trail" : "none";

  const rawVector = [...adjacency.flat(), ...laplacian.flat(), ...weightedDegree];
  const norm = Math.sqrt(rawVector.reduce((sum, value) => sum + value * value, 0));
  const vector = rawVector.map((value) => norm === 0 ? 0 : Number((value / norm).toFixed(12)));
  const projectionDigest = await sha256(JSON.stringify({ nodeOrder: nodes.map((node) => node.id), edgeOrder: edges.map((edge) => edge.id), vector }));

  const hilbertLocation = {
    schema: "scholarium.hilbert-location.v1", basisId: "ordered-adjacency-laplacian-degree.v1", algorithmVersion: "1.0.0",
    dimension: vector.length, normalization: "l2", sourceNodeIds: nodes.map((node) => node.id), vector, norm: Number(norm.toFixed(12)),
    projectionDigest: `sha256:${projectionDigest}`, uncertainty: 1, authority: "computational_representation_only",
  };
  const quasicrystalAddress = await computeQuasicrystalStructuralAddress({ hilbertLocation });

  return {
    schema: "scholarium.central-knowledge-gateway-receipt.v1",
    pluginId: stableId(input.pluginId, "Plugin id"),
    requestId: stableId(input.requestId, "Request id"),
    idempotencyKey: stableId(input.idempotencyKey, "Idempotency key"),
    purpose: input.purpose.slice(0, 240),
    consentReceiptId: stableId(input.consentReceiptId, "Consent receipt id"),
    tenantPseudonym: input.tenantPseudonym,
    partition: "preparation" as const,
    adapterStatus: {
      registry: "scholarium.gate5-adapter-registry.v1",
      synthia: gate5AdapterRegistry.synthia.state,
      memoryLake: gate5AdapterRegistry["memory-lake"].state,
      hippoRag: gate5AdapterRegistry.hipporag.state,
      fnpQnn: gate5AdapterRegistry["fnp-qnn"].state,
      media: gate5AdapterRegistry["quantech-vid"].state,
      tenebris: gate5AdapterRegistry.tenebris.state,
      runtimeInvocationPerformed: false,
    },
    ordering: { nodes: nodes.map((node) => node.id), edges: edges.map((edge) => edge.id) },
    matrices: { adjacency, orientedIncidence: incidence, degree, laplacian },
    eulerian: { connectedComponents: components.map((component) => component.map((index) => nodes[index].id)), oddDegreeVertices, status: eulerianStatus },
    hilbertLocation,
    quasicrystalAddress,
    limitations: ["No external adapter invocation was performed by this deterministic receipt computation.", "Gate5 dispatch remains a separate durable, consent-bound operation.", "Preparation output is not approved pedagogical evidence."],
  };
}

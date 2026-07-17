import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const corpus = path.join(root, "docs", "teach", "corpus");
const json = (name) => JSON.parse(fs.readFileSync(path.join(corpus, name), "utf8"));
const jsonl = (name) => fs.readFileSync(path.join(corpus, name), "utf8").trim().split(/\r?\n/u).map((line) => JSON.parse(line));

test("education corpus contains 125 unique traceable source cards", () => {
  const cards = jsonl("source-cards.jsonl");
  assert.equal(cards.length, 125);
  assert.equal(new Set(cards.map((card) => card.sourceCardId)).size, 125);
  assert.equal(new Set(cards.map((card) => card.doi ?? card.canonicalUrl)).size, 125);
  for (const card of cards) {
    assert.equal(card.schema, "synthia.education.source-card.v1");
    assert.equal(card.partition, "preparation");
    for (const field of ["title", "authors", "issued", "canonicalUrl", "citation", "metadataSource", "metadataRights"]) assert.ok(card[field], `${card.sourceCardId} missing ${field}`);
  }
});

test("Synthia classifications preserve the lexicon hierarchy and authority boundary", () => {
  const run = json("classification-run.json");
  const classifications = jsonl("synthia-classifications.jsonl");
  assert.equal(run.sourceCardCount, 125);
  assert.equal(run.synthiaInvocationCount, 125);
  assert.equal(run.hierarchy, "I -> I_system^S -> H_lex -> G_lex -> I_lexicon");
  assert.equal(run.memoryGateway.intraPluginMemory, false);
  assert.equal(classifications.length, 125);
  for (const classification of classifications) {
    assert.equal(classification.hierarchy, run.hierarchy);
    assert.match(classification.rawReceiptDigest, /^sha256:[a-f0-9]{64}$/u);
    assert.match(classification.authorityBoundary, /human review/iu);
  }
});

test("OpenIE packets and partition graphs remain preparation-only", () => {
  const packets = jsonl("openie-packets.jsonl");
  const preparation = json(path.join("graphs", "preparation.json"));
  const approved = json(path.join("graphs", "approved.json"));
  const quarantine = json(path.join("graphs", "quarantine.json"));
  assert.equal(packets.length, 125);
  assert.equal(preparation.sourceCount, 125);
  assert.equal(approved.sourceCount, 0);
  assert.equal(quarantine.sourceCount, 0);
  assert.equal(preparation.shards.length, 8);
  for (const packet of packets) {
    assert.equal(packet.partition, "preparation");
    assert.deepEqual(packet.contradictions, []);
    assert.ok(packet.entities.length >= 4);
    assert.ok(packet.relations.length >= 3);
    assert.match(packet.authorityBoundary, /not validated causal or pedagogical claims/iu);
  }
});

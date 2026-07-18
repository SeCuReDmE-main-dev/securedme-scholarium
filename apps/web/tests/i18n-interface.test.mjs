import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function catalog(locale) {
  return JSON.parse(await readFile(new URL(`public/i18n/${locale}.json`, root), "utf8"));
}

test("ships one deterministic FR EN ES interface contract", async () => {
  const [english, french, spanish] = await Promise.all([catalog("en-CA"), catalog("fr-CA"), catalog("es")]);
  assert.equal(english.$translationStatus, "canonical");
  assert.equal(french.$translationStatus, "machine-draft-with-reviewed-core-glossary");
  assert.equal(spanish.$translationStatus, "machine-draft-with-reviewed-core-glossary");
  assert.deepEqual(Object.keys(french.strings), Object.keys(english.strings));
  assert.deepEqual(Object.keys(spanish.strings), Object.keys(english.strings));
  assert.ok(Object.keys(english.strings).length >= 900);
  for (const catalog of [english, french, spanish]) {
    const keys = Object.keys(catalog.strings).join("\n");
    assert.doesNotMatch(keys, /(^|\n)[.:;\[\]{}]/);
    assert.doesNotMatch(keys, /\b(return|null|undefined|Array<|repositoryLinks)\b/);
    assert.doesNotMatch(keys, /\[data-|video\/\*|\?:/);
  }
});

test("keeps interface locale separate from private content translation", async () => {
  const [controls, runtime, preferences] = await Promise.all([
    readFile(new URL("app/components/scholarium-controls.tsx", root), "utf8"),
    readFile(new URL("app/components/scholarium-locale-runtime.tsx", root), "utf8"),
    readFile(new URL("app/api/translation-preferences/route.ts", root), "utf8"),
  ]);
  assert.match(controls, /scholarium\.locale\.v1/);
  assert.match(controls, /value="fr-CA"/);
  assert.match(controls, /value="en-CA"/);
  assert.match(controls, /value="es"/);
  assert.match(runtime, /data-user-content/);
  assert.match(runtime, /publication-content h2/);
  assert.match(preferences, /translationPreferenceContract/);
  assert.doesNotMatch(runtime, /translation-preferences/);
});

test("restores French accents and preserves the Spanish lesson", async () => {
  const french = await catalog("fr-CA");
  const rendered = Object.values(french.strings).join("\n");
  assert.doesNotMatch(rendered, /\b(Controles|Demarrer|Reinitialiser|Ecouter|Verifier|difficulte|reponse|sequence|maitrisees|penalite|delai|donnees|eleve|ecole|education)\b/);
  assert.equal(french.strings.Access, "Accès");
  assert.equal(french.strings.Controles, "Contrôles");
  assert.equal(french.strings["Maîtrisée"], "Maîtrisé");
  assert.equal(french.strings["À revoir"], "À revoir");
  assert.equal(Object.hasOwn(french.strings, "Necesito una pista."), false);
});

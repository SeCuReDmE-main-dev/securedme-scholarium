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

test("blocks known poor French and Spanish catalog regressions", async () => {
  const [english, french, spanish] = await Promise.all([catalog("en-CA"), catalog("fr-CA"), catalog("es")]);
  const frenchRendered = Object.values(french.strings).join("\n");
  const spanishRendered = Object.values(spanish.strings).join("\n");

  assert.doesNotMatch(frenchRendered, /rang d'aliment|CONNAISSANCE DURABLE TRAIL|Profil Access|Heureur|capsule d'Aucune|Préparation du retrait/i);
  assert.doesNotMatch(spanishRendered, /A public pre-alpha commons|Adaptive, multimodal learning|AUTHOR-LED PRODUCTION BRIEF|A DURABLE KnowLEDGE TRAIL|Accessibility|Adaptateurs prives|Aucun cercle|Aucun projet/i);

  assert.equal(french.strings["A contribution supports the project, never the feed rank."], "Une contribution soutient le projet, jamais le classement du fil.");
  assert.equal(french.strings["A DURABLE KNOWLEDGE TRAIL"], "UNE TRACE DURABLE DU SAVOIR");
  assert.equal(french.strings["PUBLIC RESEARCH LIBRARY"], "BIBLIOTHÈQUE PUBLIQUE DE RECHERCHE");
  assert.equal(spanish.strings["A DURABLE KNOWLEDGE TRAIL"], "UNA HUELLA DURADERA DEL CONOCIMIENTO");
  assert.equal(spanish.strings["A public pre-alpha commons for publishing research and learning artifacts with sources, versions, provenance, and human review."], "Un espacio público prealfa para publicar trabajos de investigación y aprendizaje con fuentes, versiones, procedencia y revisión humana.");
  assert.equal(spanish.strings["Aller au contenu principal"], "Ir al contenido principal");

  for (const key of ["document.querySelector", "scholarium.access.v1", "twitter:description", "image/png,image/jpeg,image/webp"]) {
    assert.equal(Object.hasOwn(english.strings, key), false);
    assert.equal(Object.hasOwn(french.strings, key), false);
    assert.equal(Object.hasOwn(spanish.strings, key), false);
  }
});

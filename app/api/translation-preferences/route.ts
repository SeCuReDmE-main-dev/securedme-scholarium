import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { readerPreferences } from "../../../db/schema";
import { readerPreferenceInsert, translationPreferenceContract, translationPreferenceFromRow, type TranslationPreferenceInput } from "../../../lib/reader-preferences";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const db = await getDb();
  const [row] = await db.select().from(readerPreferences).where(eq(readerPreferences.userId, identity.userId)).limit(1);
  return Response.json({ preference: translationPreferenceFromRow(row) }, { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = (await request.json()) as TranslationPreferenceInput;
  const preference = translationPreferenceContract(input);
  const updatedAt = new Date().toISOString();
  const db = await getDb();
  await db.insert(readerPreferences).values({
    ...readerPreferenceInsert(identity.userId),
    allowPublicationTranslation: preference.allowPublicationTranslation,
    glossaryTerms: JSON.stringify(preference.glossaryTerms),
    interfaceLanguage: preference.interfaceLanguage,
    showOriginalFirst: preference.showOriginalFirst,
    updatedAt,
  }).onConflictDoUpdate({
    target: readerPreferences.userId,
    set: {
      allowPublicationTranslation: preference.allowPublicationTranslation,
      glossaryTerms: JSON.stringify(preference.glossaryTerms),
      interfaceLanguage: preference.interfaceLanguage,
      showOriginalFirst: preference.showOriginalFirst,
      updatedAt,
    },
  });
  return Response.json({ preference }, { headers: { "cache-control": "private, no-store" } });
}

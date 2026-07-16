import { eq, inArray, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  algoquestLearningEvents, growthStories, learningAttempts, learningHints, learningObjectives, learningQuestions,
  learningReminders, strengthObservations, teachCheckpoints, teachCourses, teachEnrollments, teachLessons,
  teachAssistantExchanges, teachAssistantGraphRecords, teachInterventionPreferences, teachMediaRequests,
  teachMediaPublicationConfirmations, teachGate5Jobs,
  teachModules, teachPurposeConsents, teachWeeklyObjectives, teachCircleMemberships, teachCircles,
  teachProjectEntries, teachProjectThreads, teachRecognitions, teachRecaps,
} from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";

/** Deletes the account owner's Teach domain records without deleting their Scholarium identity or publications. */
export async function DELETE() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const db = await getDb();
  const courses = await db.select({ id: teachCourses.id }).from(teachCourses).where(eq(teachCourses.ownerId, identity.userId));
  const courseIds = courses.map((row) => row.id);
  const lessons = courseIds.length ? await db.select({ id: teachLessons.id }).from(teachLessons).where(inArray(teachLessons.courseId, courseIds)) : [];
  const lessonIds = lessons.map((row) => row.id);
  const objectives = lessonIds.length ? await db.select({ id: learningObjectives.id }).from(learningObjectives).where(inArray(learningObjectives.lessonId, lessonIds)) : [];
  const objectiveIds = objectives.map((row) => row.id);
  const ownedProjects = await db.select({ id: teachProjectThreads.id }).from(teachProjectThreads).where(eq(teachProjectThreads.ownerUserId, identity.userId));
  const ownedProjectIds = ownedProjects.map((row) => row.id);
  const ownedCircles = await db.select({ id: teachCircles.id }).from(teachCircles).where(eq(teachCircles.ownerUserId, identity.userId));
  const ownedCircleIds = ownedCircles.map((row) => row.id);

  await db.delete(learningReminders).where(eq(learningReminders.userId, identity.userId));
  await db.delete(learningAttempts).where(eq(learningAttempts.userId, identity.userId));
  await db.delete(teachCheckpoints).where(eq(teachCheckpoints.userId, identity.userId));
  await db.delete(strengthObservations).where(eq(strengthObservations.userId, identity.userId));
  await db.delete(algoquestLearningEvents).where(eq(algoquestLearningEvents.userId, identity.userId));
  await db.delete(teachAssistantExchanges).where(or(eq(teachAssistantExchanges.senderUserId, identity.userId), eq(teachAssistantExchanges.recipientUserId, identity.userId)));
  await db.delete(teachAssistantGraphRecords).where(eq(teachAssistantGraphRecords.userId, identity.userId));
  await db.delete(teachWeeklyObjectives).where(eq(teachWeeklyObjectives.userId, identity.userId));
  await db.delete(teachInterventionPreferences).where(eq(teachInterventionPreferences.userId, identity.userId));
  await db.delete(teachRecaps).where(eq(teachRecaps.userId, identity.userId));
  await db.delete(teachRecognitions).where(or(
    eq(teachRecognitions.issuerUserId, identity.userId),
    eq(teachRecognitions.recipientUserId, identity.userId),
    ...(ownedCircleIds.length ? [inArray(teachRecognitions.circleId, ownedCircleIds)] : []),
  ));
  if (ownedProjectIds.length) await db.delete(teachProjectEntries).where(inArray(teachProjectEntries.projectId, ownedProjectIds));
  await db.delete(teachProjectEntries).where(eq(teachProjectEntries.contributorUserId, identity.userId));
  await db.delete(teachProjectThreads).where(eq(teachProjectThreads.ownerUserId, identity.userId));
  if (ownedCircleIds.length) await db.delete(teachCircleMemberships).where(inArray(teachCircleMemberships.circleId, ownedCircleIds));
  await db.delete(teachCircleMemberships).where(eq(teachCircleMemberships.userId, identity.userId));
  await db.delete(teachCircles).where(eq(teachCircles.ownerUserId, identity.userId));
  await db.delete(growthStories).where(eq(growthStories.userId, identity.userId));
  await db.delete(teachMediaPublicationConfirmations).where(eq(teachMediaPublicationConfirmations.userId, identity.userId));
  await db.delete(teachMediaRequests).where(eq(teachMediaRequests.userId, identity.userId));
  await db.delete(teachGate5Jobs).where(eq(teachGate5Jobs.userId, identity.userId));
  await db.delete(teachPurposeConsents).where(eq(teachPurposeConsents.userId, identity.userId));
  await db.delete(teachEnrollments).where(eq(teachEnrollments.userId, identity.userId));
  if (objectiveIds.length) {
    await db.delete(learningHints).where(inArray(learningHints.objectiveId, objectiveIds));
    await db.delete(learningQuestions).where(inArray(learningQuestions.objectiveId, objectiveIds));
  }
  if (lessonIds.length) await db.delete(learningObjectives).where(inArray(learningObjectives.lessonId, lessonIds));
  if (courseIds.length) {
    await db.delete(teachEnrollments).where(inArray(teachEnrollments.courseId, courseIds));
    await db.delete(teachLessons).where(inArray(teachLessons.courseId, courseIds));
    await db.delete(teachModules).where(inArray(teachModules.courseId, courseIds));
    await db.delete(teachCourses).where(inArray(teachCourses.id, courseIds));
  }
  return Response.json({
    deleted: true,
    boundary: "Scholarium identity and non-Teach publications were retained.",
    retainedSecurityRecords: "Exceptional-access requests, decisions, and digest-only audit events follow the documented security and legal retention schedule.",
  });
}

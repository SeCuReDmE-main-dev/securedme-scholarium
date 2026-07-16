import type { Metadata } from "next";
import { TeachClient } from "./teach-client";
import "./teach.css";
import "./teach-evidence.css";

export const metadata: Metadata = {
  title: "Scholarium Teach",
  description: "Adaptive, multimodal learning built from evidence of mastery and learner-controlled strengths.",
};

export default function TeachPage() {
  return <TeachClient />;
}

import type { Metadata } from "next";
import { TeachClient } from "./teach-client";
import "./teach-evidence.css";
import "./teach.css";

export const metadata: Metadata = {
  title: "Scholarium Teach",
  description: "Adaptive, multimodal learning built from evidence of mastery and learner-controlled strengths.",
  alternates: {
    canonical: "/teach",
    languages: { "fr-CA": "/teach?lang=fr-CA", "en-CA": "/teach?lang=en-CA", es: "/teach?lang=es", "x-default": "/teach" },
  },
};

export default function TeachPage() {
  return <TeachClient />;
}

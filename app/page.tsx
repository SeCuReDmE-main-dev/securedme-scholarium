import type { Metadata } from "next";
import { ScholariumClient } from "./scholarium-client";

export const metadata: Metadata = {
  title: "Scholarium — Open knowledge, real momentum",
  description:
    "A free scientific and educational social platform for publications, projects, video, and community support.",
};

export default function Home() {
  return <ScholariumClient />;
}

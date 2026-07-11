import { PublicProfileClient } from "./public-profile-client";

export default async function PublicProfilePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  return <PublicProfileClient publicId={publicId} />;
}

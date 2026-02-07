import type { ProfileDraft } from "../features/profile/profileTypes";

export type ServerProfile = {
  displayName: string;
  email?: string;
  location: string;
  intendedMajorId: string;
  avatar: { provider: "dicebear"; style: string; seed: string };
  updatedAt: string;
};

export async function getProfile(): Promise<ServerProfile | null> {
  const res = await fetch("/api/profile", { method: "GET" });
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`GET /api/profile failed (${res.status})`);
  }

  const data = (await res.json()) as { profile?: ServerProfile | null };
  return data?.profile ?? null;
}

export async function putProfile(profileDraft: ProfileDraft): Promise<ServerProfile> {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: profileDraft.displayName,
      email: profileDraft.email,
      location: profileDraft.location,
      intendedMajorId: profileDraft.intendedMajorId,
      avatar: profileDraft.avatar,
    }),
  });

  if (res.status === 401) {
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    let msg = `PUT /api/profile failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = String(data.error);
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as { profile: ServerProfile };
  return data.profile;
}


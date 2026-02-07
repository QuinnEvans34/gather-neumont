import { getUserIdFromRequest } from "./auth";
import { getUserById } from "../data/users.store";
import { profileStore, type ProfileRecord } from "../data/profiles.store";
import { MAJORS, type MajorId } from "../../config/majors";

const ALLOWED_MAJOR_IDS = new Set<MajorId>(MAJORS.map((m) => m.id));

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

async function getUsernameFromRequest(req: Request): Promise<string | null> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return null;
  const user = await getUserById(userId);
  return user?.username ?? null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function validateProfilePayload(payload: any): { ok: true; value: Omit<ProfileRecord, "updatedAt"> } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid JSON body" };
  }

  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  if (!displayName) return { ok: false, error: "displayName required" };

  const location = typeof payload.location === "string" ? payload.location.trim() : "";
  if (!location) return { ok: false, error: "location required" };

  const emailRaw = payload.email;
  const email = typeof emailRaw === "string" && emailRaw.trim().length > 0 ? emailRaw.trim() : undefined;

  const intendedMajorId = payload.intendedMajorId as unknown;
  if (!isNonEmptyString(intendedMajorId)) return { ok: false, error: "intendedMajorId required" };
  if (!ALLOWED_MAJOR_IDS.has(intendedMajorId as MajorId)) {
    return { ok: false, error: "intendedMajorId invalid" };
  }

  const avatar = payload.avatar as unknown;
  if (!avatar || typeof avatar !== "object") return { ok: false, error: "avatar required" };

  const provider = (avatar as any).provider;
  if (provider !== "dicebear") return { ok: false, error: "avatar.provider must be 'dicebear'" };

  const style = (avatar as any).style;
  if (!isNonEmptyString(style)) return { ok: false, error: "avatar.style required" };

  const seed = (avatar as any).seed;
  if (!isNonEmptyString(seed)) return { ok: false, error: "avatar.seed required" };

  return {
    ok: true,
    value: {
      displayName,
      email,
      location,
      intendedMajorId: intendedMajorId as MajorId,
      avatar: { provider: "dicebear", style, seed },
    },
  };
}

export async function handleProfileApi(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (path !== "/api/profile") {
    return Response.json({ error: "Not found", path }, { status: 404 });
  }

  const username = await getUsernameFromRequest(req);
  if (!username) return unauthorized();

  if (method === "GET") {
    const profile = await profileStore.getByUsername(username);
    return Response.json({ profile });
  }

  if (method === "PUT") {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validated = validateProfilePayload(payload as any);
    if (!validated.ok) {
      return Response.json({ error: validated.error }, { status: 400 });
    }

    const now = new Date().toISOString();
    const saved = await profileStore.upsertByUsername(username, { ...validated.value, updatedAt: now });
    if (!saved) {
      return Response.json({ error: "Failed to save profile" }, { status: 500 });
    }

    return Response.json({ profile: saved });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}


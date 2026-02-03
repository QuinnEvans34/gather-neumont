import type { MajorId } from "../../config/majors";

export type ProfileDraft = {
  displayName: string;
  email?: string;
  location: string;
  avatar: { spriteId: string };
  intendedMajorId: MajorId;
};


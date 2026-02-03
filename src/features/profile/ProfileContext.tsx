import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ProfileDraft } from "./profileTypes";
import type { OnboardingProgress, OnboardingStep } from "./onboardingState";
import { isOnboardingComplete } from "./onboardingState";
import { profileStorage, shouldResetOnboardingOnLoad } from "./profileStorage";
import type { MajorId } from "../../config/majors";

const DEFAULT_SPRITES = ["sprite_1", "sprite_2", "sprite_3"] as const;

function pickRandomSpriteId(): string {
  const idx = Math.floor(Math.random() * DEFAULT_SPRITES.length);
  return DEFAULT_SPRITES[idx] ?? DEFAULT_SPRITES[0];
}

function normalizeDraft(input: Partial<ProfileDraft> | undefined): ProfileDraft {
  const intendedMajorId = (input?.intendedMajorId ?? "UNDECIDED") as MajorId;

  return {
    displayName: input?.displayName ?? "",
    email: input?.email,
    location: input?.location ?? "",
    avatar: {
      spriteId: input?.avatar?.spriteId ?? pickRandomSpriteId(),
    },
    intendedMajorId,
  };
}

function normalizeProgress(
  input: Partial<OnboardingProgress> | undefined,
): OnboardingProgress {
  return { step: input?.step ?? "profile" };
}

export type ProfileContextValue = {
  profileDraft: ProfileDraft;
  setProfileDraft: (partial: Partial<ProfileDraft>) => void;
  resetProfile: () => void;

  onboardingProgress: OnboardingProgress;
  setStep: (step: OnboardingStep) => void;
  isComplete: () => boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider(props: { children: React.ReactNode }) {
  const initialStoredRef = useRef<ReturnType<typeof profileStorage.load> | null>(null);
  if (!initialStoredRef.current) {
    let stored = profileStorage.load();
    const pathname =
      typeof window !== "undefined" && typeof window.location?.pathname === "string"
        ? window.location.pathname
        : "/";

    if (shouldResetOnboardingOnLoad(pathname, stored.onboardingProgress)) {
      profileStorage.clear();
      stored = profileStorage.load();
    }

    initialStoredRef.current = stored;
  }
  const stored = initialStoredRef.current;

  const [profileDraft, setProfileDraftState] = useState<ProfileDraft>(() => {
    const next = normalizeDraft(stored.profileDraft);
    profileStorage.saveProfileDraft(next);
    return next;
  });
  const [onboardingProgress, setOnboardingProgressState] =
    useState<OnboardingProgress>(() => {
      const next = normalizeProgress(stored.onboardingProgress);
      profileStorage.saveOnboardingProgress(next);
      return next;
    });

  const value = useMemo<ProfileContextValue>(() => {
    return {
      profileDraft,
      setProfileDraft(partial) {
        setProfileDraftState((prev) => {
          const next: ProfileDraft = {
            ...prev,
            ...partial,
            avatar: partial.avatar ? { ...prev.avatar, ...partial.avatar } : prev.avatar,
          };
          // Ensure a usable avatar at all times.
          if (!next.avatar?.spriteId) {
            next.avatar = { spriteId: pickRandomSpriteId() };
          }
          profileStorage.saveProfileDraft(next);
          return next;
        });
      },
      resetProfile() {
        profileStorage.clear();
        const fresh = normalizeDraft(undefined);
        const progress = normalizeProgress(undefined);
        setProfileDraftState(fresh);
        setOnboardingProgressState(progress);
        profileStorage.saveProfileDraft(fresh);
        profileStorage.saveOnboardingProgress(progress);
      },

      onboardingProgress,
      setStep(step) {
        setOnboardingProgressState(() => {
          const next: OnboardingProgress = { step };
          profileStorage.saveOnboardingProgress(next);
          return next;
        });
      },
      isComplete() {
        return isOnboardingComplete(onboardingProgress);
      },
    };
  }, [onboardingProgress, profileDraft]);

  return <ProfileContext.Provider value={value}>{props.children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}

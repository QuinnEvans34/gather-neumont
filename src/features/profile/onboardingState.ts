export type OnboardingStep = "profile" | "avatar" | "major" | "done";

export type OnboardingProgress = {
  step: OnboardingStep;
};

export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  return progress.step === "done";
}

export function isProfileInfoValid(draft: { displayName: string; location: string }): boolean {
  return draft.displayName.trim().length > 0 && draft.location.trim().length > 0;
}

export function isAvatarValid(draft: { avatar: { provider: string; style?: string; seed?: string } }): boolean {
  return (
    draft.avatar.provider === "dicebear" &&
    typeof draft.avatar.seed === "string" &&
    draft.avatar.seed.trim().length > 0
  );
}

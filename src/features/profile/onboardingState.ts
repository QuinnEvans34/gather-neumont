export type OnboardingStep = "profile" | "avatar" | "major" | "done";

export type OnboardingProgress = {
  step: OnboardingStep;
};

export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  return progress.step === "done";
}


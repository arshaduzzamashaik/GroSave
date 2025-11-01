// src/components/OnboardingFlow.tsx
import { useEffect, useMemo, useState } from "react";
import { SplashScreen } from "./SplashScreen";
import { WelcomeCarousel } from "./WelcomeCarousel";
import { VerificationScreen } from "./VerificationScreen";
import { SuccessScreen } from "./SuccessScreen";
import { getToken } from "../lib/api";

type OnboardingStep = "splash" | "carousel" | "verification" | "success";

interface OnboardingFlowProps {
  /** Called once onboarding is done (or when user is already authenticated). */
  onComplete: () => void;

  /**
   * Optional: force-start the flow at a specific step.
   * Use "verification" to open directly on the OTP screen.
   */
  startAt?: OnboardingStep;

  /**
   * Optional: if true, restricts the flow to just verification → success.
   * Useful when you want to skip splash/carousel completely.
   */
  onlyVerification?: boolean;
}

export function OnboardingFlow({
  onComplete,
  startAt,
  onlyVerification,
}: OnboardingFlowProps) {
  // Decide initial step
  const initialStep: OnboardingStep = useMemo(() => {
    if (onlyVerification) return "verification";
    if (startAt) return startAt;
    return "splash";
  }, [onlyVerification, startAt]);

  const [step, setStep] = useState<OnboardingStep>(initialStep);

  // Keep step in sync if props change at runtime
  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  // If already authenticated, skip onboarding entirely
  useEffect(() => {
    const token = getToken();
    if (token) {
      onComplete();
    }
  }, [onComplete]);

  // Step handlers
  const goSplashToCarousel = () => setStep("carousel");
  const goCarouselToVerification = () => setStep("verification");
  const handleVerificationDone = () => setStep("success");
  const handleSuccessDone = () => onComplete();

  return (
    <>
      {!onlyVerification && step === "splash" && (
        <SplashScreen onContinue={goSplashToCarousel} />
      )}

      {!onlyVerification && step === "carousel" && (
        <WelcomeCarousel onGetStarted={goCarouselToVerification} />
      )}

      {step === "verification" && (
        <VerificationScreen onComplete={handleVerificationDone} />
      )}

      {step === "success" && (
        <SuccessScreen onStartShopping={handleSuccessDone} />
      )}
    </>
  );
}

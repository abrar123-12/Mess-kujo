"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import Turnstile, { TurnstileHandle } from "./Turnstile";
import HCaptcha, { HCaptchaHandle } from "./HCaptcha";

export interface CaptchaHandle {
  /** Reset the active widget and clear the issued token */
  reset: () => void;
}

interface CaptchaProps {
  onVerify: (token: string | null) => void;
}

/**
 * Unified CAPTCHA widget — picks the provider from env vars so the
 * owner can switch without code changes:
 *   1. NEXT_PUBLIC_TURNSTILE_SITE_KEY set  → Cloudflare Turnstile
 *   2. NEXT_PUBLIC_HCAPTCHA_SITE_KEY set    → hCaptcha
 *   3. neither set                          → renders nothing (captcha off)
 */
const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(
  function Captcha({ onVerify }, ref) {
    const turnstileRef = useRef<TurnstileHandle>(null);
    const hcaptchaRef = useRef<HCaptchaHandle>(null);

    useImperativeHandle(ref, () => ({
      reset() {
        // Only one child is ever mounted; safe to try both
        turnstileRef.current?.reset();
        hcaptchaRef.current?.reset();
      },
    }));

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      return <Turnstile ref={turnstileRef} onVerify={onVerify} />;
    }
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) {
      return <HCaptcha ref={hcaptchaRef} onVerify={onVerify} />;
    }
    return null;
  }
);

export default Captcha;

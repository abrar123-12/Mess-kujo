"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface HCaptchaHandle {
  /** Reset the widget and clear the issued token */
  reset: () => void;
}

interface HCaptchaProps {
  onVerify: (token: string | null) => void;
}

const SCRIPT_URL = "https://js.hcaptcha.com/1/api.js";

// Shared promise so the script loads only once across mounts
let scriptPromise: Promise<void> | null = null;

function loadHCaptchaScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.hcaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_URL}"]`
    );
    if (existing) {
      // Script tag exists but API not ready yet — poll briefly
      let tries = 0;
      const iv = setInterval(() => {
        tries += 1;
        if (window.hcaptcha) {
          clearInterval(iv);
          resolve();
        } else if (tries > 100) {
          clearInterval(iv);
          reject(new Error("hcaptcha init timeout"));
        }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("hcaptcha script load failed"));
    };
    document.head.appendChild(s);
  });

  return scriptPromise;
}

/**
 * hCaptcha widget.
 * Renders nothing if NEXT_PUBLIC_HCAPTCHA_SITE_KEY is not set,
 * so the site keeps working before keys are configured.
 */
const HCaptcha = forwardRef<HCaptchaHandle, HCaptchaProps>(
  function HCaptcha({ onVerify }, ref) {
    const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const onVerifyRef = useRef(onVerify);
    onVerifyRef.current = onVerify;

    useImperativeHandle(ref, () => ({
      reset() {
        if (window.hcaptcha && widgetIdRef.current !== null) {
          try {
            window.hcaptcha.reset(widgetIdRef.current);
          } catch {
            /* ignore */
          }
        }
        onVerifyRef.current(null);
      },
    }));

    useEffect(() => {
      if (!sitekey) return;
      let cancelled = false;

      loadHCaptchaScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.hcaptcha) return;
          containerRef.current.innerHTML = "";
          try {
            widgetIdRef.current = window.hcaptcha.render(
              containerRef.current,
              {
                sitekey,
                theme: "light",
                size: "normal",
                callback: (token: string) => onVerifyRef.current(token),
                "expired-callback": () => onVerifyRef.current(null),
                "error-callback": () => onVerifyRef.current(null),
              }
            );
          } catch {
            /* render failed — widget stays empty, site still works */
          }
        })
        .catch(() => {
          /* script failed — site keeps working without captcha */
        });

      return () => {
        cancelled = true;
        if (window.hcaptcha && widgetIdRef.current !== null) {
          try {
            window.hcaptcha.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null;
        }
      };
    }, [sitekey]);

    if (!sitekey) return null;

    return (
      <div className="flex justify-center">
        <div ref={containerRef} />
      </div>
    );
  }
);

export default HCaptcha;

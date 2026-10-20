interface HCaptchaRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact" | "invisible";
}

interface HCaptchaApi {
  render: (
    container: string | HTMLElement,
    options: HCaptchaRenderOptions
  ) => number;
  reset: (widgetId?: number) => void;
  remove: (widgetId?: number) => void;
}

interface Window {
  hcaptcha?: HCaptchaApi;
}

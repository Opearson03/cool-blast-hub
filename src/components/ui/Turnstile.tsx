import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

// Cloudflare Turnstile sitekeys:
// Production: 0x4AAAAAABgGTNV6NkSzLc0W (configured for pourhub.com.au)
// Test/Visible: 1x00000000000000000000AA (always passes, visible widget)
// For preview domains, use the test key; switch to production for published domain
const isPreviewDomain = typeof window !== 'undefined' && 
  (window.location.hostname.includes('lovable.app') || 
   window.location.hostname.includes('lovableproject.com') ||
   window.location.hostname.includes('localhost'));
   
const TURNSTILE_SITE_KEY = isPreviewDomain 
  ? "1x00000000000000000000AA"  // Test key - always passes
  : "0x4AAAAAABgGTNV6NkSzLc0W"; // Production key

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function ensureTurnstileScriptLoaded(): HTMLScriptElement | null {
  if (typeof document === "undefined") return null;

  const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) return existing;

  const script = document.createElement("script");
  script.id = TURNSTILE_SCRIPT_ID;
  script.src = TURNSTILE_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  return script;
}

export function Turnstile({
  onVerify,
  onExpire,
  onError,
  theme = "dark",
  size = "normal",
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    // Prevent double-rendering in StrictMode
    if (renderedRef.current) return;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || renderedRef.current) return;
      
      // Clear container first
      containerRef.current.innerHTML = '';
      
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: onVerify,
          "expired-callback": onExpire,
          "error-callback": onError,
          theme,
          size,
        });
        renderedRef.current = true;
      } catch (e) {
        console.error("[Turnstile] Render error:", e);
      }
    };

    // Ensure the Turnstile script is present (public sites may not have it injected elsewhere)
    const scriptEl = ensureTurnstileScriptLoaded();

    // Check if Turnstile script is already loaded
    if (window.turnstile) {
      // Small delay to ensure DOM is ready
      timeoutId = setTimeout(renderWidget, 100);
    } else {
      // Try to render immediately after script load
      const onLoad = () => renderWidget();
      const onScriptError = () => {
        console.error("[Turnstile] Failed to load Turnstile script");
        onError?.();
      };

      scriptEl?.addEventListener("load", onLoad, { once: true });
      scriptEl?.addEventListener("error", onScriptError, { once: true });

      // Wait for script to load
      intervalId = setInterval(() => {
        if (window.turnstile) {
          clearInterval(intervalId);
          renderWidget();
        }
      }, 100);
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Widget may already be removed
        }
        widgetIdRef.current = null;
      }
      renderedRef.current = false;
    };
  }, []); // Empty deps - render once on mount

  return <div ref={containerRef} className={className} />;
}

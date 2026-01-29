import { useEffect, useRef, useCallback } from "react";

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
   window.location.hostname.includes('localhost'));
   
const TURNSTILE_SITE_KEY = isPreviewDomain 
  ? "1x00000000000000000000AA"  // Test key - always passes
  : "0x4AAAAAABgGTNV6NkSzLc0W"; // Production key

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

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;

    // Remove existing widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        // Widget may already be removed
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onVerify,
      "expired-callback": onExpire,
      "error-callback": onError,
      theme,
      size,
    });
  }, [onVerify, onExpire, onError, theme, size]);

  useEffect(() => {
    // Check if Turnstile script is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderWidget();
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    return () => {
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Widget may already be removed
        }
      }
    };
  }, [renderWidget]);

  return <div ref={containerRef} className={className} />;
}

import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "lp_session_id";
const VARIANT_KEY = "lp_variant";

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function captureUtmFromUrl() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
  };
}

function fireGtag(eventName: string, payload: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, payload);
  }
}

export type LandingVariant = "a" | "b" | "c";

export function useLandingTracker(variant: LandingVariant) {
  const recordedView = useRef(false);

  const recordEvent = useCallback(
    async (eventType: string, metadata?: Record<string, unknown>) => {
      const session_id = getOrCreateSessionId();
      const utm = captureUtmFromUrl();
      const payload = {
        variant,
        event_type: eventType,
        session_id,
        ...utm,
        referrer: typeof document !== "undefined" ? document.referrer : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        path: typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
        metadata: metadata ?? null,
      };

      // Fire GA4 event (best-effort)
      fireGtag(`landing_${eventType}`, {
        variant,
        ...utm,
        ...(metadata ?? {}),
      });

      // Fire DB event (best-effort, non-blocking)
      try {
        await supabase.from("landing_page_events").insert([payload]);
      } catch (err) {
        console.warn("[lp-tracker] insert failed", err);
      }
    },
    [variant]
  );

  // Persist variant + record view on mount
  useEffect(() => {
    try {
      localStorage.setItem(VARIANT_KEY, variant);
    } catch {
      /* ignore */
    }
    if (recordedView.current) return;
    recordedView.current = true;
    void recordEvent("view");
  }, [variant, recordEvent]);

  const trackCTA = useCallback(
    (cta: string) => recordEvent("cta_click", { cta }),
    [recordEvent]
  );

  return { trackCTA, recordEvent };
}

export function getStoredLandingVariant(): LandingVariant | null {
  try {
    const v = localStorage.getItem(VARIANT_KEY);
    if (v === "a" || v === "b" || v === "c") return v;
    return null;
  } catch {
    return null;
  }
}

export function clearStoredLandingVariant() {
  try {
    localStorage.removeItem(VARIANT_KEY);
  } catch {
    /* ignore */
  }
}

/** Fire a conversion event from outside a landing page (e.g. signup success). */
export async function recordLandingConversion(metadata?: Record<string, unknown>) {
  const variant = getStoredLandingVariant();
  if (!variant) return;
  const session_id = (() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  })();

  fireGtag("landing_signup_completed", { variant, ...(metadata ?? {}) });

  try {
    await supabase.from("landing_page_events").insert({
      variant,
      event_type: "signup_completed",
      session_id,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.warn("[lp-tracker] conversion insert failed", err);
  }
}

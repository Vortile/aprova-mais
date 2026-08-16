"use client";

import { useEffect } from "react";
import { trackEventoAction } from "@/lib/actions/inscricao";
import { getEventoSessionId } from "@/lib/evento/session";
import { captureAndGetUtmParams } from "@/lib/evento/utm";

/** Fires a single `page_view` analytics event on mount. Rendered once at
 * the top of the landing page (and the registration page). */
export function TrackPageView() {
  useEffect(() => {
    const sessionId = getEventoSessionId();
    const utm = captureAndGetUtmParams();

    trackEventoAction({
      sessionId,
      tipoEvento: "page_view",
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      referrer: document.referrer || undefined,
    }).catch(() => {
      // Analytics must never break the page.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

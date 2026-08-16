"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEventoAction } from "@/lib/actions/inscricao";
import { getEventoSessionId } from "@/lib/evento/session";
import { captureAndGetUtmParams } from "@/lib/evento/utm";

/** A Next.js Link that also fires a `cta_click` analytics event. Client-side
 * navigation means the tracking call is never cancelled by a page unload. */
export function CtaLink({
  children,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        const utm = captureAndGetUtmParams();
        trackEventoAction({
          sessionId: getEventoSessionId(),
          tipoEvento: "cta_click",
          utmSource: utm.utmSource,
          utmMedium: utm.utmMedium,
          utmCampaign: utm.utmCampaign,
        }).catch(() => {});
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}

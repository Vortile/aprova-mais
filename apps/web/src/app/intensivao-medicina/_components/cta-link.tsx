"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentProps } from "react";
import { trackEventoAction } from "@/lib/actions/inscricao";
import { getEventoSessionId } from "@/lib/evento/session";
import { captureAndGetUtmParams } from "@/lib/evento/utm";

/** A Next.js Link that also fires a `cta_click` analytics event and has
 * fluid spring hover/tap animations via Framer Motion. */
export function CtaLink({
  children,
  onClick,
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="inline-block"
    >
      <Link
        {...props}
        className={className}
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
    </motion.div>
  );
}

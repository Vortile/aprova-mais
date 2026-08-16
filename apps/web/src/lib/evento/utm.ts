"use client";

const UTM_KEY = "aprovamais_evento_utm";

export type UtmParams = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

const EMPTY_UTM: UtmParams = { utmSource: "", utmMedium: "", utmCampaign: "" };

/** Captures UTM params from the current URL on first visit and persists
 * them for the whole session, so the registration + payment steps (which
 * happen on a different page) still get correct attribution. */
export function captureAndGetUtmParams(): UtmParams {
  if (typeof window === "undefined") {
    return EMPTY_UTM;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const fromUrl: UtmParams = {
    utmSource: searchParams.get("utm_source") ?? "",
    utmMedium: searchParams.get("utm_medium") ?? "",
    utmCampaign: searchParams.get("utm_campaign") ?? "",
  };

  if (fromUrl.utmSource || fromUrl.utmMedium || fromUrl.utmCampaign) {
    window.sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }

  const stored = window.sessionStorage.getItem(UTM_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as UtmParams;
    } catch {
      return EMPTY_UTM;
    }
  }

  return EMPTY_UTM;
}

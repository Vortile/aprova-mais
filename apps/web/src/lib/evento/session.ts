"use client";

const SESSION_KEY = "aprovamais_evento_session_id";

/** Stable per-tab session id used to group analytics events for the funnel. */
export function getEventoSessionId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

// ─────────────────────────────────────────────────────────────────
// TEACHER IDENTITY — single source of truth for the whole site
//
// This is the ONLY file you need to edit when contact details change.
// ─────────────────────────────────────────────────────────────────

export const teacher = {
  /** First name — used in casual, conversational contexts */
  firstName: "Júnior",

  /** Full legal name — used in privacy policy and terms of service. */
  fullName: "Deuticilam Gomes Maia Júnior",

  /** WhatsApp number in international format (no +, no spaces) */
  whatsappNumber: "5592981581955",

  /** Instagram handle — without the @ */
  instagramHandle: "aprovamais_educ",

  /** Zcal scheduling link for the free trial class */
  zcalUrl: "https://zcal.co/i/LmyBoSY4",

  /** Portal URL for accessing the course platform */
  portalUrl: "https://app.aprovamaiscurso-pro.com.br/entrar",
} as const;

// ── Derived helpers (no need to edit these) ──────────────────────

/** Full WhatsApp deep-link URL */
export const whatsappUrl = `https://wa.me/${teacher.whatsappNumber}`;

/** Full Instagram profile URL */
export const instagramUrl = `https://instagram.com/${teacher.instagramHandle}`;

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAppEnv } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Plataforma Aprova+",
};

export default function RegistrarPage() {
  if (!hasAppEnv()) {
    redirect(ROUTES.SETUP);
  }

  redirect(ROUTES.SIGN_IN);
}

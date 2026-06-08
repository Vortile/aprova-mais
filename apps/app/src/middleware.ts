import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/lib/routes";

type MiddlewareAuth = () => Promise<{ userId: string | null }>;
type AppRole = "admin" | "professor" | "aluno";

async function getProfileRole(clerkUserId: string): Promise<AppRole> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return "aluno";

  try {
    const res = await fetch(
      `${url}/rest/v1/profiles?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}&select=role&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) return "aluno";

    const data = (await res.json()) as Array<{ role?: string }>;
    const role = data?.[0]?.role;
    if (role === "admin" || role === "professor" || role === "aluno") {
      return role;
    }
  } catch {
    // fall back to default
  }

  return "aluno";
}

async function handleAppMiddleware(auth: MiddlewareAuth, request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname === ROUTES.DASHBOARD;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAlunoRoute = pathname.startsWith("/aluno");
  const isProtectedRoute = isAdminRoute || isAlunoRoute || isDashboardRoute;

  // Forward legacy sign-up path to the new cadastro route, preserving query parameters
  if (pathname.startsWith("/sign-up")) {
    const newUrl = new URL(ROUTES.SIGN_UP, request.url);
    newUrl.search = request.nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  // All alternative / legacy paths redirect to the canonical sign-in
  if (
    pathname === ROUTES.LOGIN ||
    pathname.startsWith(ROUTES.REGISTER) ||
    pathname.startsWith("/sign-in")
  ) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
  }

  const authState = await auth();

  if (!authState.userId && isProtectedRoute) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
  }

  if (authState.userId && isDashboardRoute) {
    const role = await getProfileRole(authState.userId);
    const destination =
      role === "aluno" ? ROUTES.ALUNO.HOME : ROUTES.ADMIN.ALUNOS;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next({ request });
}

export default clerkMiddleware(async (auth, request) => {
  return handleAppMiddleware(auth, request);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

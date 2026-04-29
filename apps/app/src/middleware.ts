import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { hasAppEnv } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";

type MiddlewareAuth = () => Promise<{ userId: string | null }>;

async function handleAppMiddleware(auth: MiddlewareAuth, request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSetupRoute = pathname === ROUTES.SETUP;
  const isLoginRoute = pathname === ROUTES.LOGIN;
  const isSignInRoute = pathname.startsWith(ROUTES.SIGN_IN);
  const isSignUpRoute = pathname.startsWith(ROUTES.SIGN_UP);
  const isDashboardRoute = pathname === ROUTES.DASHBOARD;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAlunoRoute = pathname.startsWith("/aluno");
  const isProtectedRoute = isAdminRoute || isAlunoRoute || isDashboardRoute;

  if (!hasAppEnv()) {
    if (!isSetupRoute) {
      return NextResponse.redirect(new URL(ROUTES.SETUP, request.url));
    }

    return NextResponse.next({ request });
  }

  if (isSetupRoute) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  const authState = await auth();

  if (!authState.userId && isProtectedRoute) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
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

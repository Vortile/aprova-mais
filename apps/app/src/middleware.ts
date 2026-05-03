import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/lib/routes";

type MiddlewareAuth = () => Promise<{ userId: string | null }>;

async function handleAppMiddleware(auth: MiddlewareAuth, request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname === ROUTES.DASHBOARD;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAlunoRoute = pathname.startsWith("/aluno");
  const isProtectedRoute = isAdminRoute || isAlunoRoute || isDashboardRoute;

  // All alternative / legacy paths redirect to the canonical sign-in
  if (
    pathname === ROUTES.LOGIN ||
    pathname.startsWith(ROUTES.REGISTER) ||
    pathname.startsWith(ROUTES.SIGN_UP) ||
    pathname.startsWith("/sign-in")
  ) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
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

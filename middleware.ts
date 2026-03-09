import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from "@/src/lib/constants";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();

  // Clerk stores the primary email under different possible paths.
  // Check multiple fallbacks to cover different Clerk JWT configurations:
  const userEmail = (
    (sessionClaims?.email as string) ||
    (sessionClaims?.primary_email_address as string) ||
    ((sessionClaims as Record<string, unknown>)?.emailAddress as string)
  )?.toLowerCase()?.trim();

  console.log("Session claims keys:", sessionClaims ? Object.keys(sessionClaims) : "none");
  console.log("Resolved user email:", userEmail);
  console.log("Admin emails list:", ADMIN_EMAILS);

  if (isAdminRoute(req)) {
    if (!userEmail || !ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail)) {
      console.log("Redirecting to /users — email not in admin list:", userEmail);
      return NextResponse.redirect(new URL('/users', req.url));
    }
    console.log("Admin access granted for:", userEmail);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
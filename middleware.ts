import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ADMIN_USER_IDS } from "@/src/lib/constants";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isAdminRoute(req)) {
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.redirect(new URL('/users', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
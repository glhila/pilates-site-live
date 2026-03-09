import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from "@/src/lib/constants";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();

  // שליפת ה-token מה-Supabase template שמכיל את המייל
  const token = await authObject.getToken({ template: 'supabase' });

  // פענוח ה-JWT payload (החלק האמצעי)
  let userEmail: string | undefined;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userEmail = (payload?.email as string)?.toLowerCase()?.trim();
    } catch {
      userEmail = undefined;
    }
  }

  if (isAdminRoute(req)) {
    if (!userEmail || !ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail)) {
      return NextResponse.redirect(new URL('/users', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
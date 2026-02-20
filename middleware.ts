import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from "@/src/lib/constants";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();
  
  
  // שליפת המייל מה-session (מבוסס על הגדרות Clerk)
  const userEmail = (sessionClaims?.email as string)?.toLowerCase();

  if (isAdminRoute(req)) {
    // אם המייל לא תואם או שאין מייל בכלל - שלח ל-users
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      console.log("Redirecting to users. User email found:", userEmail);
      return NextResponse.redirect(new URL('/users', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
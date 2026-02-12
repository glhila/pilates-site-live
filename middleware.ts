import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
  // לעדכן למייל של עונג
  const adminEmail = "hilaglazz13@gmail.com"; 
  const userEmail = sessionClaims?.email as string;

  // 1. ניתוב אוטומטי של אדמין מדף המשתמשים לדף הניהול
  if (userEmail === adminEmail && req.nextUrl.pathname === '/users') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // 2. הגנה על דפי האדמין
  if (isAdminRoute(req)) {
    if (!userId) return (await auth()).redirectToSignIn();
    
    if (userEmail !== adminEmail) {
      // משתמש רגיל מנסה להכנס לאדמין - שלח אותו לדף המשתמשים
      return NextResponse.redirect(new URL('/users', req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
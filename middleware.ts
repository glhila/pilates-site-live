import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// הגדרת הנתיבים המוגנים של הניהול
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const adminEmail = "hilaglazz13@gmail.com"; // המייל של האדמין- לשנות לשל עונג
  const userEmail = sessionClaims?.email as string;

  // 1. אם המשתמש הוא האדמין והוא נוחת בדף המשתמשים, נעביר אותו אוטומטית לניהול
  if (userEmail === adminEmail && req.nextUrl.pathname.startsWith('/users')) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // 2. הגנה על נתיבי אדמין - רק המייל שלך יכול להיכנס
  if (isAdminRoute(req)) {
    if (!userId) return (await auth()).redirectToSignIn();
    
    if (userEmail !== adminEmail) {
      // אם משתמש רגיל מנסה להיכנס לאדמין - נחזיר אותו לדף המשתמשים
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
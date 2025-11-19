import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(request) {
  const { pathname } = request.nextUrl;
//   console.log("Proxy URL: ", pathname);

  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected route patterns
  const protectedRoutePatterns = [
    "/profile",
    "/dashboard",
    "/employees",
    "/admin",
    "/attendance",
    "/leave",
    "/salary",
    "/holidays",
    "/shifts",
    "/performance",
    "/roster",
    "/personal-details",
    "/onboarding",
    "/overtime",
    "/attendance-policies",
    "/monthly-calendar",
    "/reports",
  ];

  const isProtectedRoute = protectedRoutePatterns.some(function(pattern) {
    return pathname.startsWith(pattern);
  });

  // Get token from cookie (works for cookie storage)
  // Check storage type - only enforce server-side protection for cookie mode
  const storageType = (
    process.env.NEXT_PUBLIC_TOKEN_STORAGE_TYPE || "localStorage"
  ).toLowerCase();
  
  const accessTokenCookie = request.cookies.get("accessToken");
  const token = accessTokenCookie ? accessTokenCookie.value : null;
  
  // Debug logging
//   console.log("Proxy - Path:", pathname);
//   console.log("Proxy - Storage type:", storageType);
//   console.log("Proxy - Has accessToken cookie:", !!accessTokenCookie);
//   console.log("Proxy - Token value exists:", !!token);
//   console.log("Proxy - JWT_SECRET exists:", !!process.env.JWT_SECRET);
//   if (token) {
//     console.log("Proxy - Token length:", token.length);
//     console.log("Proxy - Token preview:", token.substring(0, 20) + "...");
//   }
  
  // Get all cookies for debugging
  const allCookies = request.cookies.getAll();
//   console.log("Proxy - All cookies:", allCookies.map(function(c) { return c.name; }));
  
  // If not using cookie storage, skip server-side protection in proxy
  // (let layout.js handle it for localStorage/sessionStorage)
  if (storageType !== "cookie") {
    // console.log("Proxy - Skipping server-side protection (not cookie mode)");
    return NextResponse.next();
  }

  // Redirect authenticated users away from public routes
  if (isPublicRoute && token) {
    // Verify token is valid before redirecting
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    //   console.log("Proxy - Token verified, redirecting to dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      // Token invalid or expired, let them access login
    //   console.log("Proxy - Token verification failed:", error.message);
      // Clear invalid token cookie
      const response = NextResponse.next();
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  // Protect routes - only for cookie storage mode
  if (isProtectedRoute && !isPublicRoute) {
    if (!token) {
    //   console.log("Proxy - No token found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verify token is valid
    if (!process.env.JWT_SECRET) {
    //   console.error("Proxy - JWT_SECRET is not available in Edge Runtime!");
      // Still allow through if JWT_SECRET is missing (shouldn't happen, but fail gracefully)
      return NextResponse.next();
    }
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    //   console.log("Proxy - Token verified for protected route");
    } catch (error) {
      // Token invalid or expired
    //   console.log("Proxy - Token verification failed for protected route:", error.message);
    //   console.log("Proxy - Error details:", error.name, error.message);
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Clear invalid token cookies
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

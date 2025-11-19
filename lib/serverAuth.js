/**
 * Server-Side Authentication Utilities
 * Provides authentication and authorization checks for server components
 * Works with all storage types (cookie, localStorage, sessionStorage)
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { serverTokenStorage } from "@/lib/tokenStorage";

/**
 * Check if user is authenticated (server-side)
 * Works with all storage types (cookie, localStorage via token endpoint)
 * @returns {Promise<{authenticated: boolean, user?: object, token?: string}>}
 */
export async function checkServerAuth() {
  try {
    // Get token based on storage type
    const storageType = (
      process.env.NEXT_PUBLIC_TOKEN_STORAGE_TYPE || "localStorage"
    ).toLowerCase();

    let token = null;

    if (storageType === "cookie") {
      // Get from httpOnly cookie
      token = await serverTokenStorage.getAccessToken();
    } else {
      // For localStorage/sessionStorage, check if token exists in cookie
      // (tokens might be sent via cookie in some cases, or we check via API)
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get("accessToken");
      token = tokenCookie ? tokenCookie.value : null;
    }

    if (!token) {
      return { authenticated: false };
    }

    // Verify JWT token
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return { authenticated: true, user: payload, token: token };
    } catch (error) {
      // Token invalid or expired
      if (error.name === "TokenExpiredError") {
        return { authenticated: false, error: "Token expired" };
      }
      return { authenticated: false, error: "Invalid token" };
    }
  } catch (error) {
    console.error("Error checking server auth:", error);
    return { authenticated: false, error: error.message };
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * @returns {Promise<{user: object, token: string}>}
 */
export async function requireAuth() {
  const auth = await checkServerAuth();
  if (!auth.authenticated) {
    redirect("/login");
  }
  return { user: auth.user, token: auth.token };
}

/**
 * Check if user has required role
 * @param {string|string[]} requiredRoles - Role(s) required
 * @returns {Promise<{user: object, token: string}>}
 */
export async function requireRole(requiredRoles) {
  const auth = await requireAuth();
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const rolesLower = roles.map(function(r) {
    return r.toLowerCase();
  });
  
  const userRoles = (auth.user && auth.user.roles) ? auth.user.roles : [];
  let hasRole = false;
  
  for (let i = 0; i < userRoles.length; i++) {
    const role = userRoles[i];
    let roleCode = null;
    if (typeof role === "string") {
      roleCode = role.toLowerCase();
    } else if (role && typeof role === "object") {
      if (typeof role.role_code === "string") {
        roleCode = role.role_code.toLowerCase();
      } else if (typeof role.code === "string") {
        roleCode = role.code.toLowerCase();
      }
    }
    if (roleCode && rolesLower.includes(roleCode)) {
      hasRole = true;
      break;
    }
  }

  if (!hasRole) {
    redirect("/forbidden");
  }

  return auth;
}


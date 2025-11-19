// lib/auth.js
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function authorizeRequest(req, options = {}) {
  // Determine storage type from environment variable
  const storageType = (
    process.env.NEXT_PUBLIC_TOKEN_STORAGE_TYPE || "localStorage"
  ).toLowerCase();

  let token = null;

  // Get token based on storage type
  if (storageType === "cookie") {
    // Get token from httpOnly cookie (server-side only)
    try {
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get("accessToken");
      token = tokenCookie ? { value: tokenCookie.value } : null;
    } catch (error) {
      console.error("Error reading access token from cookies:", error);
      token = null;
    }
  } else {
    // Get token from Authorization header (localStorage/sessionStorage mode)
    const authHeader = req.headers.get("Authorization");
    const tokenValue = authHeader ? authHeader.replace("Bearer ", "") : null;
    token = tokenValue ? { value: tokenValue } : null;
  }

  // Custom header check (for AJAX-only)
  if (options.requireHeader) {
    const customHeader = req.headers.get(options.requireHeader);
    if (!customHeader) {
      return { authorized: false, error: "Direct access forbidden" };
    }
  }

  if (!token) return { authorized: false, error: "Authentication required" };
  let payload;
  try {
    payload = jwt.verify(token.value, process.env.JWT_SECRET);
  } catch {
    return { authorized: false, error: "Invalid token" };
  }

  // Custom role check
  if (options.requiredRole) {
    const requiredRoles = Array.isArray(options.requiredRole)
      ? options.requiredRole
      : [options.requiredRole];
    const requiredRolesLower = requiredRoles.map((r) => r.toLowerCase());
    let userHasRole = false;
    // console.log("payload: ", payload);
    if (Array.isArray(payload.roles)) {
      userHasRole = payload.roles.some((role) => {
        // Handle different role formats: string, object with code/role_code
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
        return roleCode && requiredRolesLower.includes(roleCode);
      });
    }

    if (!userHasRole) {
      return {
        authorized: false,
        error: "Role required: " + requiredRoles.join(" or "),
      };
    }
  }

  return { authorized: true, user: payload };
}

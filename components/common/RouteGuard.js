"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

/**
 * Utility function to check if user has required role(s)
 * @param {object} user - User object from auth context
 * @param {string|string[]} requiredRoles - Role(s) required (e.g., "HRMANAGER", ["HRMANAGER", "ADMIN"])
 * @returns {boolean} - True if user has at least one of the required roles
 */
export function hasRequiredRole(user, requiredRoles) {
  if (!user || !user.roles) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const rolesLower = roles.map((r) => r.toLowerCase());
  
  const userRoles = user.roles || [];
  
  return userRoles.some((role) => {
    let roleId = null;
    if (typeof role === "string") {
      roleId = role.toLowerCase();
    } else if (role && typeof role === "object") {
      roleId = (role.roleid || role.code || "").toLowerCase();
    }
    return roleId && rolesLower.includes(roleId);
  });
}

/**
 * RouteGuard - Client-side route protection component
 * Handles authentication and role-based access control
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string|string[]|null} props.requiredRoles - Required role(s). Use null for "ALL" (any authenticated user)
 * @param {string} props.redirectTo - Redirect path if access is denied (default: "/login")
 */
export default function RouteGuard({ 
  children, 
  requiredRoles = null, // null means any authenticated user
  redirectTo = "/login" 
}) {
  const router = useRouter();
  const { user, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      // Check authentication
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Check roles if required
      if (requiredRoles !== null) {
        // "ALL" means any authenticated user, so skip role check
        if (requiredRoles !== "ALL" && !hasRequiredRole(user, requiredRoles)) {
          router.push("/forbidden");
          return;
        }
      }
    }
  }, [user, authLoading, router, requiredRoles, redirectTo]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  // If no user, don't render content (redirect is in progress)
  if (!user) {
    return null;
  }

  // Check roles again for rendering (in case roles don't match)
  if (requiredRoles !== null && requiredRoles !== "ALL") {
    if (!hasRequiredRole(user, requiredRoles)) {
      return null; // Will redirect to forbidden
    }
  }

  return <>{children}</>;
}


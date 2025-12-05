"use client";

import RouteGuard from "@/components/common/RouteGuard";

/**
 * Admin Layout - Protects all /admin/* routes
 * Requires: ADMIN role only
 */
export default function AdminLayout({ children }) {
  return (
    <RouteGuard requiredRoles="ADMIN">
      {children}
    </RouteGuard>
  );
}


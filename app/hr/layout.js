"use client";

import RouteGuard from "@/components/common/RouteGuard";

/**
 * HR Layout - Protects all /hr/* routes
 * Requires: HRMANAGER or ADMIN role
 */
export default function HRLayout({ children }) {
  return (
    <RouteGuard requiredRoles={["HRMANAGER", "ADMIN"]}>
      {children}
    </RouteGuard>
  );
}


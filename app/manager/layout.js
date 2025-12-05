"use client";

import RouteGuard from "@/components/common/RouteGuard";

/**
 * Manager Layout - Protects all /manager/* routes
 * Requires: MANAGER, HRMANAGER, or ADMIN role
 */
export default function ManagerLayout({ children }) {
  return (
    <RouteGuard requiredRoles={["MANAGER", "HRMANAGER", "ADMIN"]}>
      {children}
    </RouteGuard>
  );
}


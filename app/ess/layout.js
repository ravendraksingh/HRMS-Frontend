"use client";

import RouteGuard from "@/components/common/RouteGuard";

/**
 * ESS Layout - Protects all /ess/* routes
 * Requires: Authentication (ALL roles - any authenticated user)
 */
export default function ESSLayout({ children }) {
  return (
    <RouteGuard requiredRoles="ALL">
      {children}
    </RouteGuard>
  );
}


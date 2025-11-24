/**
 * Managers Route Group Layout
 * Server-side protection for all manager routes
 * Requires authentication to access any route in this group
 * Manager check (has direct reports) is done client-side
 */

import { requireAuth } from "@/lib/serverAuth";

export default async function ManagersLayout({ children }) {
  // Server-side auth check - redirects to login if not authenticated
  await requireAuth();
  
  return <>{children}</>;
}


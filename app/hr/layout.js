/**
 * HR Route Group Layout
 * Server-side protection for all HR routes
 * Requires HR Manager or Admin role to access
 */

import { requireRole } from "@/lib/serverAuth";

export default async function HRLayout({ children }) {
  // Require HR Manager or Admin role
  await requireRole(["hrmanager", "admin"]);
  
  return <>{children}</>;
}


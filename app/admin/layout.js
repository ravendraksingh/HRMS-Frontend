/**
 * Admin Route Group Layout
 * Server-side protection for all admin routes
 * Requires Admin role to access
 */

import { requireRole } from "@/lib/serverAuth";

export default async function AdminLayout({ children }) {
  // Require Admin role - redirects to /forbidden if not admin
  await requireRole("admin");
  
  return <>{children}</>;
}

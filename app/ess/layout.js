/**
 * Employees Route Group Layout
 * Server-side protection for all employee routes
 * Requires authentication to access any route in this group
 */

import { requireAuth } from "@/lib/serverAuth";

export default async function EmployeesLayout({ children }) {
  // Server-side auth check - redirects to login if not authenticated
  await requireAuth();

  return <>{children}</>;
}

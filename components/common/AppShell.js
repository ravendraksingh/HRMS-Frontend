"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/AppSidebar";
import { useAuth } from "@/components/common/AuthContext";

/**
 * AppShell - Main application shell that conditionally renders sidebar/navbar
 * Only shows shell (sidebar + navbar) for authenticated users on protected routes
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const { user, authLoading } = useAuth();
  const isPublicRoute = ["/login"].includes(pathname);
  
  // Hide shell for public routes, while auth is loading, or if user is not authenticated
  const shouldShowShell = !isPublicRoute && !authLoading && user;

  if (!shouldShowShell) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main className="w-full">
        <Navbar />
        {children}
      </main>
    </SidebarProvider>
  );
}


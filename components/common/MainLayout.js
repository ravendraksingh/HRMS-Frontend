"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/AppSidebar";
import { useAuth } from "../auth/AuthContext";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const hideShell = ["/login", "/register"].includes(pathname);

  // Handle authentication redirect
  useEffect(() => {
    // Only redirect after auth check is complete
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  // Show loading state while checking authentication
  if (loading && pathname !== "/login") {
    return (
      <div className="flex items-center justify-center min-h-screen mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected layout if not authenticated
  if (!user && pathname !== "/login") {
    return null; // Will redirect via useEffect
  }

  return hideShell ? (
    <main className="w-full">{children}</main>
  ) : (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main className="w-full">
        <Navbar />
        {children}
      </main>
    </SidebarProvider>
  );
}

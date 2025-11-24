"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/AppSidebar";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const hideShell = ["/login", "/register"].includes(pathname);

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

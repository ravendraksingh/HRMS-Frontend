"use client";
import { LogOut, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { clientTokenStorage } from "@/lib/tokenStorage";
import { internalApiClient } from "@/app/services/internalApiClient";
import { useAuth } from "@/components/common/AuthContext";

const Navbar = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

  async function handleLogout() {
    try {
      await internalApiClient.post("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      await clientTokenStorage.clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className="p-4 flex items-center justify-between bg-background border-b md:hidden">
        {/* Left: User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span className="text-xl font-bold border-1 border-gray-400 rounded-full p-2">
              {getInitials(user?.name)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="hover:cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-[1.2rem] w-[1.2rem] mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right: Sidebar Toggle */}
        <Menu
          size={28}
          className="hover:cursor-pointer"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        />
      </nav>
      <Separator className="md:hidden" />
    </>
  );
};

export default Navbar;

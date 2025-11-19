"use client";
import { useState } from "react";
import { LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import NavLink from "@/components/common/NavLink";
import { useAuth } from "../auth/AuthContext";
import DynamicBreadcrumb from "./DynamicBreadcrumb";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  async function handleLogout() {
    // Use centralized logout from AuthContext
    await logout();
  }

  return (
    <>
      <nav className="p-4 flex items-center justify-between bg-background border-b">
        {/** LEFT */}
        <div className="flex flex-row items-center">
          <SidebarTrigger onClick={() => setMenuOpen(!menuOpen)} />
          <div className="ml-3 hidden md:block">
            <DynamicBreadcrumb />
          </div>
        </div>
        {/** RIGHT */}
        <div className="flex flex-row items-center gap-1">
          {/* Desktop menu - hidden on mobile */}
          <div className="hidden md:flex md:flex-row md:items-center md:gap-1">
            {/* <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/employees">Employees</NavLink>
            <NavLink href="/salary">Salaries</NavLink>
            <NavLink href="/performance">Performance</NavLink> */}
            {/* {user && user?.role === "admin" && (
              <NavLink href="/setting">Settings</NavLink>
            )} */}
          </div>
          {/* USER MENU - visible on all devices, positioned on right */}
          <div className="flex items-center gap-4 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full">
                <Avatar className="h-10 w-10 md:h-9 md:w-9 ring-2 ring-offset-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {user?.employee_name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                sideOffset={10}
                align="end"
                className="w-56"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/profile" className="flex items-center w-full">
                    <User className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/settings" className="flex items-center w-full">
                    <Settings className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Settings
                  </a>
                </DropdownMenuItem>
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
          </div>
        </div>
      </nav>
      <Separator />
    </>
  );
};

export default Navbar;

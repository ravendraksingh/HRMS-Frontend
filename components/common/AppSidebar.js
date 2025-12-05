"use client";
import { useState } from "react";
import {
  Home,
  Settings,
  User2,
  ChevronUp,
  BadgeIndianRupee,
  ClipboardClock,
  CalendarClock,
  UsersRound,
  LogIn,
  LogOut,
  UserRound,
  LayoutDashboard,
  ShieldUser,
  Building,
  Building2,
  Calendar,
  CalendarOff,
  CalendarDays,
  MapPin,
  UserCheck,
  Search,
  Briefcase,
  Handshake,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
} from "../ui/sidebar";
import { useSidebar } from "../ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { clientTokenStorage } from "@/lib/tokenStorage";
import { internalApiClient } from "@/app/services/internalApiClient";
import { useAuth } from "@/components/common/AuthContext";

const publicRoutes = [{ title: "Login", url: "/login", icon: LogIn }];

const employeeRoutes = [
  {
    title: "Dashboard",
    url: "/ess/employee-dashboard",
    icon: LayoutDashboard,
  },
  { title: "Attendance", url: "/ess/attendance", icon: CalendarClock },
  { title: "Leave", url: "/ess/leave", icon: CalendarOff },
  { title: "Holidays", url: "/ess/holidays", icon: Calendar },
  { title: "Job Profile", url: "/ess/job-profile", icon: Briefcase },
  { title: "Personal Details", url: "/ess/personal-details", icon: UserRound },
  { title: "Salaries", url: "/ess/salary", icon: BadgeIndianRupee },
  { title: "User Settings", url: "/ess/user-settings", icon: Settings },
];

const managerRoutes = [
  { title: "My Team", url: "/manager/my-team", icon: UsersRound },
];

const hrManagerRoutes = [
  { title: "HR Dashboard", url: "/hr/hr-dashboard", icon: LayoutDashboard },
  { title: "Search Employees", url: "/hr/search-employees", icon: Search },
  { title: "Add Employees", url: "/hr/add-employees", icon: UsersRound },
  { title: "Onboarding", url: "/hr/onboarding", icon: UserCheck },
  {
    title: "Monthly Calendar",
    url: "/hr/monthly-calendar",
    icon: CalendarDays,
  },
  { title: "Manage Holidays", url: "/hr/manage-holidays", icon: Calendar },
  { title: "Shifts", url: "/hr/shifts", icon: CalendarClock },
  { title: "Overtime", url: "/hr/overtime", icon: ClipboardClock },
  { title: "Leave Types", url: "/hr/leave-types", icon: CalendarOff },
  { title: "Policies", url: "/hr/attendance-policies", icon: Settings },
];

const adminRoutes = [
  {
    title: "Admin Dashboard",
    url: "/admin/admin-dashboard",
    icon: LayoutDashboard,
  },
  { title: "Organization", url: "/admin/organization", icon: Building2 },
  { title: "Locations", url: "/admin/locations", icon: MapPin },
  { title: "Departments", url: "/admin/departments", icon: Building },
  { title: "Roles", url: "/admin/roles", icon: ShieldUser },
  { title: "Users", url: "/admin/users", icon: UserRound },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export const AppSidebar = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHrManagerOpen, setIsHrManagerOpen] = useState(false);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { setOpen, isMobile, setOpenMobile, open } = useSidebar();
  // Function to close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const { user } = useAuth();
  //   console.log("user in AppSidebar", user === null);
  // Removed user role checks - components should handle auth individually
  let isUser = false;
  let isAdmin = false;
  let isHrManager = false;
  let isManager = false;

  user?.roles?.forEach((role) => {
    // Handle both string roles and object roles
    const roleName =
      typeof role === "string"
        ? role
        : role?.role_name || role?.name || role?.role || String(role);

    const roleLower = roleName?.toLowerCase?.() || "";

    if (roleLower === "user") {
      isUser = true;
    }
    if (roleLower === "admin") {
      isAdmin = true;
    }
    if (roleLower === "hrmanager") {
      isHrManager = true;
    }
    if (roleLower === "manager") {
      isManager = true;
    }
  });

  //   console.log(
  //     "isUser:",
  //     isUser,
  //     "isAdmin:",
  //     isAdmin,
  //     "isHrManager:",
  //     isHrManager,
  //     "isManager:",
  //     isManager
  //   );

  async function handleLogout() {
    // Close sidebar on mobile before logout
    if (isMobile) {
      setOpenMobile(false);
    }
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

  return (
    <Sidebar collapsible="icon">
      {/* <SidebarTrigger /> */}
      <SidebarHeader>
        <SidebarMenu
          className={`flex flex-row justify-between items-center gap-2`}
        >
          <SidebarMenuItem className={`${!open ? "hidden" : ""}`}>
            <SidebarMenuButton>
              <div className={`flex flex-row items-center gap-2`}>
                <Image
                  src="/images/niyava-logo-100x100.png"
                  alt="logo"
                  width={20}
                  height={20}
                />
                <span>HRMS Application</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarTrigger />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="ml-0" />
      <SidebarContent>
        {!user &&
          publicRoutes.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="hover:cursor-pointer">
                <Link href={item.url} onClick={handleLinkClick}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        {/* Employee Self Service */}
        {user && isUser && (
          <SidebarGroup>
            <SidebarGroupLabel>Employee Self Service</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/" onClick={handleLinkClick}>
                      <Home size={16} />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarMenu>
                <Collapsible
                  open={isEmployeeOpen}
                  onOpenChange={setIsEmployeeOpen}
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <UserRound size={16} />
                        <span>Employee</span>
                        <ChevronUp
                          className={cn(
                            "ml-auto transition-transform",
                            isEmployeeOpen ? "" : "rotate-180",
                            "group-data-[collapsible=icon]:hidden"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {employeeRoutes.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={item.url} onClick={handleLinkClick}>
                              <item.icon size={16} />
                              {item.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* Manager */}
        {user && isManager && (
          <SidebarGroup>
            <SidebarGroupLabel>Manage Your Team</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  open={isManagerOpen}
                  onOpenChange={setIsManagerOpen}
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Briefcase size={16} />
                        <span>Manager</span>
                        <ChevronUp
                          className={cn(
                            "ml-auto transition-transform",
                            isHrManagerOpen ? "" : "rotate-180",
                            "group-data-[collapsible=icon]:hidden"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {managerRoutes.map((r, index) => (
                        <SidebarMenuSubItem key={`${r.url}_${index}`}>
                          <SidebarMenuSubButton asChild>
                            <Link href={r.url} onClick={handleLinkClick}>
                              <r.icon size={16} />
                              {r.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {user && (isAdmin || isHrManager) && (
          <SidebarGroup>
            <SidebarGroupLabel>HR Manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  open={isHrManagerOpen}
                  onOpenChange={setIsHrManagerOpen}
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {/* <UsersRound size={16} /> */}
                        <Handshake size={16} />
                        <span>HR Manager</span>
                        <ChevronUp
                          className={cn(
                            "ml-auto transition-transform",
                            isHrManagerOpen ? "" : "rotate-180",
                            "group-data-[collapsible=icon]:hidden"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {hrManagerRoutes.map((r, index) => (
                        <SidebarMenuSubItem key={`${r.url}_${index}`}>
                          <SidebarMenuSubButton asChild>
                            <Link href={r.url} onClick={handleLinkClick}>
                              <r.icon size={16} />
                              {r.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {user && isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  open={isAdminOpen}
                  onOpenChange={setIsAdminOpen}
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <ShieldUser size={16} />
                        <span>Admin</span>
                        <ChevronUp
                          className={cn(
                            "ml-auto transition-transform",
                            isAdminOpen ? "" : "rotate-180",
                            "group-data-[collapsible=icon]:hidden"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {adminRoutes.map((r, index) => (
                        <SidebarMenuSubItem key={`${r.url}_${index}`}>
                          <SidebarMenuSubButton asChild>
                            <Link href={r.url} onClick={handleLinkClick}>
                              <r.icon size={16} />
                              {r.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem className="flex text-red-500 hover:text-red-500">
                  <SidebarMenuButton
                    asChild
                    className="hover:cursor-pointer text-red-500 hover:!text-red-500 focus:!text-red-500 active:!text-red-500"
                    onClick={handleLogout}
                  >
                    {/* <Link href="" className="text-red-500 hover:text-red-500"> */}
                    <span>
                      <LogOut size={16} className="text-red-500" />
                      <span>Logout</span>
                    </span>
                    {/* </Link> */}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <>
        <SidebarSeparator className="ml-0" />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="text-blue-600 font-semibold hover:text-blue-600 hover:cursor-pointer">
                    <User2 />
                    {user?.employee_name ||
                      user?.name ||
                      user?.username ||
                      "User"}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link
                      href="/ess/employee-dashboard"
                      className="flex items-center w-full gap-2"
                      onClick={handleLinkClick}
                    >
                      {/* <LayoutDashboard size={16} /> */}
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </>
    </Sidebar>
  );
};

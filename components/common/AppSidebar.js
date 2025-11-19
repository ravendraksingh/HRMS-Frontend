"use client";
import { useState, useEffect } from "react";
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
  Calendar,
  CalendarOff,
  UserCircle,
  CalendarDays,
  MapPin,
  UserCog,
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
  SidebarMenuAction,
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
import { useAuth } from "../auth/AuthContext";
import { cn } from "@/lib/utils";
import { externalApiClient } from "@/app/services/externalApiClient";

const publicRoutes = [{ title: "Login", url: "/login", icon: LogIn }];

const employeeRoutes = [
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Attendance", url: "/attendance", icon: CalendarClock },
  { title: "Leave", url: "/leave", icon: CalendarOff },
  { title: "Salaries", url: "/salary", icon: BadgeIndianRupee },
  { title: "Personal Details", url: "/personal-details", icon: UserRound },
];

const adminRoutes = [
  { title: "Locations", url: "/admin/locations", icon: MapPin },
  { title: "Departments", url: "/admin/departments", icon: Building },
  { title: "Roles", url: "/admin/roles", icon: ShieldUser },
  { title: "Users", url: "/admin/users", icon: UserRound },
  { title: "Settings", url: "/admin/setting", icon: Settings },
];

const hrManagerRoutes = [
  { title: "Employees", url: "/employees", icon: UsersRound },
  { title: "Holidays", url: "/holidays", icon: Calendar },
  { title: "Monthly Calendar", url: "/monthly-calendar", icon: CalendarDays },
  { title: "Shifts", url: "/shifts", icon: CalendarClock },
  { title: "Overtime", url: "/overtime", icon: ClipboardClock },
  { title: "Policies", url: "/attendance-policies", icon: Settings },
];

export const AppSidebar = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHrManagerOpen, setIsHrManagerOpen] = useState(false);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const { user, logout } = useAuth();
  const { setOpen, isMobile, setOpenMobile } = useSidebar();
  // Function to close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // console.log("user in AppSidebar", user);

  // Check if user is admin - check roles array for ADMIN role code
  let isAdmin = false;
  isAdmin = user?.roles?.some(
    (role) => role?.role_code?.toLowerCase() === "admin"
  );

  // Check if user is HR Manager - check roles array for HR_MANAGER role code
  let isHrManager = false;
  isHrManager = user?.roles?.some(
    (role) => role?.role_code?.toLowerCase() === "hr_manager"
  );

  // Check if user is a manager (has direct reports)
  useEffect(() => {
    const checkIfManager = async () => {
      if (!user?.employee_id) {
        setIsManager(false);
        return;
      }

      try {
        const res = await externalApiClient.get(
          `/managers/${user.employee_id}/employees`
        );
        const employees = res.data?.employees || res.data || [];
        setIsManager(employees.length > 0);
      } catch (error) {
        // If 404 or error, user is not a manager
        setIsManager(false);
      }
    };

    checkIfManager();
  }, [user?.employee_id]);

  async function handleLogout() {
    // Close sidebar on mobile before logout
    if (isMobile) {
      setOpenMobile(false);
    }
    // Use centralized logout from AuthContext
    await logout();
  }

  return (
    <Sidebar collapsible="icon">
      {/* <SidebarTrigger /> */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/niyava-logo-100x100.png"
                  alt="logo"
                  width={20}
                  height={20}
                />
                <span>EMS App</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="ml-0" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Main menu */}
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
            {/* Employees section: role-based submenu */}
            {
              <>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard" onClick={handleLinkClick}>
                        <LayoutDashboard size={16} />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                {/* Employee Group */}
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
              </>
            }
          </SidebarGroupContent>
        </SidebarGroup>
        {user && isManager && (
          <SidebarGroup>
            <SidebarGroupLabel>Manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/team" onClick={handleLinkClick}>
                      <UserCog size={16} />
                      <span>My Team</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                        <UsersRound size={16} />
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
                  <SidebarMenuButton>
                    <User2 />
                    {user?.employee_name ||
                      user?.name ||
                      user?.username ||
                      "User"}{" "}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Account</DropdownMenuItem>
                  <DropdownMenuItem>Setting</DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    Sign Out
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

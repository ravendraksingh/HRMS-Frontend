"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  UsersRound,
  CalendarClock,
  CalendarOff,
  Clock,
  UserCircle,
} from "lucide-react";

export default function MyTeamLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Overview",
      href: "/manager/my-team",
      value: "overview",
      icon: UsersRound,
    },
    {
      name: "Attendance",
      href: "/manager/my-team/attendance",
      value: "attendance",
      icon: CalendarClock,
    },
    {
      name: "Corrections",
      href: "/manager/my-team/corrections",
      value: "corrections",
      icon: Clock,
    },
    {
      name: "Leave Requests",
      href: "/manager/my-team/leaves",
      value: "leaves",
      icon: CalendarOff,
    },
    {
      name: "Team Directory",
      href: "/manager/my-team/directory",
      value: "directory",
      icon: UserCircle,
    },
  ];

  const isActive = (href) => {
    if (href === "/manager/my-team") {
      return pathname === "/manager/my-team";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team Management</h1>
        <p className="text-gray-600">
          Manage your team's activities, attendance, and leave requests
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-6">
        <div className="inline-flex w-auto min-w-max sm:w-fit md:w-full md:max-w-4xl border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.value}
                href={tab.href}
                className={cn(
                  "text-xs sm:text-sm px-2 sm:px-3 py-3 whitespace-nowrap flex-shrink-0 border-b-2 transition-colors flex items-center gap-2",
                  isActive(tab.href)
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building,
  Calendar,
  CalendarClock,
  Pin,
  Settings,
  ClipboardClock,
  UserRound,
  ShieldUser,
  Building2,
} from "lucide-react";

const SettingsPage = () => {
  const settingsSections = [
    {
      title: "Organization",
      description: "Manage organization level details and information",
      url: "/admin/organization",
      icon: Building2,
    },
    {
      title: "Users",
      description: "Manage system users and access",
      url: "/admin/users",
      icon: UserRound,
    },
    {
      title: "Roles",
      description: "Configure roles and permissions",
      url: "/admin/roles",
      icon: ShieldUser,
    },
    {
      title: "Departments",
      description: "Manage departments and organizational structure",
      url: "/admin/departments",
      icon: Building,
    },
    {
      title: "Locations",
      description: "Manage organization locations and addresses",
      url: "/admin/locations",
      icon: Pin,
    },
    {
      title: "Shifts",
      description: "Configure work shifts and timings",
      url: "/hr/shifts",
      icon: CalendarClock,
    },
    {
      title: "Holidays",
      description: "Manage company holidays and calendar",
      url: "/hr/manage-holidays",
      icon: Calendar,
    },
    {
      title: "Attendance Policies",
      description: "Set attendance rules and policies",
      url: "/hr/attendance-policies",
      icon: Settings,
    },
    {
      title: "Overtime Management",
      description: "Review and manage overtime requests",
      url: "/hr/overtime",
      icon: ClipboardClock,
    },
  ];

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold p-5">
        Organization Settings
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.url}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={section.url}>
                  <Button className="w-full">Manage</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsPage;

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/components/common/AuthContext";
import RouteGuard from "@/components/common/RouteGuard";
import {
  LayoutDashboard,
  UserCircle,
  BadgeIndianRupee,
  UserRound,
  CalendarClock,
  Calendar,
  Settings,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  console.log("user in Home", user);

  // Protected by RouteGuard - only authenticated users can see this
  const quickLinks = [
    {
      title: "Dashboard",
      url: "/ess/employee-dashboard",
      icon: LayoutDashboard,
      description: "View your dashboard",
    },
    {
      title: "Profile",
      url: "/ess/profile",
      icon: UserCircle,
      description: "View your profile",
    },
    {
      title: "Attendance",
      url: "/ess/attendance",
      icon: CalendarClock,
      description: "Mark attendance",
    },
    {
      title: "Leave",
      url: "/ess/leave",
      icon: Calendar,
      description: "Apply for leave",
    },
    {
      title: "Salary",
      url: "/ess/salary",
      icon: BadgeIndianRupee,
      description: "View salary details",
    },
    {
      title: "Personal Details",
      url: "/ess/personal-details",
      icon: UserRound,
      description: "Update personal information",
    },
  ];

  return (
    <RouteGuard requiredRoles="ALL">
      <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome
          {user?.employee_name || user?.name
            ? `, ${user.employee_name || user.name}`
            : ""}
          !
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your work, track attendance, and access important information
          from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickLinks.map((link) => (
          <Card key={link.url} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <link.icon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{link.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{link.description}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={link.url}>
                  Go to {link.title}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/ess/attendance">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Mark Today's Attendance
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/ess/leave">
                  <Calendar className="mr-2 h-4 w-4" />
                  Apply for Leave
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/ess/roster">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  View Daily Roster
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.empid && (
                <div>
                  <p className="text-sm text-gray-500">Employee Code</p>
                  <p className="font-semibold">{user.empid}</p>
                </div>
              )}
              {user?.username && (
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-semibold">{user.username}</p>
                </div>
              )}
              {user?.organization_name && (
                <div>
                  <p className="text-sm text-gray-500">Organization</p>
                  <p className="font-semibold">{user.organization_name}</p>
                </div>
              )}
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/ess/user-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </RouteGuard>
  );
}

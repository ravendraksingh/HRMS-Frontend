"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, CalendarClock, CalendarOff, TrendingUp, UserCircle } from "lucide-react";
import TeamOverview from "@/components/managers/TeamOverview";
import TeamAttendance from "@/components/managers/TeamAttendance";
import LeaveApprovals from "@/components/managers/LeaveApprovals";
import TeamDirectory from "@/components/managers/TeamDirectory";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function TeamDashboard() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    if (user?.employee_id) {
      fetchTeamMembers();
    }
  }, [user?.employee_id]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const managerId = user?.employee_id;
      if (!managerId) {
        toast.error("Employee ID not found");
        return;
      }

      // Check if user is a manager by fetching their employees
      const res = await externalApiClient.get(`/managers/${managerId}/employees`);
      const employees = res.data?.employees || res.data || [];
      
      if (employees.length > 0) {
        setTeamMembers(employees);
        setIsManager(true);
      } else {
        setIsManager(false);
        toast.error("You don't have any direct reports. This page is for managers only.");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      setIsManager(false);
      if (error.response?.status === 404) {
        toast.error("You don't have any direct reports. This page is for managers only.");
      } else {
        toast.error("Failed to load team members");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                This page is only accessible to managers with direct reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team Management</h1>
        <p className="text-muted-foreground">
          Manage your team's activities, attendance, and leave requests
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <UsersRound className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <CalendarClock className="mr-2 h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leaves">
            <CalendarOff className="mr-2 h-4 w-4" />
            Leave Requests
          </TabsTrigger>
          <TabsTrigger value="directory">
            <UserCircle className="mr-2 h-4 w-4" />
            Team Directory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TeamOverview teamMembers={teamMembers} managerId={user?.employee_id} />
        </TabsContent>

        <TabsContent value="attendance">
          <TeamAttendance teamMembers={teamMembers} managerId={user?.employee_id} />
        </TabsContent>

        <TabsContent value="leaves">
          <LeaveApprovals teamMembers={teamMembers} managerId={user?.employee_id} />
        </TabsContent>

        <TabsContent value="directory">
          <TeamDirectory teamMembers={teamMembers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { UsersRound } from "lucide-react";
import LeaveApprovals from "@/components/managers/LeaveApprovals";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";

export default function LeaveApprovalsPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    if (user?.empid) {
      fetchTeamMembers();
    }
  }, [user?.empid]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const managerId = user?.empid;
      if (!managerId) {
        toast.error("Employee ID not found");
        return;
      }

      // Check if user is a manager by fetching their employees
      const res = await externalApiClient.get(
        `/managers/${managerId}/employees`
      );
      const employees = res.data?.employees || [];

      if (employees.length > 0) {
        setTeamMembers(employees);
        setIsManager(true);
      } else {
        setIsManager(false);
        toast.error(
          "You don't have any direct reports. This page is for managers only."
        );
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      setIsManager(false);
      if (error.response?.status === 404) {
        toast.error(
          "You don't have any direct reports. This page is for managers only."
        );
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
    );
  }

  return <LeaveApprovals teamMembers={teamMembers} managerId={user?.empid} />;
}

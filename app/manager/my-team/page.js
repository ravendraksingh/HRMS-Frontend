"use client";

import { useState, useEffect } from "react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersRound, RefreshCw } from "lucide-react";
import TeamOverview from "@/components/managers/TeamOverview";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";

export default function TeamOverviewPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTeamMembers();
      // Force TeamOverview to refresh by updating refreshKey
      setRefreshKey((prev) => prev + 1);
    } finally {
      setRefreshing(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team Overview</h1>
          <p className="text-gray-600">
            Welcome back, {user?.employee_name || "Manager"}!
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <>
              <Spinner size={16} className="mr-2" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      <TeamOverview
        teamMembers={teamMembers}
        managerEmpId={user?.empid}
        refreshTrigger={refreshKey}
      />
    </div>
  );
}

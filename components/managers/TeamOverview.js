"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import {
  CalendarOff,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { getTodayDate } from "@/lib/dateTimeUtil";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function TeamOverview({
  teamMembers,
  managerEmpId,
  refreshTrigger,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    pendingLeaveRequests: 0,
    pendingAttendanceCorrections: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    if (teamMembers && teamMembers.length > 0 && managerEmpId) {
      fetchOverviewData();
    }
  }, [teamMembers, managerEmpId, refreshTrigger]);

  const fetchOverviewData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      const today = getTodayDate();
      // Fetch manager dashboard data
      try {
        const dashboardRes = await externalApiClient.get(
          `/managers/${managerEmpId}/dashboard`
        );
        const responseData = dashboardRes.data || {};
        const dashboardData = responseData?.summary || {};
        console.log("dashboardData", dashboardData);
        setStats((prev) => ({
          ...prev,
          totalMembers: dashboardData.total_team_members || teamMembers.length,
          presentToday: dashboardData.present_today || 0,
          absentToday: dashboardData.absent_today || 0,
          onLeaveToday: dashboardData.on_leave_today || 0,
          pendingLeaveRequests: dashboardData.pending_leave_requests || 0,
          pendingAttendanceCorrections:
            dashboardData.pending_attendance_correction_requests || 0,
          attendanceRate: dashboardData.attendance_rate_30_days || 0,
        }));
      } catch (e) {
        console.error("Error fetching manager dashboard:", e);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load dashboard data";
      setError(errorMessage);
      toast.error(errorMessage);
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-gray-500 mt-1">Direct reports</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 ml-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-green-600">
                  {stats.presentToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Team members present
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Absent Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-red-600">
                  {stats.absentToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Team members absent
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 ml-4">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              On Leave Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.onLeaveToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Team members on leave
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 ml-4">
                <CalendarOff className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pendingLeaveRequests}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 ml-4">
                <CalendarOff className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Attendance Corrections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.pendingAttendanceCorrections}
                </p>
                <p className="text-xs text-gray-500 mt-1">Pending review</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 ml-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.attendanceRate > 0
                    ? `${stats.attendanceRate.toFixed(1)}%`
                    : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">30-day average</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 ml-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalMembers > 0
                    ? "Team operational"
                    : "No team members"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  CalendarOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  ArrowRight,
  RefreshCw,
  UsersRound,
  CalendarClock,
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";

const ManagerDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    pendingLeaveRequests: 0,
    pendingAttendanceCorrections: 0,
    attendanceRate: 0,
    upcomingHolidays: [],
    pendingLeaves: [],
  });

  useEffect(() => {
    if (user?.empid) {
      fetchDashboardData();
    }
  }, [user?.empid]);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const managerId = user?.empid;
      if (!managerId) {
        setError("Manager ID not found");
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const currentYear = new Date().getFullYear();

      // Fetch manager dashboard data
      try {
        const dashboardRes = await externalApiClient.get(
          `/managers/${managerId}/dashboard?date=${today}`
        );
        const dashboardData = dashboardRes.data || {};

        setStats((prev) => ({
          ...prev,
          totalTeamMembers:
            dashboardData.team_count || dashboardData.total_team_members || 0,
          presentToday:
            dashboardData.present_today ||
            dashboardData.present_count ||
            dashboardData.present ||
            0,
          absentToday:
            dashboardData.absent_today ||
            dashboardData.absent_count ||
            dashboardData.absent ||
            0,
          onLeaveToday:
            dashboardData.on_leave_today ||
            dashboardData.on_leave_count ||
            dashboardData.on_leave ||
            0,
          pendingLeaveRequests:
            dashboardData.pending_leaves ||
            dashboardData.pending_leave_count ||
            0,
          attendanceRate:
            dashboardData.attendance_rate ||
            dashboardData.attendance_rate_30_days ||
            0,
        }));
      } catch (e) {
        console.error("Error fetching manager dashboard:", e);
        // Fallback: try to fetch team members directly
        try {
          const teamRes = await externalApiClient.get(
            `/managers/${managerId}/employees`
          );
          const teamMembers =
            teamRes.data?.employees || teamRes.data || [];
          const teamArray = Array.isArray(teamMembers) ? teamMembers : [];

          setStats((prev) => ({
            ...prev,
            totalTeamMembers: teamArray.length,
          }));
        } catch (teamError) {
          console.error("Error fetching team members:", teamError);
        }
      }

      // Fetch pending leave requests for the team
      try {
        const leavesRes = await externalApiClient.get(
          `/managers/${managerId}/leaves/pending`
        );
        const leavesData = leavesRes.data?.leaves || leavesRes.data || [];
        const pendingLeaves = Array.isArray(leavesData) ? leavesData : [];

        setStats((prev) => ({
          ...prev,
          pendingLeaveRequests: pendingLeaves.length,
          pendingLeaves: pendingLeaves.slice(0, 5),
        }));
      } catch (e) {
        console.error("Error fetching pending leaves:", e);
        // Fallback: try general leaves endpoint
        try {
          const leavesRes = await externalApiClient.get(
            `/leaves?manager_id=${managerId}&status=pending`
          );
          const leavesData = leavesRes.data?.leaves || leavesRes.data || [];
          const pendingLeaves = Array.isArray(leavesData) ? leavesData : [];

          setStats((prev) => ({
            ...prev,
            pendingLeaveRequests: pendingLeaves.length,
            pendingLeaves: pendingLeaves.slice(0, 5),
          }));
        } catch (fallbackError) {
          console.error("Error fetching leaves (fallback):", fallbackError);
        }
      }

      // Fetch pending attendance corrections
      try {
        const correctionsRes = await externalApiClient.get(
          `/attendance/corrections?manager_id=${managerId}`
        );
        const correctionsData =
          correctionsRes.data?.corrections ||
          correctionsRes.data?.requests ||
          correctionsRes.data ||
          [];
        const pendingCorrections = Array.isArray(correctionsData)
          ? correctionsData.filter(
              (c) => (c.status || "").toLowerCase() === "pending"
            )
          : [];

        setStats((prev) => ({
          ...prev,
          pendingAttendanceCorrections: pendingCorrections.length,
        }));
      } catch (e) {
        console.error("Error fetching attendance corrections:", e);
      }

      // Fetch today's attendance for team members
      try {
        const teamRes = await externalApiClient.get(
          `/managers/${managerId}/employees`
        );
        const teamMembers = teamRes.data?.employees || teamRes.data || [];
        const teamArray = Array.isArray(teamMembers) ? teamMembers : [];

        if (teamArray.length > 0) {
          const attendanceRes = await externalApiClient.get(
            `/attendance?attendance_date=${today}`
          );
          const attendanceData =
            attendanceRes.data?.attendance || attendanceRes.data || [];
          const attendanceArray = Array.isArray(attendanceData)
            ? attendanceData
            : [];

          // Filter attendance for team members only
          const teamEmpIds = teamArray.map((m) => m.empid || m.employee_id);
          const teamAttendance = attendanceArray.filter((a) =>
            teamEmpIds.includes(a.empid || a.employee_id)
          );

          const presentCount = teamAttendance.filter(
            (a) => a.status === "PRESENT" || a.check_in_time
          ).length;
          const absentCount = teamAttendance.filter(
            (a) => a.status === "ABSENT"
          ).length;

          setStats((prev) => ({
            ...prev,
            presentToday: presentCount,
            absentToday: absentCount,
            totalTeamMembers: teamArray.length,
          }));
        }
      } catch (e) {
        console.error("Error fetching team attendance:", e);
      }

      // Fetch upcoming holidays
      try {
        const holidaysRes = await externalApiClient.get(
          `/holidays?year=${currentYear}`
        );
        const holidaysData = holidaysRes.data?.holidays || [];
        const upcoming = Array.isArray(holidaysData)
          ? holidaysData
              .filter((h) => {
                const holidayDate = new Date(h.holiday_date || h.date);
                return holidayDate >= new Date();
              })
              .sort((a, b) => {
                const dateA = new Date(a.holiday_date || a.date);
                const dateB = new Date(b.holiday_date || b.date);
                return dateA - dateB;
              })
              .slice(0, 5)
          : [];
        setStats((prev) => ({
          ...prev,
          upcomingHolidays: upcoming,
        }));
      } catch (e) {
        console.error("Error fetching holidays:", e);
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Spinner size={32} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.employee_name || user?.name || "Manager"}!
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

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.totalTeamMembers}</p>
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
                <p className="text-xs text-gray-500 mt-1">Team members present</p>
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
                <p className="text-xs text-gray-500 mt-1">Team members absent</p>
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
                <p className="text-xs text-gray-500 mt-1">Team members on leave</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 ml-4">
                <CalendarOff className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  {stats.totalTeamMembers > 0 ? "Team operational" : "No team members"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/manager/my-team">
                <UsersRound className="mr-2 h-4 w-4" />
                Manage My Team
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/manager/my-team/leaves">
                <CalendarOff className="mr-2 h-4 w-4" />
                Review Leave Requests
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/manager/my-team/attendance">
                <CalendarClock className="mr-2 h-4 w-4" />
                View Team Attendance
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/manager/my-team/corrections">
                <Clock className="mr-2 h-4 w-4" />
                Attendance Corrections
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Leave Requests</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/manager/my-team/leaves">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.pendingLeaves.length > 0 ? (
              <div className="space-y-3">
                {stats.pendingLeaves.map((leave, index) => (
                  <div
                    key={leave.id || index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {leave.employee_name ||
                          leave.employee?.employee_name ||
                          leave.name ||
                          "Employee"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {leave.leave_type || leave.type || "Leave"} •{" "}
                        {formatDateDisplay(leave.start_date || leave.startDate)} -{" "}
                        {formatDateDisplay(leave.end_date || leave.endDate)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {leave.days || leave.duration || "N/A"} days
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No pending leave requests
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Holidays</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/holidays">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.upcomingHolidays.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingHolidays.map((holiday, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {holiday.name || holiday.holiday_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateDisplay(
                          holiday.holiday_date || holiday.date
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={holiday.is_optional ? "secondary" : "default"}
                    >
                      {holiday.type || "Company"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No upcoming holidays
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;


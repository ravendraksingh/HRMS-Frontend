"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
  CalendarOff,
  AlertCircle,
  ArrowRight,
  Gift,
  RefreshCw,
  CalendarClock,
} from "lucide-react";
import TodaysAttendance from "@/components/attendance/TodaysAttendance";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { getTodayDate, getCurrentYear } from "@/lib/dateTimeUtil";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayAttendance: null,
    leaveBalance: null,
    leaveSummary: null,
    monthlyAttendance: 0,
    upcomingHolidays: [],
    pendingLeaves: [],
    recentAttendance: [],
  });

  useEffect(() => {
    if (user?.empid) {
      fetchDashboardData();
    } else {
      setLoading(false);
      setError("User information not available. Please log in again.");
    }
  }, [user?.empid]);

  const fetchDashboardData = async (isRefresh = false) => {
    const employeeId = user?.empid;
    if (!employeeId) {
      setError("User information not available");
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      // Fetch today's attendance
      try {
        const attendanceRes = await externalApiClient.get(
          `/employees/${employeeId}/attendance/today`
        );
        console.log("attendanceRes", attendanceRes.data);
        const todayData = attendanceRes.data;
        const attendanceData = todayData?.attendance || null;
        setStats((prev) => ({
          ...prev,
          todayAttendance: attendanceData,
          todayData: todayData,
        }));
      } catch (e) {
        // Don't show error toast for optional data
      }

      // Fetch pending leaves for the pending leaves section
      try {
        // Use the same endpoint pattern as the leave page
        const leavesRes = await externalApiClient.get(
          `/employees/${employeeId}/leaves?status=pending`
        );
        const leavesData = leavesRes.data?.leaves || [];
        const pendingLeaves = leavesData;

        // Sort by date (most recent first) and take first 5
        const sortedPendingLeaves = pendingLeaves
          .sort((a, b) => {
            const dateA = new Date(a.from_date || a.start_date || 0);
            const dateB = new Date(b.from_date || b.start_date || 0);
            return dateB - dateA;
          })
          .slice(0, 5);

        setStats((prev) => ({
          ...prev,
          pendingLeaves: sortedPendingLeaves,
        }));
      } catch (e) {
        console.error("Error fetching pending leaves:", e);
        // Don't show error toast for optional data
      }

      // Fetch upcoming holidays
      try {
        const holidaysRes = await externalApiClient.get(
          `/employees/${employeeId}/holidays`
        );
        let holidaysData = holidaysRes.data?.holidays || [];
        let filteredHolidays = holidaysData.filter((h) => {
          const holidayDate = new Date(h.holiday_date);
          return holidayDate >= new Date();
        });
        filteredHolidays = filteredHolidays.sort((a, b) => {
          const dateA = new Date(a.holiday_date);
          const dateB = new Date(b.holiday_date);
          return dateA - dateB;
        });
        filteredHolidays = filteredHolidays.slice(0, 5);
        setStats((prev) => ({ ...prev, upcomingHolidays: filteredHolidays }));
      } catch (e) {
        console.error("Error fetching holidays:", e);
        // Don't show error toast for optional data
        setStats((prev) => ({ ...prev, upcomingHolidays: [] }));
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
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

  // Get attendance status based on todayData
  const getAttendanceStatus = () => {
    const data = stats.todayData;
    if (!data) {
      return {
        status: "not_marked",
        label: "Not Clocked In",
        color: "secondary",
      };
    }

    // Check day status from API
    const dayStatus = data.day_status;
    const attendance = data.attendance;
    const leave = data.leave;

    // Handle leave pending status
    if (dayStatus === "LEAVE_PENDING" && leave) {
      return {
        status: "leave_pending",
        label: "Leave Pending",
        color: "secondary",
        leave: leave,
      };
    }

    // Handle on leave status
    if (dayStatus === "ON_LEAVE" && leave) {
      return {
        status: "on_leave",
        label: "On Leave",
        color: "default",
        leave: leave,
      };
    }

    // Handle attendance status
    if (!attendance) {
      if (dayStatus === "EXPECTED") {
        return {
          status: "not_marked",
          label: "Not Clocked In",
          color: "secondary",
        };
      }
      return {
        status: "absent",
        label: "Absent",
        color: "destructive",
      };
    }

    // Use check_in_time and check_out_time from attendance
    const clockInTime = attendance.check_in_time;
    const clockOutTime = attendance.check_out_time;

    if (clockInTime && !clockOutTime) {
      return { status: "present", label: "Present", color: "default" };
    }
    if (clockInTime && clockOutTime) {
      return { status: "completed", label: "Completed", color: "default" };
    }

    return { status: "absent", label: "Absent", color: "destructive" };
  };

  const attendanceStatus = getAttendanceStatus();

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

  if (error && !stats.todayAttendance && !stats.leaveBalance) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Unable to load dashboard
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.employee_name || "User"}!
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

      {/* Today's Status Card */}
      <div className="mb-6">
        <TodaysAttendance
          todayData={stats.todayData}
          showActions={true}
          showHeader={true}
          onRefresh={handleRefresh}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendanceStatus.status === "not_marked" && (
              <Button asChild className="w-full justify-start" size="lg">
                <Link href="/ess/attendance">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Mark Attendance
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
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
              size="lg"
            >
              <Link href="/ess/roster">
                <Clock className="mr-2 h-4 w-4" />
                View Roster
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/ess/salary">
                <Gift className="mr-2 h-4 w-4" />
                View Salary
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Holidays</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/ess/holidays">
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
                      <p className="text-sm font-semibold">
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

        {/* Pending Leaves */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Leave Requests</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/ess/leave">
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
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="text-sm">
                        {formatDateDisplay(leave.start_date)}-{" "}
                        {formatDateDisplay(leave.end_date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {leave.leave_type || leave.type || "Leave"} •{" "}
                        {leave.days || 1} day(s)
                      </p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
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
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;

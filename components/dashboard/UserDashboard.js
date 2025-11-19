"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CalendarClock,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
  CalendarOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Gift,
  RefreshCw,
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import logger from "@/lib/logger";

const UserDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayAttendance: null,
    leaveBalance: null,
    monthlyAttendance: 0,
    upcomingHolidays: [],
    pendingLeaves: [],
    recentAttendance: [],
  });

  useEffect(() => {
    if (user?.employee_id) {
      fetchDashboardData();
    } else {
      setLoading(false);
      setError("User information not available. Please log in again.");
    }
  }, [user?.employee_id]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (!user?.employee_id) {
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

      const dashboardLogger = logger.child({
        type: 'dashboard_fetch',
        employeeId: user.employee_id,
      });

      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Fetch today's attendance
      try {
        const attendanceRes = await externalApiClient.get(
          `/attendance?date=${today}&employee_id=${user.employee_id}`
        );
        const attendanceData = attendanceRes.data?.attendance?.[0] || null;
        setStats((prev) => ({ ...prev, todayAttendance: attendanceData }));
        dashboardLogger.info({ hasAttendance: !!attendanceData }, 'Today\'s attendance fetched');
      } catch (e) {
        dashboardLogger.warn({ err: e }, 'Error fetching today\'s attendance');
        // Don't show error toast for optional data
      }

      // Fetch leave balance and pending leaves
      try {
        const leavesRes = await externalApiClient.get(
          `/leaves?employee_id=${user.employee_id}`
        );
        const leavesData = leavesRes.data?.leaves || [];

        // Log the raw data for debugging
        dashboardLogger.debug({ 
          totalLeaves: leavesData.length,
          sampleLeaves: leavesData.slice(0, 3).map(l => ({ 
            id: l.id, 
            status: l.status,
            employee_id: l.employee_id 
          })),
        }, 'Raw leaves data received');

        // Calculate leave balance (assuming structure)
        // Check for various status formats (pending, PENDING, Pending, etc.)
        const approvedLeaves = leavesData.filter(
          (l) => {
            const status = (l.status || '').toLowerCase();
            return status === "approved";
          }
        );
        const pendingLeaves = leavesData.filter(
          (l) => {
            const status = (l.status || '').toLowerCase();
            return status === "pending";
          }
        );

        // Try to get leave balance from backend if available
        const leaveBalance = leavesRes.data?.leave_balance || {
          total: 20, // Default fallback
          used: approvedLeaves.length,
          remaining: 20 - approvedLeaves.length,
        };

        setStats((prev) => ({
          ...prev,
          pendingLeaves: pendingLeaves.slice(0, 5),
          leaveBalance: {
            total: leaveBalance.total || 20,
            used: leaveBalance.used || approvedLeaves.length,
            remaining: leaveBalance.remaining || (leaveBalance.total || 20) - (leaveBalance.used || approvedLeaves.length),
          },
        }));
        dashboardLogger.info({ 
          totalLeaves: leavesData.length,
          pendingCount: pendingLeaves.length,
          approvedCount: approvedLeaves.length,
          leaveBalance: leaveBalance.remaining,
          pendingLeaves: pendingLeaves.map(l => ({ 
            id: l.id, 
            status: l.status,
            from_date: l.from_date || l.start_date,
            to_date: l.to_date || l.end_date,
          })),
        }, 'Leave data fetched');
      } catch (e) {
        dashboardLogger.warn({ err: e }, 'Error fetching leave data');
        // Don't show error toast for optional data
      }

      // Fetch upcoming holidays
      try {
        const currentYear = new Date().getFullYear();
        const holidaysRes = await externalApiClient.get(
          `/holidays?year=${currentYear}`
        );
        const holidaysData = holidaysRes.data?.holidays || [];

        const upcoming = holidaysData
          .filter((h) => {
            const holidayDate = new Date(h.holiday_date || h.date);
            return holidayDate >= new Date();
          })
          .sort((a, b) => {
            const dateA = new Date(a.holiday_date || a.date);
            const dateB = new Date(b.holiday_date || b.date);
            return dateA - dateB;
          })
          .slice(0, 5);

        setStats((prev) => ({ ...prev, upcomingHolidays: upcoming }));
        dashboardLogger.info({ count: upcoming.length }, 'Upcoming holidays fetched');
      } catch (e) {
        dashboardLogger.warn({ err: e }, 'Error fetching holidays');
        // Don't show error toast for optional data
      }

      // Fetch monthly attendance summary
      try {
        const monthlyRes = await externalApiClient.get(
          `/reports/attendance/monthly?month=${currentMonth}&employeeId=${user.employee_id}`
        );
        const monthlyData = monthlyRes.data?.attendance || monthlyRes.data || {};
        
        // Try multiple possible field names for days present
        const daysPresent = monthlyData?.days_present || 
                           monthlyData?.present_days || 
                           monthlyData?.daysPresent ||
                           monthlyData?.total_days_present ||
                           (Array.isArray(monthlyData) ? monthlyData.length : 0);
        
        setStats((prev) => ({
          ...prev,
          monthlyAttendance: daysPresent || 0,
        }));
        dashboardLogger.info({ 
          daysPresent,
          responseData: monthlyData,
        }, 'Monthly attendance fetched');
      } catch (e) {
        dashboardLogger.warn({ 
          err: e,
          employeeId: user.employee_id,
          month: currentMonth,
        }, 'Error fetching monthly attendance');
        // Set default value on error
        setStats((prev) => ({
          ...prev,
          monthlyAttendance: 0,
        }));
      }

      dashboardLogger.info('Dashboard data fetch completed');
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load dashboard data";
      logger.error({ 
        err: error,
        employeeId: user?.employee_id,
        type: 'dashboard_fetch_error',
      }, 'Error fetching dashboard data');
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

  const getAttendanceStatus = () => {
    if (!stats.todayAttendance)
      return { status: "not_marked", label: "Not Marked", color: "secondary" };
    if (stats.todayAttendance.clock_in && !stats.todayAttendance.clock_out)
      return { status: "present", label: "Present", color: "default" };
    if (stats.todayAttendance.clock_in && stats.todayAttendance.clock_out)
      return { status: "completed", label: "Completed", color: "default" };
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
            <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
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
            Welcome back, {user?.employee_name || user?.name || "User"}!
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{attendanceStatus.label}</p>
                {stats.todayAttendance?.clock_in ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-gray-600">
                      In: {new Date(
                        stats.todayAttendance.clock_in
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {stats.todayAttendance?.clock_out && (
                      <p className="text-xs text-gray-600">
                        Out: {new Date(
                          stats.todayAttendance.clock_out
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Not clocked in</p>
                )}
              </div>
              <div
                className={`p-3 rounded-full ml-4 ${
                  attendanceStatus.status === "present" ||
                  attendanceStatus.status === "completed"
                    ? "bg-green-100"
                    : attendanceStatus.status === "not_marked"
                    ? "bg-gray-100"
                    : "bg-red-100"
                }`}
              >
                {attendanceStatus.status === "present" ||
                attendanceStatus.status === "completed" ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : attendanceStatus.status === "not_marked" ? (
                  <Clock className="h-6 w-6 text-gray-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">
                  {stats.leaveBalance?.remaining !== undefined ? stats.leaveBalance.remaining : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {stats.leaveBalance?.total || "N/A"} days remaining
                </p>
                {stats.leaveBalance?.total && stats.leaveBalance?.remaining !== undefined && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (stats.leaveBalance.remaining / stats.leaveBalance.total) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="p-3 rounded-full bg-blue-100 ml-4">
                <CalendarOff className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.monthlyAttendance}</p>
                <p className="text-xs text-gray-500 mt-1">Days Present</p>
                {stats.todayAttendance?.clock_in && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Today: Present
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-purple-100 ml-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {stats.pendingLeaves.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
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
            {attendanceStatus.status === "not_marked" && (
              <Button asChild className="w-full justify-start" size="lg">
                <Link href="/attendance">
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
              <Link href="/leave">
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
              <Link href="/roster">
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
              <Link href="/salary">
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

        {/* Pending Leaves */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Leave Requests</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/leave">
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
                      <p className="font-medium">
                        {formatDateDisplay(leave.from_date || leave.start_date)}{" "}
                        - {formatDateDisplay(leave.to_date || leave.end_date)}
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

export default UserDashboard;

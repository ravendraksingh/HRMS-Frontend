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
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/formatDateDisplay";

const UserDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
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
    }
  }, [user?.employee_id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Fetch today's attendance
      try {
        const attendanceRes = await externalApiClient.get(
          `/attendance?date=${today}&employee_id=${user.employee_id}`
        );
        const attendanceData = attendanceRes.data.attendance[0];
        setStats((prev) => ({ ...prev, todayAttendance: attendanceData }));
      } catch (e) {
        console.error("Error fetching attendance:", e);
      }

      // Fetch leave balance and pending leaves
      try {
        const leavesRes = await externalApiClient.get(
          `/leaves?employeeId=${user.employee_id}`
        );
        const leavesData = leavesRes.data.leaves;

        // Calculate leave balance (assuming structure)
        const approvedLeaves = leavesData.filter(
          (l) => l.status === "approved" || l.status === "APPROVED"
        );
        const pendingLeaves = leavesData.filter(
          (l) => l.status === "pending" || l.status === "PENDING"
        );

        setStats((prev) => ({
          ...prev,
          pendingLeaves: pendingLeaves.slice(0, 5),
          leaveBalance: {
            total: 20, // This should come from backend
            used: approvedLeaves.length,
            remaining: 20 - approvedLeaves.length,
          },
        }));
      } catch (e) {
        console.error("Error fetching leaves:", e);
      }

      // Fetch upcoming holidays
      try {
        const currentYear = new Date().getFullYear();
        const holidaysRes = await externalApiClient.get(
          `/holidays?year=${currentYear}`
        );
        const holidaysData = holidaysRes.data.holidays;

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
      } catch (e) {
        console.error("Error fetching holidays:", e);
      }

      // Fetch monthly attendance summary
      try {
        const monthlyRes = await externalApiClient.get(
          `/reports/attendance/monthly?month=${currentMonth}&employeeId=${user.employee_id}`
        );
        const monthlyData = monthlyRes.data?.attendance || monthlyRes.data;
        setStats((prev) => ({
          ...prev,
          monthlyAttendance:
            monthlyData?.days_present || monthlyData?.present_days || 0,
        }));
      } catch (e) {
        console.error("Error fetching monthly attendance:", e);
        // Set default value on error
        setStats((prev) => ({
          ...prev,
          monthlyAttendance: 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.employee_name || user?.name || "User"}!
        </p>
      </div>

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
              <div>
                <p className="text-2xl font-bold">{attendanceStatus.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.todayAttendance?.clock_in
                    ? `Clocked in at ${new Date(
                        stats.todayAttendance.clock_in
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Not clocked in"}
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${
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
              <div>
                <p className="text-2xl font-bold">
                  {stats.leaveBalance?.remaining || "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {stats.leaveBalance?.total || "N/A"} days remaining
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
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
              <div>
                <p className="text-2xl font-bold">{stats.monthlyAttendance}</p>
                <p className="text-xs text-gray-500 mt-1">Days Present</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
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
                <Link href="/admin/holidays">
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

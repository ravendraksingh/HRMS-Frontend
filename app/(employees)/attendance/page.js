"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { ChartAreaInteractive } from "@/components/attendance/ChartDemo";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  TrendingUp,
  AlertCircle,
  Download,
  Coffee,
  Zap,
  Edit,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";
import useAttendanceStore from "@/store/attendanceStore";
import Link from "next/link";

const AttendancePage = () => {
  const { user } = useAuth();

  // Zustand store state and actions
  const {
    todayAttendance,
    attendanceHistory,
    monthlyStats,
    weeklyStats,
    selectedDate,
    selectedMonth,
    loading,
    clocking,
    setSelectedDate,
    setSelectedMonth,
    fetchTodayAttendance,
    fetchAttendanceHistory,
    fetchMonthlyStats,
    fetchWeeklyStats,
    handleClockIn,
    handleClockOut,
    refreshAll,
  } = useAttendanceStore();

  useEffect(() => {
    if (user?.employee_id) {
      refreshAll(user.employee_id);
    }
  }, [user?.employee_id, selectedMonth]);

  const calculateWorkingHours = () => {
    if (!todayAttendance) return "00:00:00";
    // Handle different field names from API - prioritize clock_in/clock_out
    const clockInTime =
      todayAttendance.clock_in ||
      todayAttendance.clockin ||
      todayAttendance.clockin_time;
    const clockOutTime =
      todayAttendance.clock_out ||
      todayAttendance.clockout ||
      todayAttendance.clockout_time;

    if (!clockInTime) return "00:00:00";

    const clockIn = new Date(clockInTime);
    const clockOut = clockOutTime ? new Date(clockOutTime) : new Date();
    const diff = clockOut - clockIn;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const getAttendanceStatus = () => {
    if (!todayAttendance)
      return {
        status: "not_marked",
        label: "Not Clocked In",
        color: "secondary",
      };
    // Handle different field names from API - prioritize clock_in/clock_out
    const clockInTime =
      todayAttendance.clock_in ||
      todayAttendance.clockin ||
      todayAttendance.clockin_time;
    const clockOutTime =
      todayAttendance.clock_out ||
      todayAttendance.clockout ||
      todayAttendance.clockout_time;

    if (clockInTime && !clockOutTime)
      return { status: "present", label: "Present", color: "default" };
    if (clockInTime && clockOutTime)
      return { status: "completed", label: "Completed", color: "default" };
    return { status: "absent", label: "Absent", color: "destructive" };
  };

  const attendanceStatus = getAttendanceStatus();
  // Check if can clock in/out based on different possible field names - prioritize clock_in/clock_out
  const clockInTime =
    todayAttendance?.clock_in ||
    todayAttendance?.clockin ||
    todayAttendance?.clockin_time;
  const clockOutTime =
    todayAttendance?.clock_out ||
    todayAttendance?.clockout ||
    todayAttendance?.clockout_time;
  const canClockIn = !clockInTime;
  const canClockOut = clockInTime && !clockOutTime;

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
      case "p":
        return <Badge className="bg-green-500 text-white">Present</Badge>;
      case "absent":
      case "a":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge className="bg-orange-500 text-white">Late</Badge>;
      case "half_day":
        return <Badge className="bg-yellow-500 text-white">Half Day</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      return new Date(timeStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  // Check if a date is disabled (has clock-in or not in current month)
  const isDateDisabled = (date) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    // Disable if not in current month
    if (
      date.getMonth() !== currentMonth ||
      date.getFullYear() !== currentYear
    ) {
      return true;
    }

    // Disable if date is in the future
    if (dateToCheck > today) {
      return true;
    }

    // Disable if date has clock-in
    const dateStr = formatDateToYYYYMMDD(date);
    const todayStr = formatDateToYYYYMMDD(today);

    // Check today's attendance first (might not be in history yet)
    if (dateStr === todayStr && todayAttendance) {
      const clockIn =
        todayAttendance.clock_in ||
        todayAttendance.clockin ||
        todayAttendance.clockin_time;
      return !!clockIn; // Disable if has clock-in
    }

    // Check attendance history
    const record = attendanceHistory.find(
      (att) => (att.date || att.work_date) === dateStr
    );

    if (record) {
      const clockIn = record.clock_in || record.clockin || record.clockin_time;
      return !!clockIn; // Disable if has clock-in
    }

    return false; // Enable if no record (no clock-in)
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Attendance</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Track and manage your attendance
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const monthStr = `${year}-${month}`;
                const monthName = date.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {monthName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Link
            href="/attendance/correction"
            className="flex-1 sm:flex-initial"
          >
            <Button variant="outline" className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Request Correction</span>
              <span className="sm:hidden">Correction</span>
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Today's Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Badge
                variant={attendanceStatus.color}
                className={
                  attendanceStatus.status === "present" ||
                  attendanceStatus.status === "completed"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : attendanceStatus.status === "not_marked"
                    ? "bg-gray-500"
                    : "bg-red-500"
                }
              >
                {attendanceStatus.label}
              </Badge>
              {todayAttendance?.clock_in && (
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Clock In:</span>{" "}
                  {new Date(
                    todayAttendance.clock_in ||
                      todayAttendance.clockin ||
                      todayAttendance.clockin_time
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
              {todayAttendance?.clock_out && (
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Clock Out:</span>{" "}
                  {new Date(
                    todayAttendance.clock_out ||
                      todayAttendance.clockout ||
                      todayAttendance.clockout_time
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {canClockIn && (
                <Button
                  onClick={() => handleClockIn(user.employee_id)}
                  disabled={clocking}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Clock In
                </Button>
              )}
              {canClockOut && (
                <Button
                  onClick={() => handleClockOut(user.employee_id)}
                  disabled={clocking}
                  variant="destructive"
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Clock Out
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Present Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyStats.presentDays}</p>
            <p className="text-xs text-gray-500 mt-1">
              of {monthlyStats.totalDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {monthlyStats.totalWorkingHours.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Late Arrivals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyStats.lateArrivals}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Overtime Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {monthlyStats.overtimeHours.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6 mt-6">
          {/* Today's Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Today's Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Clock In</p>
                    <p className="text-lg font-semibold">
                      {formatTime(
                        todayAttendance?.clock_in ||
                          todayAttendance?.clockin ||
                          todayAttendance?.clockin_time
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Clock Out</p>
                    <p className="text-lg font-semibold">
                      {formatTime(
                        todayAttendance?.clock_out ||
                          todayAttendance?.clockout ||
                          todayAttendance?.clockout_time
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Working Hours</p>
                    <p className="text-lg font-semibold">
                      {calculateWorkingHours()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Break Hours</p>
                    <p className="text-lg font-semibold">
                      {todayAttendance?.break_hours
                        ? `${Math.floor(todayAttendance.break_hours)}:${String(
                            Math.floor((todayAttendance.break_hours % 1) * 60)
                          ).padStart(2, "0")}`
                        : todayAttendance?.break_minutes
                        ? `${Math.floor(
                            todayAttendance.break_minutes / 60
                          )}:${String(
                            todayAttendance.break_minutes % 60
                          ).padStart(2, "0")}`
                        : "00:00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyStats.days.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{day.day}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        {day.present ? (
                          <Badge className="bg-green-500 text-white">
                            {day.hours}h
                          </Badge>
                        ) : (
                          <Badge variant="secondary">-</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="text-sm font-bold">
                        {weeklyStats.totalHours}h
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Average:</span>
                      <span className="text-xs font-semibold">
                        {weeklyStats.averageHours}h/day
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                month={new Date(selectedMonth + "-01")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance History</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Working Hours</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceHistory.length > 0 ? (
                      attendanceHistory.map((record, index) => {
                        const clockIn =
                          record.clock_in ||
                          record.clockin ||
                          record.clockin_time;
                        const clockOut =
                          record.clock_out ||
                          record.clockout ||
                          record.clockout_time;
                        let hours = 0;
                        if (clockIn && clockOut) {
                          const diff = new Date(clockOut) - new Date(clockIn);
                          hours = diff / (1000 * 60 * 60);
                        }
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {formatDateDisplay(
                                record.date || record.work_date
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(record.status)}
                            </TableCell>
                            <TableCell>{formatTime(clockIn)}</TableCell>
                            <TableCell>{formatTime(clockOut)}</TableCell>
                            <TableCell>{hours.toFixed(1)}h</TableCell>
                            <TableCell>
                              {record.break_hours
                                ? `${record.break_hours.toFixed(1)}h`
                                : record.break_minutes
                                ? `${(record.break_minutes / 60).toFixed(1)}h`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {record.overtime_hours
                                ? `${record.overtime_hours.toFixed(1)}h`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No attendance records found for this month
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>Present Days</span>
                    </div>
                    <span className="font-bold">
                      {monthlyStats.presentDays}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span>Absent Days</span>
                    </div>
                    <span className="font-bold">{monthlyStats.absentDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>On-Time Percentage</span>
                    </div>
                    <span className="font-bold">
                      {monthlyStats.onTimePercentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <span>Late Percentage</span>
                    </div>
                    <span className="font-bold">
                      {monthlyStats.latePercentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-5 w-5 text-purple-600" />
                      <span>Total Break Hours</span>
                    </div>
                    <span className="font-bold">
                      {monthlyStats.totalBreakHours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <span>Overtime Hours</span>
                    </div>
                    <span className="font-bold">
                      {monthlyStats.overtimeHours.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartAreaInteractive />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendancePage;

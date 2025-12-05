"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
  Calendar as CalendarIcon,
  CalendarDays,
  Briefcase,
  Coffee,
  Timer,
  LogOut,
  UserX,
} from "lucide-react";
import { formatDateToYYYYMMDD, getTodayDate } from "@/lib/dateTimeUtil";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getCurrentMonth } from "@/lib/dateTimeUtil";
import SelectMonth from "@/components/common/SelectMonth";

const AttendanceCalendarPage = () => {
  const { user } = useAuth();

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 1) => {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    return isNaN(num) ? "0.0" : num.toFixed(decimals);
  };

  // State
  const [calendarData, setCalendarData] = useState(null); // Full attendance calendar data
  const [monthlyStats, setMonthlyStats] = useState({
    totalDays: 0,
    workingDays: 0,
    presentDays: 0,
    absentDays: 0,
    totalWorkingHours: 0,
    holidays: 0,
    optionalHolidays: 0,
    leavesApproved: 0,
    leavesPending: 0,
    lateArrivals: 0,
    earlyDepartures: 0,
    overtimeHours: 0,
    weeklyOffs: 0,
    correctionsPending: 0,
    correctionsApproved: 0,
    correctionsRejected: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  // Fetch attendance calendar (includes calendar, attendance, and leaves)
  const fetchAttendanceCalendar = useCallback(async (employeeId, month) => {
    try {
      const res = await externalApiClient.get(
        `/employees/${employeeId}/calendar/attendance/monthly?month=${month}`
      );

      const data = res.data;
      //   console.log("data", data);
      setCalendarData(data);

      // Update monthly stats from summary
      if (data?.summary) {
        const summary = data.summary;
        const parseNumber = (value) => {
          if (value === null || value === undefined) return 0;
          const num =
            typeof value === "string" ? parseFloat(value) : Number(value);
          return isNaN(num) ? 0 : num;
        };

        setMonthlyStats({
          totalDays: parseNumber(summary?.total_days),
          workingDays: parseNumber(summary?.working_days),
          presentDays: parseNumber(summary?.attendance?.present),
          absentDays: parseNumber(summary?.attendance?.absent),
          totalWorkingHours: parseNumber(summary?.attendance?.total_work_hours),
          holidays: parseNumber(summary?.holidays),
          optionalHolidays: parseNumber(summary?.optional_holidays),
          leavesApproved: parseNumber(summary?.leaves?.approved),
          leavesPending: parseNumber(summary?.leaves?.pending),
          lateArrivals: parseNumber(summary?.attendance?.late_arrivals),
          earlyDepartures: parseNumber(summary?.attendance?.early_departures),
          overtimeHours: parseNumber(
            summary?.attendance?.overtime_hours || summary?.overtime_hours || 0
          ),
          weeklyOffs: parseNumber(summary?.weekly_offs),
          correctionsPending: parseNumber(
            summary?.correction_requests?.pending || 0
          ),
          correctionsApproved: parseNumber(
            summary?.correction_requests?.approved || 0
          ),
          correctionsRejected: parseNumber(
            summary?.correction_requests?.rejected || 0
          ),
        });
      }

      return data;
    } catch (error) {
      console.error("Error fetching attendance calendar:", error);
      setCalendarData(null);
      return null;
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(
    async (employeeId) => {
      setLoading(true);
      try {
        await fetchAttendanceCalendar(employeeId, selectedMonth);
      } catch (error) {
        console.error("Error refreshing attendance data:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth, fetchAttendanceCalendar]
  );

  useEffect(() => {
    if (user?.empid) {
      const employeeId = user?.empid;
      refreshAll(employeeId);
    }
  }, [user?.empid, selectedMonth, refreshAll]);

  // Get calendar day info from the attendance calendar response
  const getCalendarDayInfo = useCallback(
    (dateStr) => {
      if (!calendarData?.calendar || !Array.isArray(calendarData.calendar)) {
        return null;
      }

      return calendarData.calendar.find((day) => {
        if (!day.date) return false;

        // Normalize date strings for comparison
        let dayDateStr = "";
        if (typeof day.date === "string") {
          // Handle both "YYYY-MM-DD" and other formats
          dayDateStr = day.date.split("T")[0]; // Remove time if present
        } else {
          dayDateStr = formatDateToYYYYMMDD(new Date(day.date));
        }

        // Ensure both are in YYYY-MM-DD format
        const normalizedDateStr = dateStr.split("T")[0];

        return dayDateStr === normalizedDateStr;
      });
    },
    [calendarData]
  );

  // Get attendance status for a date based on the new response format
  const getAttendanceStatus = useCallback(
    (date) => {
      const dateStr = formatDateToYYYYMMDD(date);
      const todayStr = getTodayDate();
      const today = new Date(todayStr);
      today.setHours(0, 0, 0, 0);
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0);

      // Get calendar day info directly (inline to avoid dependency issues)
      let calendarDay = null;
      if (calendarData?.calendar && Array.isArray(calendarData.calendar)) {
        calendarDay = calendarData.calendar.find((day) => {
          if (!day.date) return false;
          let dayDateStr = "";
          if (typeof day.date === "string") {
            dayDateStr = day.date.split("T")[0];
          } else {
            dayDateStr = formatDateToYYYYMMDD(new Date(day.date));
          }
          const normalizedDateStr = dateStr.split("T")[0];
          return dayDateStr === normalizedDateStr;
        });
      }

      if (!calendarDay) {
        // Future dates
        if (dateToCheck > today) {
          return { status: "future", label: "Future", color: "gray" };
        }
        return {
          status: "not_clocked",
          label: "Not Clocked In",
          color: "gray",
        };
      }

      // Use day_status from the response as the primary source of truth
      const dayStatus = calendarDay.day_status;

      // Check for correction requests
      const correctionRequests = calendarDay.correction_requests || [];
      let correctionRequest = null;
      let correctionStatus = null;
      if (correctionRequests.length > 0) {
        correctionRequest = correctionRequests[0]; // Get the most recent one
        correctionStatus = correctionRequest.status?.toUpperCase();
      }

      // Handle leaves first (they take precedence over other statuses)
      if (dayStatus === "ON_LEAVE") {
        const leave = calendarDay.leaves?.[0];
        return {
          status: "on_leave",
          label: leave?.leave_type_name || "On Leave",
          color: "blue",
          isOnLeave: true,
          leaveType: leave?.leave_type_name,
        };
      }

      if (dayStatus === "LEAVE_PENDING") {
        const leave = calendarDay.leaves?.[0];
        return {
          status: "leave_pending",
          label: `Leave Pending (${leave?.leave_type_name || "Leave"})`,
          color: "orange",
          isLeavePending: true,
          leaveType: leave?.leave_type_name,
        };
      }

      // Handle attendance status (PRESENT)
      if (dayStatus === "PRESENT" && calendarDay.attendance) {
        const baseStatus = {
          status: "present",
          label: "Present",
          color: "green",
          clockIn: calendarDay.attendance.check_in_time,
          clockOut: calendarDay.attendance.check_out_time,
          isLate: calendarDay.attendance.is_late === "Y",
          isEarlyLeave: calendarDay.attendance.is_early_leave === "Y",
        };

        // Add correction request info if present
        if (correctionRequest) {
          baseStatus.hasCorrection = true;
          baseStatus.correctionStatus = correctionStatus;
          baseStatus.correctionRequest = correctionRequest;
          if (correctionStatus === "PENDING") {
            baseStatus.label = "Present (Correction Pending)";
          } else if (correctionStatus === "APPROVED") {
            baseStatus.label = "Present (Correction Approved)";
          } else if (correctionStatus === "REJECTED") {
            baseStatus.label = "Present (Correction Rejected)";
          }
        }

        return baseStatus;
      }

      // Handle correction requests for non-present days
      if (correctionRequest && dayStatus !== "PRESENT") {
        if (correctionStatus === "PENDING") {
          return {
            status: "correction_pending",
            label: "Correction Pending",
            color: "yellow",
            hasCorrection: true,
            correctionStatus: "PENDING",
            correctionRequest: correctionRequest,
          };
        } else if (correctionStatus === "APPROVED") {
          return {
            status: "correction_approved",
            label: "Correction Approved",
            color: "teal",
            hasCorrection: true,
            correctionStatus: "APPROVED",
            correctionRequest: correctionRequest,
          };
        } else if (correctionStatus === "REJECTED") {
          return {
            status: "correction_rejected",
            label: "Correction Rejected",
            color: "pink",
            hasCorrection: true,
            correctionStatus: "REJECTED",
            correctionRequest: correctionRequest,
          };
        }
      }

      // Handle non-working days (holidays, weekly offs)
      // Check calendar_type first as it's more specific
      if (calendarDay.calendar_type === "HOLIDAY") {
        return {
          status: "holiday",
          label: calendarDay.calendar_reason || "Holiday",
          color: "red",
          isHoliday: true,
          holidayName: calendarDay.calendar_reason,
        };
      } else if (calendarDay.calendar_type === "OPTIONAL_HOLIDAY") {
        return {
          status: "holiday",
          label: calendarDay.calendar_reason || "Optional Holiday",
          color: "red",
          isHoliday: true,
          holidayName: calendarDay.calendar_reason,
        };
      } else if (calendarDay.calendar_type === "WEEKLY_OFF") {
        return {
          status: "weekly_off",
          label: "Weekly Off",
          color: "gray",
          isWeeklyOff: true,
        };
      } else if (dayStatus === "NON_WORKING" || !calendarDay.is_working_day) {
        return {
          status: "weekly_off",
          label: "Non-Working",
          color: "gray",
          isWeeklyOff: true,
        };
      }

      // Handle EXPECTED status (future working days or absent)
      if (dayStatus === "EXPECTED") {
        // Future working day
        if (dateToCheck > today) {
          return { status: "future", label: "Future", color: "gray" };
        }
        // Past working day without attendance - this is absent
        return { status: "absent", label: "Absent", color: "red" };
      }

      // Handle ABSENT status explicitly if provided
      if (dayStatus === "ABSENT") {
        return { status: "absent", label: "Absent", color: "red" };
      }

      // Default fallback
      return { status: "not_clocked", label: "Not Clocked In", color: "gray" };
    },
    [calendarData]
  );

  // Get day color classes
  const getDayColorClasses = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 border-green-300 text-green-800";
      case "absent":
        return "bg-red-100 border-red-300 text-red-800";
      case "holiday":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "weekly_off":
        return "bg-gray-100 border-gray-300 text-gray-600";
      case "on_leave":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "leave_pending":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "correction_pending":
        return "bg-yellow-100 border-yellow-400 text-yellow-900";
      case "correction_approved":
        return "bg-teal-100 border-teal-400 text-teal-900";
      case "correction_rejected":
        return "bg-pink-100 border-pink-400 text-pink-900";
      case "not_clocked":
        return "bg-gray-100 border-gray-300 text-gray-600";
      case "future":
        return "bg-gray-50 border-gray-200 text-gray-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-400";
    }
  };

  // Generate all days for the selected month
  const generateMonthDays = useCallback(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0);
    const days = [];

    // Always generate all days for the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month - 1, i);
      const dateStr = formatDateToYYYYMMDD(date);

      // Get attendance status which will check calendar data
      const attendanceStatus = getAttendanceStatus(date);

      days.push({
        date: date,
        dateStr: dateStr,
        dayNumber: i,
        ...attendanceStatus,
      });
    }

    return days;
  }, [selectedMonth, getAttendanceStatus]);

  // Group days by week (starting from Monday)
  const groupDaysByWeek = useCallback((days) => {
    if (!days || !Array.isArray(days) || days.length === 0) {
      return [];
    }
    const weeks = [];
    let currentWeek = [];

    days.forEach((day, index) => {
      if (!day || !day.date) {
        return;
      }
      const date = day.date;
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      // Convert to Monday-based: 0 (Sun) -> 6, 1 (Mon) -> 0, 2 (Tue) -> 1, etc.
      const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      // Fill empty slots at the start of the first week (before Monday)
      if (index === 0 && mondayBasedDay !== 0) {
        for (let i = 0; i < mondayBasedDay; i++) {
          currentWeek.push(null);
        }
      }

      currentWeek.push(day);

      // End of week (Sunday, which is day 6 in Monday-based) or end of month
      if (mondayBasedDay === 6 || index === days.length - 1) {
        // Fill empty slots at the end of the last week (after Sunday)
        if (index === days.length - 1 && mondayBasedDay !== 6) {
          for (let i = mondayBasedDay + 1; i < 7; i++) {
            currentWeek.push(null);
          }
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  }, []);

  // Generate month days and group by weeks - memoized to recalculate when calendarData or selectedMonth changes
  const monthDays = useMemo(() => {
    return generateMonthDays();
  }, [selectedMonth, calendarData, generateMonthDays]);

  const weeks = useMemo(() => {
    return groupDaysByWeek(monthDays);
  }, [monthDays, groupDaysByWeek]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading calendar...</p>
      </div>
    );
  }

  // Show message if no calendar data and no days generated
  if (!calendarData && monthDays.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">No calendar data available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-1">
            Calendar View
          </h2>
          <p className="text-gray-600 text-sm">
            View your attendance calendar for the selected month
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <SelectMonth value={selectedMonth} onValueChange={setSelectedMonth} />
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-blue-700 flex items-center gap-1.5 mb-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Total Days
            </p>
            <p className="text-xl sm:text-2xl font-bold text-blue-900">
              {monthlyStats.totalDays}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">Days in month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-purple-700 flex items-center gap-1.5 mb-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Holidays
            </p>
            <p className="text-xl sm:text-2xl font-bold text-purple-900">
              {monthlyStats.holidays + monthlyStats.optionalHolidays}
            </p>
            <p className="text-xs text-purple-600 mt-0.5">
              {monthlyStats.holidays} Mandatory, {monthlyStats.optionalHolidays}{" "}
              Optional
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-indigo-700 flex items-center gap-1.5 mb-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Working Days
            </p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-900">
              {monthlyStats.workingDays}
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Scheduled work days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-green-700 flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Present Days
            </p>
            <p className="text-xl sm:text-2xl font-bold text-green-900">
              {monthlyStats.presentDays}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              of {monthlyStats.workingDays} working
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-amber-700 flex items-center gap-1.5 mb-1.5">
              <Coffee className="h-3.5 w-3.5" />
              Leaves
            </p>
            <p className="text-xl sm:text-2xl font-bold text-amber-900">
              {monthlyStats.leavesApproved + monthlyStats.leavesPending}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {monthlyStats.leavesApproved} Approved,{" "}
              {monthlyStats.leavesPending} Pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-yellow-700 flex items-center gap-1.5 mb-1.5">
              <Zap className="h-3.5 w-3.5" />
              Corrections
            </p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-900">
              {monthlyStats.correctionsPending +
                monthlyStats.correctionsApproved +
                monthlyStats.correctionsRejected}
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              {monthlyStats.correctionsPending} Pending,{" "}
              {monthlyStats.correctionsApproved} Approved,{" "}
              {monthlyStats.correctionsRejected} Rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-red-700 flex items-center gap-1.5 mb-1.5">
              <UserX className="h-3.5 w-3.5" />
              Absent
            </p>
            <p className="text-xl sm:text-2xl font-bold text-red-900">
              {monthlyStats.absentDays}
            </p>
            <p className="text-xs text-red-600 mt-0.5">Absent days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-cyan-700 flex items-center gap-1.5 mb-1.5">
              <Clock className="h-3.5 w-3.5" />
              Total Hours
            </p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-900">
              {safeToFixed(monthlyStats.totalWorkingHours)}
            </p>
            <p className="text-xs text-cyan-600 mt-0.5">Work hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-orange-700 flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Late Arrival/Early Leave
            </p>
            <p className="text-xl sm:text-2xl font-bold text-orange-900">
              {monthlyStats.lateArrivals + monthlyStats.earlyDepartures}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {monthlyStats.lateArrivals} Late Arrival,{" "}
              {monthlyStats.earlyDepartures} Early Leave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-teal-700 flex items-center gap-1.5 mb-1.5">
              <Timer className="h-3.5 w-3.5" />
              Overtime Hours
            </p>
            <p className="text-xl sm:text-2xl font-bold text-teal-900">
              {safeToFixed(monthlyStats.overtimeHours)}
            </p>
            <p className="text-xs text-teal-600 mt-0.5">Extra hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-3 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-gray-700 py-1 sm:py-2 text-[10px] sm:text-sm"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Days */}
              <div className="space-y-0.5 sm:space-y-3">
                {weeks.length > 0 ? (
                  weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="grid grid-cols-7 gap-0.5 sm:gap-3"
                    >
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const day = week[dayIndex];
                        if (!day) {
                          return (
                            <div
                              key={dayIndex}
                              className="border rounded sm:rounded-lg p-0.5 sm:p-2 min-h-[35px] sm:min-h-[100px] bg-gray-50"
                            />
                          );
                        }

                        const isToday =
                          formatDateToYYYYMMDD(day.date) ===
                          formatDateToYYYYMMDD(new Date());

                        return (
                          <Dialog key={day.dateStr}>
                            <DialogTrigger asChild>
                              <div
                                className={cn(
                                  "border rounded sm:rounded-lg p-0.5 sm:p-2 min-h-[35px] sm:min-h-[100px] flex flex-col cursor-pointer transition-colors hover:opacity-90 overflow-hidden",
                                  getDayColorClasses(day.status),
                                  isToday &&
                                    "ring-4 ring-blue-500 ring-offset-2 border-blue-600 border-2"
                                )}
                              >
                                {/* Mobile: Only show day number and color */}
                                <div className="flex items-start sm:items-center justify-between mb-0 sm:mb-1 gap-1 sm:gap-2 min-w-0">
                                  <span
                                    className={cn(
                                      "font-semibold text-xs sm:text-base flex-shrink-0",
                                      isToday && "font-bold"
                                    )}
                                  >
                                    {day.dayNumber}
                                  </span>
                                  {/* Hide badge on mobile, show on larger screens */}
                                  <span className="hidden sm:inline-flex flex-shrink-0">
                                    <Badge
                                      variant={
                                        day.status === "present"
                                          ? "default"
                                          : day.status === "absent"
                                          ? "destructive"
                                          : day.status === "holiday"
                                          ? "default"
                                          : day.status === "on_leave" ||
                                            day.status === "leave_pending"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={cn(
                                        "text-[10px] px-1.5 py-0.5 whitespace-nowrap",
                                        day.status === "present"
                                          ? day.hasCorrection &&
                                            day.correctionStatus === "PENDING"
                                            ? "bg-yellow-500 text-white"
                                            : day.hasCorrection &&
                                              day.correctionStatus ===
                                                "APPROVED"
                                            ? "bg-teal-500 text-white"
                                            : day.hasCorrection &&
                                              day.correctionStatus ===
                                                "REJECTED"
                                            ? "bg-pink-500 text-white"
                                            : "bg-green-500 text-white"
                                          : day.status === "absent"
                                          ? "bg-red-500 text-white"
                                          : day.status === "holiday"
                                          ? "bg-purple-500 text-white"
                                          : day.status === "on_leave"
                                          ? "bg-blue-500 text-white"
                                          : day.status === "leave_pending"
                                          ? "bg-orange-500 text-white"
                                          : day.status === "correction_pending"
                                          ? "bg-yellow-500 text-white"
                                          : day.status === "correction_approved"
                                          ? "bg-teal-500 text-white"
                                          : day.status === "correction_rejected"
                                          ? "bg-pink-500 text-white"
                                          : ""
                                      )}
                                    >
                                      {day.label.length > 10
                                        ? day.label.substring(0, 10) + "..."
                                        : day.label}
                                    </Badge>
                                  </span>
                                </div>
                                {/* Hide text content on mobile, show on larger screens */}
                                <div className="hidden sm:block text-xs mt-auto space-y-0.5 overflow-hidden">
                                  {day.holidayName && (
                                    <p className="truncate font-semibold text-purple-700 leading-tight">
                                      {day.holidayName}
                                    </p>
                                  )}
                                  {day.leaveType && (
                                    <p className="truncate font-semibold leading-tight">
                                      {day.leaveType}
                                    </p>
                                  )}
                                  {day.clockIn && (
                                    <p className="truncate leading-tight">
                                      In:{" "}
                                      {new Date(day.clockIn).toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                      {day.isLate && (
                                        <span className="text-orange-600 ml-1">
                                          (Late)
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  {day.clockOut && (
                                    <p className="truncate leading-tight">
                                      Out:{" "}
                                      {new Date(
                                        day.clockOut
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      {day.isEarlyLeave && (
                                        <span className="text-orange-600 ml-1">
                                          (Early)
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </DialogTrigger>
                            {/* Show dialog on all devices for details */}
                            <DialogContent className="max-w-[90vw] sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between text-base">
                                  <span>{formatDateDisplay(day.dateStr)}</span>
                                  <Badge
                                    variant={
                                      day.status === "present"
                                        ? "default"
                                        : day.status === "absent"
                                        ? "destructive"
                                        : day.status === "holiday"
                                        ? "default"
                                        : day.status === "on_leave" ||
                                          day.status === "leave_pending"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={cn(
                                      day.status === "present"
                                        ? day.hasCorrection &&
                                          day.correctionStatus === "PENDING"
                                          ? "bg-yellow-500 text-white"
                                          : day.hasCorrection &&
                                            day.correctionStatus === "APPROVED"
                                          ? "bg-teal-500 text-white"
                                          : day.hasCorrection &&
                                            day.correctionStatus === "REJECTED"
                                          ? "bg-pink-500 text-white"
                                          : "bg-green-500 text-white"
                                        : day.status === "absent"
                                        ? "bg-red-500 text-white"
                                        : day.status === "holiday"
                                        ? "bg-purple-500 text-white"
                                        : day.status === "on_leave"
                                        ? "bg-blue-500 text-white"
                                        : day.status === "leave_pending"
                                        ? "bg-orange-500 text-white"
                                        : day.status === "correction_pending"
                                        ? "bg-yellow-500 text-white"
                                        : day.status === "correction_approved"
                                        ? "bg-teal-500 text-white"
                                        : day.status === "correction_rejected"
                                        ? "bg-pink-500 text-white"
                                        : ""
                                    )}
                                  >
                                    {day.label}
                                  </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                  {(() => {
                                    const calendarDay = getCalendarDayInfo(
                                      day.dateStr
                                    );
                                    return (
                                      calendarDay?.calendar_reason ||
                                      "Day details"
                                    );
                                  })()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3">
                                {day.holidayName && (
                                  <div>
                                    <p className="text-sm font-medium mb-1 text-purple-700">
                                      Holiday:
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {day.holidayName}
                                    </p>
                                  </div>
                                )}
                                {day.leaveType && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">
                                      Leave Type:
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {day.leaveType}
                                    </p>
                                  </div>
                                )}
                                {day.clockIn && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">
                                      Clock In:
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(day.clockIn).toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                      {day.isLate && (
                                        <span className="text-orange-600 ml-2">
                                          (Late)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                                {day.clockOut && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">
                                      Clock Out:
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(
                                        day.clockOut
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      {day.isEarlyLeave && (
                                        <span className="text-orange-600 ml-2">
                                          (Early Leave)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                                {day.hasCorrection && day.correctionRequest && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">
                                      Correction Request:
                                    </p>
                                    <div className="space-y-1">
                                      <Badge
                                        variant={
                                          day.correctionStatus === "PENDING"
                                            ? "default"
                                            : day.correctionStatus ===
                                              "APPROVED"
                                            ? "default"
                                            : "destructive"
                                        }
                                        className={
                                          day.correctionStatus === "PENDING"
                                            ? "bg-yellow-500 text-white"
                                            : day.correctionStatus ===
                                              "APPROVED"
                                            ? "bg-teal-500 text-white"
                                            : "bg-pink-500 text-white"
                                        }
                                      >
                                        {day.correctionStatus}
                                      </Badge>
                                      {day.correctionRequest
                                        .requested_check_in && (
                                        <p className="text-xs text-gray-600">
                                          Requested:{" "}
                                          {new Date(
                                            day.correctionRequest.requested_check_in
                                          ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          -{" "}
                                          {new Date(
                                            day.correctionRequest.requested_check_out
                                          ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      )}
                                      {day.correctionRequest.reason && (
                                        <p className="text-xs text-gray-600">
                                          Reason: {day.correctionRequest.reason}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {!day.clockIn &&
                                  !day.holidayName &&
                                  !day.leaveType &&
                                  !day.hasCorrection && (
                                    <p className="text-sm text-gray-600">
                                      {day.status === "absent"
                                        ? "No attendance recorded for this working day"
                                        : "No details available for this day"}
                                    </p>
                                  )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No calendar data available for this month</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm font-semibold mb-3">Legend:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                <span className="text-sm">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                <span className="text-sm">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
                <span className="text-sm">Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
                <span className="text-sm">Weekly Off</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                <span className="text-sm">On Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
                <span className="text-sm">Leave Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400"></div>
                <span className="text-sm">Correction Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-teal-100 border border-teal-400"></div>
                <span className="text-sm">Correction Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-pink-100 border border-pink-400"></div>
                <span className="text-sm">Correction Rejected</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCalendarPage;

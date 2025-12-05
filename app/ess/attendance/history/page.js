"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SelectMonth from "@/components/common/SelectMonth";
import { Download } from "lucide-react";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatTime24Hour } from "@/lib/dateTimeUtil";
import { getTodayDate, formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";

const AttendanceHistoryPage = () => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [loading, setLoading] = useState(true);
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async (employeeId, month) => {
    try {
      const url = `/employees/${employeeId}/calendar/attendance/monthly?month=${month}`;
      const res = await externalApiClient.get(url);
      const calendar = res.data?.calendar || [];
      // Map calendar days to attendance records format
      // Show all days including weekly offs and holidays
      const attendanceRecords = calendar
        .map((day) => ({
          ...(day.attendance || {}),
          date: day.date,
          day_status: day.day_status,
          calendar_reason: day.calendar_reason,
          calendar_type: day.calendar_type,
          leaves: day.leaves,
          is_working_day: day.is_working_day,
        }))
        .filter((day) => {
          return new Date(day.date) <= new Date(getTodayDate());
        })
        .sort((a, b) => {
          // Sort by date in descending order (newest first)
          return new Date(b.date) - new Date(a.date);
        });
      console.log("attendanceRecords", attendanceRecords);
      setAttendanceHistory(attendanceRecords);
      return attendanceRecords;
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      setAttendanceHistory([]);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (user?.empid) {
      setLoading(true);
      fetchAttendanceHistory(user.empid, selectedMonth).finally(() =>
        setLoading(false)
      );
    }
  }, [user?.empid, selectedMonth, fetchAttendanceHistory]);

  const getStatusBadge = (status, dayStatus, calendarType) => {
    // Check if it's a holiday first (takes precedence)
    if (calendarType === "HOLIDAY" || calendarType === "OPTIONAL_HOLIDAY") {
      return <Badge className="bg-purple-500 text-white">Holiday</Badge>;
    }

    // Use day_status if available, otherwise fall back to status
    const displayStatus = dayStatus || status;
    switch (displayStatus?.toUpperCase()) {
      case "PRESENT":
      case "P":
        return <Badge className="bg-green-500 text-white">Present</Badge>;
      case "ABSENT":
      case "A":
        return <Badge className="bg-red-500 text-white">Absent</Badge>;
      case "ON_LEAVE":
        return <Badge className="bg-blue-500 text-white">On Leave</Badge>;
      case "LEAVE_PENDING":
        return (
          <Badge className="bg-orange-500 text-white">Leave Pending</Badge>
        );
      case "EXPECTED":
        return <Badge className="bg-gray-500 text-white">Expected</Badge>;
      case "NON_WORKING":
        return <Badge className="bg-gray-500 text-white">Non-Working</Badge>;
      case "LATE":
        return <Badge className="bg-orange-500 text-white">Late</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-yellow-500 text-white">Half Day</Badge>;
      case "EARLY_LEAVE":
        return <Badge className="bg-blue-500 text-white">Early Leave</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">-</Badge>;
    }
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading attendance history...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-1">
            Attendance History
          </h2>
          <p className="text-gray-600 text-sm">
            View your attendance records for the selected month
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <SelectMonth
            value={selectedMonth}
            onValueChange={setSelectedMonth}
            placeholder="Select month"
          />
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-additional"
                checked={showAdditionalColumns}
                onCheckedChange={setShowAdditionalColumns}
              />
              <Label
                htmlFor="show-additional"
                className="text-sm font-normal cursor-pointer"
              >
                Show additional columns
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Late (min)</TableHead>
                  <TableHead>Early Leave (min)</TableHead>
                  {showAdditionalColumns && (
                    <>
                      <TableHead>Shift ID</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Overtime</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceHistory.length > 0 ? (
                  attendanceHistory.map((record, index) => {
                    const clockIn = record.check_in_time;
                    const clockOut = record.check_out_time;
                    // Use total_work_hours if available, otherwise calculate
                    let hours = record.total_work_hours || 0;
                    // Ensure hours is a number
                    hours =
                      typeof hours === "string"
                        ? parseFloat(hours)
                        : Number(hours);
                    if (isNaN(hours) || (!hours && clockIn && clockOut)) {
                      const diff = new Date(clockOut) - new Date(clockIn);
                      hours = diff / (1000 * 60 * 60);
                    }
                    hours = isNaN(hours) ? 0 : hours;

                    // Calculate break hours from break_start_time and break_end_time
                    let breakHours = 0;
                    if (record.break_start_time && record.break_end_time) {
                      const breakDiff =
                        new Date(record.break_end_time) -
                        new Date(record.break_start_time);
                      breakHours = breakDiff / (1000 * 60 * 60);
                    } else if (record.break_hours) {
                      breakHours =
                        typeof record.break_hours === "string"
                          ? parseFloat(record.break_hours)
                          : Number(record.break_hours);
                    } else if (record.break_minutes) {
                      breakHours =
                        (typeof record.break_minutes === "string"
                          ? parseFloat(record.break_minutes)
                          : Number(record.break_minutes)) / 60;
                    }
                    breakHours = isNaN(breakHours) ? 0 : breakHours;

                    // Get late and early leave minutes
                    const lateMinutes =
                      record.late_minutes ||
                      record.lateMinutes ||
                      record.late_duration_minutes ||
                      0;
                    const earlyLeaveMinutes =
                      record.early_leave_minutes ||
                      record.earlyLeaveMinutes ||
                      record.early_leave_duration_minutes ||
                      0;

                    // Check if it's a non-working day or holiday
                    // Keep future dates (EXPECTED status) showing working hours as before
                    // Future working days have day_status: "EXPECTED" and should show working hours
                    const isNonWorking =
                      record.day_status === "EXPECTED"
                        ? false
                        : record.calendar_type === "HOLIDAY" ||
                          record.calendar_type === "OPTIONAL_HOLIDAY" ||
                          record.calendar_type === "WEEKLY_OFF" ||
                          record.day_status === "NON_WORKING";

                    const isWeeklyOff = record.calendar_type === "WEEKLY_OFF";

                    return (
                      <TableRow
                        key={index}
                        className={isWeeklyOff ? "bg-purple-50" : ""}
                      >
                        <TableCell>{formatDateDisplay(record.date)}</TableCell>
                        <TableCell>{getDayName(record.date)}</TableCell>
                        <TableCell>
                          {getStatusBadge(
                            record.status,
                            record.day_status,
                            record.calendar_type
                          )}
                        </TableCell>
                        <TableCell>{formatTime24Hour(clockIn)}</TableCell>
                        <TableCell>{formatTime24Hour(clockOut)}</TableCell>
                        <TableCell>
                          {clockIn && clockOut && hours > 0
                            ? `${hours.toFixed(1)}h`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {lateMinutes > 0 ? (
                            <Badge className="bg-orange-500 text-white">
                              {lateMinutes} min
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {earlyLeaveMinutes > 0 ? (
                            <Badge className="bg-blue-500 text-white">
                              {earlyLeaveMinutes} min
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        {showAdditionalColumns && (
                          <>
                            <TableCell>
                              {record.shiftid || record.shift_id || "-"}
                            </TableCell>
                            <TableCell>
                              {breakHours > 0
                                ? `${breakHours.toFixed(1)}h`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {record.overtime_hours
                                ? `${(typeof record.overtime_hours === "string"
                                    ? parseFloat(record.overtime_hours)
                                    : Number(record.overtime_hours) || 0
                                  ).toFixed(1)}h`
                                : "-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={showAdditionalColumns ? 11 : 8}
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
    </div>
  );
};

export default AttendanceHistoryPage;

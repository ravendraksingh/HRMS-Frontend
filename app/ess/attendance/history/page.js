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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";

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

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async (employeeId, month) => {
    try {
      const startDate = `${month}-01`;
      const lastDayOfMonth = new Date(
        new Date(`${month}-01`).setMonth(
          new Date(`${month}-01`).getMonth() + 1
        ) - 1
      );
      const endDate = formatDateToYYYYMMDD(lastDayOfMonth);

      const res = await externalApiClient.get(
        `/attendance?empid=${employeeId}&start_date=${startDate}&end_date=${endDate}`
      );
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.attendance || res.data?.data || [];
      setAttendanceHistory(data);
      return data;
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

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PRESENT":
      case "P":
        return <Badge className="bg-green-500 text-white">Present</Badge>;
      case "ABSENT":
      case "A":
        return <Badge variant="destructive">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-orange-500 text-white">Late</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-yellow-500 text-white">Half Day</Badge>;
      case "EARLY_LEAVE":
        return <Badge className="bg-blue-500 text-white">Early Leave</Badge>;
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
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
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
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDateDisplay(
                            record.attendance_date ||
                              record.date ||
                              record.work_date
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{formatTime(clockIn)}</TableCell>
                        <TableCell>{formatTime(clockOut)}</TableCell>
                        <TableCell>{hours.toFixed(1)}h</TableCell>
                        <TableCell>
                          {breakHours > 0 ? `${breakHours.toFixed(1)}h` : "-"}
                        </TableCell>
                        <TableCell>
                          {record.overtime_hours
                            ? `${(typeof record.overtime_hours === "string"
                                ? parseFloat(record.overtime_hours)
                                : Number(record.overtime_hours) || 0
                              ).toFixed(1)}h`
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
    </div>
  );
};

export default AttendanceHistoryPage;


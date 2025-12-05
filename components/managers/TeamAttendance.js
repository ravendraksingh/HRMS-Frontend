"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { CalendarClock, Download, RefreshCw } from "lucide-react";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { formatTime24Hour, getTodayDate } from "@/lib/dateTimeUtil";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function TeamAttendance({ teamMembers, managerId }) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [dateRange, setDateRange] = useState({
    start_date: getTodayDate(),
    end_date: getTodayDate(),
  });
  const [viewMode, setViewMode] = useState("today"); // 'today' or 'range'

  console.log("teamMembers", teamMembers);
  useEffect(() => {
    if (teamMembers && teamMembers.length > 0) {
      fetchAttendance();
    }
  }, [teamMembers, selectedDate, dateRange, viewMode]);

  useEffect(() => {
    filterAttendance();
  }, [attendance, selectedEmployee]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      // Use manager-specific attendance endpoint
      let url = `/managers/${managerId}/employees/attendance`;
      const params = new URLSearchParams();

      if (viewMode === "today") {
        params.append("start_date", selectedDate);
        params.append("end_date", selectedDate);
      } else {
        params.append("start_date", dateRange.start_date);
        params.append("end_date", dateRange.end_date);
      }

      // Add employee filter if specific employee is selected
      if (selectedEmployee !== "all") {
        params.append("employee_id", selectedEmployee);
      }

      url += `?${params.toString()}`;

      const res = await externalApiClient.get(url);
      const attendanceData = res.data?.attendance || res.data || [];

      // Ensure it's an array
      const teamAttendance = Array.isArray(attendanceData)
        ? attendanceData
        : [];

      console.log("teamAttendance", teamAttendance);
      setAttendance(teamAttendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    let filtered = [...attendance];

    if (selectedEmployee !== "all") {
      filtered = filtered.filter((a) => a.empid === selectedEmployee);
    }

    setFilteredAttendance(filtered);
  };

  const getStatusBadge = (record) => {
    const clockIn = record.check_in_time;
    const clockOut = record.check_out_time;
    const status = record.status?.toLowerCase();

    if (status === "present" || status === "p") {
      return <Badge className="bg-green-500 text-white">Present</Badge>;
    }
    if (status === "absent" || status === "a") {
      return <Badge variant="destructive">Absent</Badge>;
    }
    if (status === "leave" || status === "l") {
      return <Badge className="bg-blue-500 text-white">On Leave</Badge>;
    }
    if (status === "late") {
      return <Badge className="bg-orange-500 text-white">Late</Badge>;
    }
    if (clockIn && !clockOut) {
      return <Badge className="bg-yellow-500 text-white">In Progress</Badge>;
    }
    return <Badge variant="secondary">-</Badge>;
  };

  const getEmployeeName = (employeeId) => {
    const member = teamMembers.find((m) => m.empid === employeeId);
    return member?.name || `Employee ${employeeId}`;
  };

  const exportAttendance = () => {
    // Simple CSV export
    const headers = [
      "Employee Name",
      "Employee ID",
      "Date",
      "Status",
      "Clock In",
      "Clock Out",
    ];
    const rows = filteredAttendance.map((a) => [
      getEmployeeName(a.empid),
      a.empid,
      a.attendance_date || selectedDate,
      a.status || "-",
      a.check_in_time || "-",
      a.check_out_time || "-",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-attendance-${selectedDate || dateRange.start_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid grid-cols-1 gap-4 mb-4 ${
              viewMode === "range" ? "md:grid-cols-4" : "md:grid-cols-4"
            }`}
          >
            <div className="space-y-2">
              <Label>View Mode</Label>
              <Select
                value={viewMode}
                onValueChange={(value) => {
                  setViewMode(value);
                  if (value === "today") {
                    setSelectedDate(getTodayDate());
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="range">Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === "today" ? (
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end_date: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.empid} value={String(member.empid)}>
                      {member.employee_name || member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={fetchAttendance} variant="outline" size="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={exportAttendance} variant="outline" size="default">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Attendance</CardTitle>
            <Badge variant="secondary">
              {filteredAttendance.length} record(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : filteredAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>{record.empid}</TableCell>
                        <TableCell>{getEmployeeName(record.empid)||"-"}</TableCell>
                        <TableCell>
                          {formatDateDisplay(record.attendance_date)}
                        </TableCell>
                        <TableCell>{getStatusBadge(record)}</TableCell>
                        <TableCell>
                          {record.check_in_time
                            ? formatTime24Hour(record.check_in_time)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {record.check_out_time
                            ? formatTime24Hour(record.check_out_time)
                            : "-"}
                        </TableCell>
                        <TableCell>{record.total_work_hours}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarClock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No attendance records found for the selected criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

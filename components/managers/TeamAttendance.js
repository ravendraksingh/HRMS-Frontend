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
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { formatTime } from "@/lib/dateTimeUtil";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function TeamAttendance({ teamMembers, managerId }) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [viewMode, setViewMode] = useState("today"); // 'today' or 'range'

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
      let url = `/managers/${managerId}/attendance`;
      const params = new URLSearchParams();

      if (viewMode === "today") {
        params.append("from", selectedDate);
        params.append("to", selectedDate);
      } else {
        params.append("from", dateRange.from);
        params.append("to", dateRange.to);
      }

      // Add employee filter if specific employee is selected
      if (selectedEmployee !== "all") {
        params.append("employee_id", selectedEmployee);
      }

      url += `?${params.toString()}`;

      const res = await externalApiClient.get(url);
      const attendanceData = res.data?.attendance || res.data || [];
      
      // Ensure it's an array
      const teamAttendance = Array.isArray(attendanceData) ? attendanceData : [];

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
      filtered = filtered.filter(
        (a) => (a.employee_id || a.id) === selectedEmployee
      );
    }

    setFilteredAttendance(filtered);
  };

  const getStatusBadge = (record) => {
    const clockIn = record.clock_in || record.clockin_time;
    const clockOut = record.clock_out || record.clockout_time;
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
    const member = teamMembers.find(
      (m) => (m.employee_id || m.id) === employeeId
    );
    return member?.employee_name || member?.name || employeeId;
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
      getEmployeeName(a.employee_id || a.id),
      a.employee_id || a.id,
      a.date || selectedDate,
      a.status || "-",
      a.clock_in || a.clockin_time || "-",
      a.clock_out || a.clockout_time || "-",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-attendance-${selectedDate || dateRange.from}.csv`;
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>View Mode</Label>
              <Select
                value={viewMode}
                onValueChange={(value) => {
                  setViewMode(value);
                  if (value === "today") {
                    setSelectedDate(new Date().toISOString().split("T")[0]);
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
                    value={dateRange.from}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, from: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, to: e.target.value })
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
                    <SelectItem
                      key={member.employee_id || member.id}
                      value={String(member.employee_id || member.id)}
                    >
                      {member.employee_name || member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record, index) => {
                    const clockIn = record.clock_in || record.clockin_time;
                    const clockOut = record.clock_out || record.clockout_time;
                    let workingHours = "-";

                    if (clockIn && clockOut) {
                      const start = new Date(clockIn);
                      const end = new Date(clockOut);
                      const diff = end - start;
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      workingHours = `${hours}h ${minutes}m`;
                    } else if (clockIn) {
                      const start = new Date(clockIn);
                      const now = new Date();
                      const diff = now - start;
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      workingHours = `${hours}h ${minutes}m (ongoing)`;
                    }

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {getEmployeeName(record.employee_id || record.id)}
                        </TableCell>
                        <TableCell>{record.employee_id || record.id}</TableCell>
                        <TableCell>
                          {formatDateDisplay(record.date || selectedDate)}
                        </TableCell>
                        <TableCell>{getStatusBadge(record)}</TableCell>
                        <TableCell>
                          {clockIn
                            ? formatTime(clockIn, "hh:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {clockOut
                            ? formatTime(clockOut, "hh:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>{workingHours}</TableCell>
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


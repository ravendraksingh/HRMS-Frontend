"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarClock } from "lucide-react";
import { formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/emsUtil";

const TodayAttendancePage = () => {
  const { user } = useAuth();

  // State
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(async (employeeId) => {
    try {
      const today = formatDateToYYYYMMDD(new Date());
      const res = await externalApiClient.get(
        `/attendance?attendance_date=${today}&empid=${employeeId}`
      );
      const attendanceData = res.data?.attendance?.[0];
      console.log("Today's attendance:", attendanceData);
      setTodayAttendance(attendanceData);
      return attendanceData;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setTodayAttendance(null);
      throw error;
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(
    async (employeeId) => {
      setLoading(true);
      try {
        await fetchTodayAttendance(employeeId);
      } catch (error) {
        console.error("Error refreshing attendance data:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchTodayAttendance]
  );

  // Clock in handler
  const handleClockIn = useCallback(
    async (employeeId) => {
      try {
        setClocking(true);
        const today = formatDateToYYYYMMDD(new Date());
        const now = new Date();
        const clockInTime = `${today} ${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;

        await externalApiClient.post("/attendance/clockin", {
          empid: employeeId,
          attendance_date: today,
          check_in_time: clockInTime,
        });
        toast.success("Clocked in successfully!");
        await fetchTodayAttendance(employeeId);
      } catch (error) {
        const errorMsg = getErrorMessage(error, "Failed to clock in");
        if (
          errorMsg?.includes("table") ||
          errorMsg?.includes("doesn't exist")
        ) {
          toast.error(
            "Attendance system not configured. Please contact administrator."
          );
        } else {
          toast.error(errorMsg);
        }
      } finally {
        setClocking(false);
      }
    },
    [fetchTodayAttendance]
  );

  // Clock out handler
  const handleClockOut = useCallback(
    async (employeeId) => {
      try {
        setClocking(true);
        const today = formatDateToYYYYMMDD(new Date());
        const now = new Date();
        const clockOutTime = `${today} ${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;

        await externalApiClient.post("/attendance/clockout", {
          empid: employeeId,
          attendance_date: today,
          check_out_time: clockOutTime,
        });
        toast.success("Clocked out successfully!");
        await fetchTodayAttendance(employeeId);
      } catch (error) {
        const errorMsg = getErrorMessage(error, "Failed to clock out");
        toast.error(errorMsg);
      } finally {
        setClocking(false);
      }
    },
    [fetchTodayAttendance]
  );

  useEffect(() => {
    if (user?.empid) {
      const employeeId = user?.empid;
      refreshData(employeeId);
    }
  }, [user?.empid, refreshData]);

  const getAttendanceStatus = () => {
    if (!todayAttendance)
      return {
        status: "not_marked",
        label: "Not Clocked In",
        color: "secondary",
      };
    // Use check_in_time and check_out_time from API
    const clockInTime = todayAttendance.check_in_time;
    const clockOutTime = todayAttendance.check_out_time;

    if (clockInTime && !clockOutTime)
      return { status: "present", label: "Present", color: "default" };
    if (clockInTime && clockOutTime)
      return { status: "completed", label: "Completed", color: "default" };
    return { status: "absent", label: "Absent", color: "destructive" };
  };

  const attendanceStatus = getAttendanceStatus();
  // Check if can clock in/out based on check_in_time and check_out_time
  const canClockIn = !todayAttendance?.check_in_time;
  const canClockOut =
    todayAttendance?.check_in_time && !todayAttendance?.check_out_time;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading attendance...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-1">
          Today's Attendance
        </h2>
        <p className="text-gray-600 text-sm">
          View and manage your attendance for today
        </p>
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
              {todayAttendance?.check_in_time && (
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Clock In:</span>{" "}
                  {new Date(todayAttendance.check_in_time).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              )}
              {todayAttendance?.check_out_time && (
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Clock Out:</span>{" "}
                  {new Date(todayAttendance.check_out_time).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {canClockIn && (
                <Button
                  onClick={() =>
                    handleClockIn(user?.empid || user?.employee_id)
                  }
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
                  onClick={() => handleClockOut(user?.empid)}
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
    </div>
  );
};

export default TodayAttendancePage;


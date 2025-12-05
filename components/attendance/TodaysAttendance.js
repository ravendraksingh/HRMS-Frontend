"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarClock, AlertCircle } from "lucide-react";
import { formatDateToYYYYMMDD, getTodayDate } from "@/lib/dateTimeUtil";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/emsUtil";

const TodaysAttendance = ({
  todayData: propTodayData,
  employeeId: propEmployeeId,
  showActions = true,
  onRefresh,
  loading: propLoading,
  showHeader = true,
  className = "",
}) => {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState(propTodayData);
  const [loading, setLoading] = useState(propLoading || false);
  const [clocking, setClocking] = useState(false);

  const employeeId = propEmployeeId || user?.empid;
  const isControlled = propTodayData !== undefined;
  const isLoading = propLoading !== undefined ? propLoading : loading;

  console.log("todayData", todayData);

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(
    async (empId) => {
      try {
        const res = await externalApiClient.get(
          `/employees/${empId}/attendance/today`
        );
        const data = res.data;
        if (!isControlled) {
          setTodayData(data);
        }
        if (onRefresh) {
          onRefresh(data);
        }
        return data;
      } catch (error) {
        console.error("Error fetching attendance:", error);
        if (!isControlled) {
          setTodayData(null);
        }
        throw error;
      }
    },
    [isControlled, onRefresh]
  );

  // Clock in handler
  const handleClockIn = useCallback(
    async (empId) => {
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

        await externalApiClient.post(`/employees/${empId}/attendance/clockin`, {
          empid: empId,
          attendance_date: today,
          check_in_time: clockInTime,
        });
        toast.success("Clocked in successfully!");
        await fetchTodayAttendance(empId);
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
    async (empId) => {
      try {
        setClocking(true);
        const today = getTodayDate();
        const now = new Date();
        const clockOutTime = `${today} ${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;

        await externalApiClient.post(
          `/employees/${empId}/attendance/clockout`,
          {
            empid: empId,
            attendance_date: today,
            check_out_time: clockOutTime,
          }
        );
        toast.success("Clocked out successfully!");
        await fetchTodayAttendance(empId);
      } catch (error) {
        const errorMsg = getErrorMessage(error, "Failed to clock out");
        toast.error(errorMsg);
      } finally {
        setClocking(false);
      }
    },
    [fetchTodayAttendance]
  );

  const getAttendanceStatus = () => {
    const data = isControlled ? propTodayData : todayData;
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

    // Handle non-working day status
    if (dayStatus === "NON_WORKING") {
      return {
        status: "non_working",
        label: "Non-Working",
        color: "secondary",
        reason: data.reason,
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
  const data = isControlled ? propTodayData : todayData;
  const attendance = data?.attendance;

  // Check if can clock in/out based on check_in_time and check_out_time
  const canClockIn =
    data?.is_working_day &&
    !data?.leave &&
    (!attendance || !attendance.check_in_time);
  const canClockOut =
    data?.is_working_day &&
    attendance?.check_in_time &&
    !attendance?.check_out_time;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Loading attendance...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge
              variant={attendanceStatus.color}
              className={
                attendanceStatus.status === "present" ||
                attendanceStatus.status === "completed"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : attendanceStatus.status === "leave_pending"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : attendanceStatus.status === "on_leave"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : attendanceStatus.status === "non_working"
                  ? "bg-gray-500 hover:bg-gray-600 text-white"
                  : attendanceStatus.status === "not_marked"
                  ? "bg-gray-500 hover:bg-gray-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }
            >
              {attendanceStatus.label}
            </Badge>
            {attendance?.check_in_time && (
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Clock In:</span>{" "}
                {new Date(attendance.check_in_time).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            )}
            {attendance?.check_out_time && (
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Clock Out:</span>{" "}
                {new Date(attendance.check_out_time).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            )}
            {attendanceStatus.leave && (
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Leave:</span>{" "}
                {attendanceStatus.leave.leave_type_name} (
                {attendanceStatus.leave.status})
              </div>
            )}
            {attendanceStatus.status === "non_working" &&
              attendanceStatus.reason && (
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Reason:</span>{" "}
                  {attendanceStatus.reason}
                </div>
              )}
          </div>
          {showActions && (
            <div className="flex gap-2 w-full sm:w-auto">
              {canClockIn && (
                <Button
                  onClick={() => handleClockIn(employeeId)}
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
                  onClick={() => handleClockOut(employeeId)}
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
          )}
        </div>
        {/* Leave Information */}
        {data?.leave && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-800 mb-1">
              Leave Information
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>
                <span className="font-medium">Type:</span>{" "}
                {data.leave.leave_type_name}
              </p>
              <p>
                <span className="font-medium">Period:</span>{" "}
                {new Date(data.leave.start_date).toLocaleDateString()} -{" "}
                {new Date(data.leave.end_date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Status:</span> {data.leave.status}
              </p>
              {data.leave.reason && (
                <p>
                  <span className="font-medium">Reason:</span>{" "}
                  {data.leave.reason}
                </p>
              )}
            </div>
          </div>
        )}
        {/* Late Clock-In Note */}
        {attendance?.check_in_time && attendance?.is_late === "Y" && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                Late Clock-In
              </p>
              <p className="text-xs text-orange-700 mt-1">
                You clocked in late today. Please ensure you arrive on time for
                future shifts.
              </p>
            </div>
          </div>
        )}
        {/* Non-working day notice */}
        {data && !data.is_working_day && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700">
              {data.reason || "Today is not a working day"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysAttendance;

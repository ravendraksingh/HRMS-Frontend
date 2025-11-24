"use client";

import { useEffect, useState, useCallback } from "react";
import { ChartAreaInteractive } from "@/components/attendance/ChartDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle,
  Coffee,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";

const AttendanceStatisticsPage = () => {
  const { user } = useAuth();
  const [monthlyStats, setMonthlyStats] = useState({
    onTimePercentage: 0,
    latePercentage: 0,
    totalBreakHours: 0,
    totalWorkingHours: 0,
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateArrivals: 0,
    earlyDepartures: 0,
    overtimeHours: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [loading, setLoading] = useState(true);

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 1) => {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    return isNaN(num) ? "0.0" : num.toFixed(decimals);
  };

  // Fetch monthly stats
  const fetchMonthlyStats = useCallback(async (employeeId, month) => {
    try {
      const res = await externalApiClient.get(
        `/reports/attendance/monthly?month=${month}&empid=${employeeId}`
      );
      const data = res.data;
      // Convert string values to numbers to ensure toFixed() works
      const parseNumber = (value) => {
        if (value === null || value === undefined) return 0;
        const num =
          typeof value === "string" ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
      };

      setMonthlyStats({
        onTimePercentage: parseNumber(data?.on_time_percentage),
        latePercentage: parseNumber(data?.late_percentage),
        totalBreakHours: parseNumber(data?.total_break_hours),
        totalWorkingHours: parseNumber(data?.total_working_hours),
        totalDays: parseNumber(data?.total_days),
        presentDays: parseNumber(data?.present_days || data?.days_present),
        absentDays: parseNumber(data?.absent_days),
        lateArrivals: parseNumber(data?.late_arrivals),
        earlyDepartures: parseNumber(data?.early_departures),
        overtimeHours: parseNumber(data?.overtime_hours),
      });
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
    }
  }, []);

  useEffect(() => {
    if (user?.empid) {
      setLoading(true);
      fetchMonthlyStats(user.empid, selectedMonth).finally(() =>
        setLoading(false)
      );
    }
  }, [user?.empid, selectedMonth, fetchMonthlyStats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-1">
            Attendance Statistics
          </h2>
          <p className="text-gray-600 text-sm">
            View detailed statistics and trends for the selected month
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
        </div>
      </div>

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
                <span className="font-bold">{monthlyStats.presentDays}</span>
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
                <span className="font-bold">{monthlyStats.latePercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-purple-600" />
                  <span>Total Break Hours</span>
                </div>
                <span className="font-bold">
                  {safeToFixed(monthlyStats.totalBreakHours)}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Overtime Hours</span>
                </div>
                <span className="font-bold">
                  {safeToFixed(monthlyStats.overtimeHours)}h
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
    </div>
  );
};

export default AttendanceStatisticsPage;


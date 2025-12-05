"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";
import TodaysAttendance from "@/components/attendance/TodaysAttendance";

const TodayAttendancePage = () => {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(async (employeeId) => {
    try {
      const res = await externalApiClient.get(
        `/employees/${employeeId}/attendance/today`
      );
      const data = res.data;
      console.log("Today's attendance data:", data);
      setTodayData(data);
      return data;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setTodayData(null);
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

  useEffect(() => {
    if (user?.empid) {
      const employeeId = user?.empid;
      refreshData(employeeId);
    }
  }, [user?.empid, refreshData]);

  const handleRefresh = (data) => {
    setTodayData(data);
  };

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

      <TodaysAttendance
        todayData={todayData}
        loading={loading}
        showActions={true}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default TodayAttendancePage;

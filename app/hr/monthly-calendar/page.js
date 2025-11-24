"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import SelectDepartment from "@/components/common/SelectDepartment";
import { Calendar, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MonthlyCalendarPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    scope: "organization", // 'organization', 'location', 'department'
    locationId: "",
    departmentId: "",
  });

  // Date state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );

  useEffect(() => {
    fetchDepartments();
    fetchLocations();
  }, []);

  useEffect(() => {
    // Only fetch if we have the required IDs
    if (filters.scope === "location" && filters.locationId) {
      fetchCalendar();
    } else if (filters.scope === "department" && filters.departmentId) {
      fetchCalendar();
    } else if (filters.scope === "organization") {
      fetchCalendar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.scope,
    filters.locationId,
    filters.departmentId,
    selectedYear,
    selectedMonth,
  ]);

  const fetchDepartments = async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const deptData = res.data?.departments || res.data || [];
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await externalApiClient.get("/locations");
      const locData = res.data?.locations || res.data || [];
      setLocations(Array.isArray(locData) ? locData : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchCalendar = async () => {
    // Validate required IDs based on scope
    if (filters.scope === "location" && !filters.locationId) {
      return;
    }
    if (filters.scope === "department" && !filters.departmentId) {
      return;
    }

    try {
      setLoading(true);

      // Build URL based on scope - using direct monthly calendar endpoints from API
      let url = "";

      if (filters.scope === "organization") {
        // Organization calendar doesn't require organizationId in path
        url = `/calendars/monthly/organization?year=${selectedYear}&month=${selectedMonth}`;
      } else if (filters.scope === "location") {
        url = `/calendars/monthly/location/${filters.locationId}?year=${selectedYear}&month=${selectedMonth}`;
      } else if (filters.scope === "department") {
        url = `/calendars/monthly/department/${filters.departmentId}?year=${selectedYear}&month=${selectedMonth}`;
      } else {
        return;
      }

      const res = await externalApiClient.get(url);

      setCalendarData(res.data);
      setSummary(res.data?.summary || null);
    } catch (error) {
      console.error("Error fetching calendar:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load calendar";
      toast.error(errorMessage);
      setCalendarData(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scope) => {
    setFilters((prev) => ({
      ...prev,
      scope,
      locationId: scope === "location" ? prev.locationId : "",
      departmentId: scope === "department" ? prev.departmentId : "",
    }));
  };


  const getDayTypeColor = (day) => {
    if (!day.is_working_day) {
      if (day.type === "HOLIDAY") {
        return "bg-red-100 border-red-300 text-red-800";
      } else if (day.type === "WEEKLY_OFF") {
        return "bg-gray-100 border-gray-300 text-gray-600";
      }
    }
    return "bg-green-50 border-green-200 text-green-800";
  };

  const getDayTypeBadge = (day) => {
    if (day.type === "HOLIDAY") {
      return <Badge variant="destructive">Holiday</Badge>;
    } else if (day.type === "WEEKLY_OFF") {
      return <Badge variant="secondary">Weekly Off</Badge>;
    }
    return <Badge variant="default">Working</Badge>;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Group calendar days by week (starting from Monday)
  const groupDaysByWeek = (days) => {
    if (!days || !Array.isArray(days)) return [];
    const weeks = [];
    let currentWeek = [];

    days.forEach((day, index) => {
      const date = new Date(day.date);
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
  };

  const calendarDays = calendarData?.calendar || [];
  const weeks = groupDaysByWeek(calendarDays);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Monthly Calendar
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage organization, location, and department calendars
        </p>
      </div>

      <OrganizationInfoCard />

      {/* Combined Filters, Month Navigation, and Summary */}
      <Card className="mb-4">
        <CardContent className="py-3 sm:py-4">
          {/* First Row: Month and Year Dropdowns - Mobile First */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Label className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                  Month:
                </Label>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 sm:h-8 flex-1 sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index + 1} value={String(index + 1)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                  Year:
                </Label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 sm:h-8 flex-1 sm:w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => {
                      const year = currentDate.getFullYear() - 5 + i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {calendarData?.calendar_name && (
                <p className="text-xs text-gray-600 truncate hidden sm:block ml-2">
                  {calendarData.calendar_name}
                </p>
              )}
            </div>
          </div>

          {/* Second Row: Filters */}
          <div className="flex flex-col gap-3 mb-3 pb-3 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-[50px]">
                  Scope:
                </Label>
                <Select value={filters.scope} onValueChange={handleScopeChange}>
                  <SelectTrigger className="h-9 sm:h-8 flex-1 sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filters.scope === "location" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-[70px]">
                    Location:
                  </Label>
                  <Select
                    value={filters.locationId}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, locationId: value }))
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-8 flex-1 sm:w-[160px]">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem
                          key={loc.locationid || loc.id}
                          value={String(loc.locationid || loc.id)}
                        >
                          {loc.name || loc.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filters.scope === "department" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-[50px]">
                    Dept:
                  </Label>
                  <Select
                    value={filters.departmentId}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, departmentId: value }))
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-8 flex-1 sm:w-[160px]">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.deptid || dept.id}
                          value={String(dept.deptid || dept.id)}
                        >
                          {dept.name || dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={fetchCalendar}
                disabled={loading}
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 w-full sm:w-auto"
              >
                {loading ? (
                  <Spinner size={14} className="mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Third Row: Summary */}
          {summary && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-base sm:text-xl font-bold">
                  {summary.total_days}
                </p>
                <p className="text-xs text-gray-600 mt-1">Total</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-xl font-bold text-green-600">
                  {summary.working_days}
                </p>
                <p className="text-xs text-gray-600 mt-1">Working</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-xl font-bold text-red-600">
                  {summary.holidays}
                </p>
                <p className="text-xs text-gray-600 mt-1">Holidays</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-xl font-bold text-gray-600">
                  {summary.weekly_offs}
                </p>
                <p className="text-xs text-gray-600 mt-1">Weekly Offs</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-xl font-bold text-orange-600">
                  {summary.optional_holidays || 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">Optional</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Spinner size={32} />
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </CardContent>
        </Card>
      ) : calendarDays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No calendar data available</p>
            <p className="text-sm mt-2">Please select filters and try again</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
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
                  {weeks.map((week, weekIndex) => (
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

                        const date = new Date(day.date);
                        const dayNumber = date.getDate();

                        return (
                          <Dialog key={day.date}>
                            <DialogTrigger asChild>
                              <div
                                className={`border rounded sm:rounded-lg p-0.5 sm:p-2 min-h-[35px] sm:min-h-[100px] flex flex-col cursor-pointer sm:cursor-default transition-colors hover:opacity-90 ${getDayTypeColor(
                                  day
                                )}`}
                              >
                                {/* Mobile: Only show day number and color */}
                                <div className="flex items-center justify-center sm:justify-between mb-0 sm:mb-1">
                                  <span className="font-semibold text-xs sm:text-base">
                                    {dayNumber}
                                  </span>
                                  {/* Hide badge on mobile, show on larger screens */}
                                  <span className="hidden sm:inline-block">
                                    {getDayTypeBadge(day)}
                                  </span>
                                </div>
                                {/* Hide text content on mobile, show on larger screens */}
                                <div className="hidden sm:block text-xs mt-2">
                                  <p className="font-medium truncate">{day.reason}</p>
                                  {day.holiday && (
                                    <p className="mt-1 text-red-700 truncate">
                                      {day.holiday.holiday_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </DialogTrigger>
                            {/* Show dialog on all screens for better UX */}
                            <DialogContent className="sm:hidden max-w-[90vw]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between text-base">
                                  <span>{formatDateDisplay(day.date)}</span>
                                  {getDayTypeBadge(day)}
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                  {day.is_working_day
                                    ? "Working Day"
                                    : day.type || "Non-Working Day"}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3">
                                {day.reason && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">
                                      Reason:
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {day.reason}
                                    </p>
                                  </div>
                                )}
                                {day.holiday && (
                                  <div>
                                    <p className="text-sm font-medium mb-1 text-red-700">
                                      Holiday:
                                    </p>
                                    <p className="text-sm font-semibold text-red-700">
                                      {day.holiday.holiday_name ||
                                        day.holiday.name}
                                    </p>
                                    {day.holiday.description && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {day.holiday.description}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlyCalendarPage;

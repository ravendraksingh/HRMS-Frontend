"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import apiClient from "@/app/services/internalApiClient";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/auth/AuthContext";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { cn } from "@/lib/utils";

const MonthlyCalendarPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingDays, setWorkingDays] = useState(new Set()); // Set of date strings (YYYY-MM-DD) marked as working
  const [weeklyOffDays, setWeeklyOffDays] = useState(new Set()); // Set of date strings marked as weekly off
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch holidays for the current year
  const fetchHolidays = useCallback(async () => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await externalApiClient.get(`/holidays?year=${year}`);
      setHolidays(res.data.holidays);
    } catch (e) {
      console.error("Error fetching holidays:", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Error fetching holidays";
      setError(errorMessage);
      toast.error(`Failed to load holidays: ${errorMessage}`);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [year, user?.user_id]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  // Get holiday for a specific date
  const getHolidayForDate = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split("T")[0];
    return holidays?.find((h) => {
      const holidayDate = new Date(h.holiday_date).toISOString().split("T")[0];
      return holidayDate === dateStr;
    });
  };

  // Check if date is a company-level mandatory holiday (non-working)
  const isMandatoryHoliday = (date) => {
    const holiday = getHolidayForDate(date);
    return holiday && holiday.type === "company" && holiday.is_optional === 0;
  };

  // Get day type for a specific date
  const getDayType = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split("T")[0];

    // Check if it's a mandatory holiday (non-working)
    if (isMandatoryHoliday(date)) {
      return "mandatory-holiday";
    }

    // Check if manually marked as weekly off
    if (weeklyOffDays.has(dateStr)) {
      return "weekly-off";
    }

    // Check if manually marked as working
    if (workingDays.has(dateStr)) {
      return "working";
    }

    // Check if it's a holiday (optional or other types)
    const holiday = getHolidayForDate(date);
    if (holiday) {
      return "holiday";
    }

    // Default: check day of week (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "default-weekly-off";
    }

    return "default-working";
  };

  // Toggle day type
  const toggleDayType = (date) => {
    if (!date) return;
    const dateStr = date.toISOString().split("T")[0];

    // Don't allow toggling mandatory holidays
    if (isMandatoryHoliday(date)) {
      toast.info("Company-level mandatory holidays cannot be changed");
      return;
    }

    const currentType = getDayType(date);
    const newWorkingDays = new Set(workingDays);
    const newWeeklyOffDays = new Set(weeklyOffDays);

    // Remove from both sets first
    newWorkingDays.delete(dateStr);
    newWeeklyOffDays.delete(dateStr);

    // Cycle through: default -> working -> weekly-off -> default
    if (
      currentType === "default-working" ||
      currentType === "default-weekly-off"
    ) {
      // Mark as working
      newWorkingDays.add(dateStr);
    } else if (currentType === "working") {
      // Mark as weekly off
      newWeeklyOffDays.add(dateStr);
    } else if (currentType === "weekly-off") {
      // Remove manual marking (back to default)
      // Already removed above
    } else if (currentType === "holiday") {
      // Mark as working (override holiday)
      newWorkingDays.add(dateStr);
    }

    setWorkingDays(newWorkingDays);
    setWeeklyOffDays(newWeeklyOffDays);
    setSelectedDay(date);
  };

  // Get day styling classes
  const getDayClasses = (date) => {
    if (!date) return "";
    const dayType = getDayType(date);
    const dateStr = date.toISOString().split("T")[0];
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    const isSelected =
      selectedDay && selectedDay.toISOString().split("T")[0] === dateStr;

    return cn(
      "relative p-1 sm:p-2 min-h-[50px] sm:min-h-[60px] border rounded-md cursor-pointer transition-colors text-xs sm:text-sm",
      {
        "bg-red-100 border-red-300 text-red-800":
          dayType === "mandatory-holiday",
        "bg-blue-100 border-blue-300 text-blue-800":
          dayType === "weekly-off" || dayType === "default-weekly-off",
        "bg-green-100 border-green-300 text-green-800": dayType === "working",
        "bg-yellow-50 border-yellow-200 text-yellow-800": dayType === "holiday",
        "bg-gray-50 border-gray-200": dayType === "default-working",
        "ring-2 ring-blue-500": isSelected,
        "ring-2 ring-green-500": isToday && !isSelected,
      }
    );
  };

  // Get day label
  const getDayLabel = (date) => {
    if (!date) return "";
    const dayType = getDayType(date);
    const holiday = getHolidayForDate(date);

    if (dayType === "mandatory-holiday") {
      return holiday ? `${holiday.name} (Mandatory)` : "Mandatory Holiday";
    }
    if (dayType === "weekly-off" || dayType === "default-weekly-off") {
      return "Weekly Off";
    }
    if (dayType === "working") {
      return "Working Day";
    }
    if (dayType === "holiday") {
      return holiday ? holiday.name : "Holiday";
    }
    return "Working Day";
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Month/year selector
  const handleMonthChange = (value) => {
    const [newYear, newMonth] = value.split("-");
    setCurrentDate(new Date(parseInt(newYear), parseInt(newMonth) - 1, 1));
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

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="container mx-auto max-w-[1400px] p-3 sm:p-6">
      <OrganizationInfoCard />

      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
              Monthly Calendar
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={`${year}-${String(month + 1).padStart(2, "0")}`}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const y = new Date().getFullYear() - 1 + i;
                    return monthNames.map((m, idx) => (
                      <SelectItem
                        key={`${y}-${idx + 1}`}
                        value={`${y}-${String(idx + 1).padStart(2, "0")}`}
                      >
                        {m} {y}
                      </SelectItem>
                    ));
                  }).flat()}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                className="flex-shrink-0"
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Legend */}
          <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border border-red-300 rounded flex-shrink-0"></div>
              <span className="text-xs sm:text-sm">Mandatory Holiday</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-50 border border-yellow-200 rounded flex-shrink-0"></div>
              <span className="text-xs sm:text-sm">Optional Holiday</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 border border-blue-300 rounded flex-shrink-0"></div>
              <span className="text-xs sm:text-sm">Weekly Off</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded flex-shrink-0"></div>
              <span className="text-xs sm:text-sm">Working Day</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-50 border border-gray-200 rounded flex-shrink-0"></div>
              <span className="text-xs sm:text-sm">Default</span>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <h2 className="text-base sm:text-xl font-semibold text-center flex-1">
              {monthNames[month]} {year}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
            </Button>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="text-center py-8">Loading calendar...</div>
          ) : (
            <>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-xs sm:text-sm p-1 sm:p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[50px] sm:min-h-[60px]"
                      ></div>
                    );
                  }

                  const dateStr = date.toISOString().split("T")[0];
                  const holiday = getHolidayForDate(date);
                  const dayType = getDayType(date);

                  return (
                    <div
                      key={dateStr}
                      className={getDayClasses(date)}
                      onClick={() => toggleDayType(date)}
                      title={getDayLabel(date)}
                    >
                      <div className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">
                        {date.getDate()}
                      </div>
                      {holiday && (
                        <div
                          className="text-[10px] sm:text-xs truncate leading-tight"
                          title={holiday.name}
                        >
                          {holiday.name}
                        </div>
                      )}
                      {dayType === "weekly-off" && !holiday && (
                        <div className="text-[10px] sm:text-xs leading-tight">
                          Off
                        </div>
                      )}
                      {dayType === "working" && !holiday && (
                        <div className="text-[10px] sm:text-xs leading-tight">
                          Work
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Instructions */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                  <strong>Instructions:</strong> Click on any day to toggle
                  between Working Day, Weekly Off, or Default. Company-level
                  mandatory holidays (marked in red) cannot be changed. Holidays
                  from the holiday list are automatically synced and displayed.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCalendarPage;

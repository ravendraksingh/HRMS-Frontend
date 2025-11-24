"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Calendar } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";
import { getErrorMessage } from "@/lib/emsUtil";

const HolidaysPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [calendarId, setCalendarId] = useState(null);
  const { user } = useAuth();
  const calendarIdRef = useRef(calendarId);
  const fetchHolidaysRef = useRef();

  // Keep ref in sync with state
  useEffect(() => {
    calendarIdRef.current = calendarId;
  }, [calendarId]);

  // Resolve employee calendar to get calendar_id
  const resolveEmployeeCalendar = useCallback(async () => {
    if (!user?.empid) {
      return null;
    }
    try {
      const res = await externalApiClient.get(
        `/calendars/resolve/${user.empid}?year=${year}`
      );
      // The response should contain calendar information
      // Try to extract calendar_id from the resolved calendar
      const calendarData = res.data;
      // Handle different response structures
      let calendarId = null;
      calendarId = calendarData?.calendar?.source_calendars[0]?.calendar_id;
      return calendarId;
    } catch (e) {
      const errorMessage = getErrorMessage(e, "Error resolving employee calendar");
      toast.error(errorMessage);
      return null;
    }
  }, [user?.empid, year]);

  
  const fetchHolidays = useCallback(
    async (forceResetCalendarId = false) => {
      try {
        setLoading(true);
        let currentCalendarId = forceResetCalendarId ? null : calendarIdRef.current;
        if (!currentCalendarId) {
          currentCalendarId = await resolveEmployeeCalendar();
          if (currentCalendarId) {
            setCalendarId(currentCalendarId);
            calendarIdRef.current = currentCalendarId;
          } else {
            setError("Unable to resolve calendar for employee");
            setHolidays([]);
            setLoading(false);
            return;
          }
        }

        // Fetch holidays with calendar_id
        const res = await externalApiClient.get(
          `/holidays?calendar_id=${currentCalendarId}&year=${year}`
        );
        setHolidays(res.data?.holidays || res.data || []);
        setError("");
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
    },
    [year, user?.empid, resolveEmployeeCalendar]
  );

  // Keep fetchHolidays ref in sync
  useEffect(() => {
    fetchHolidaysRef.current = fetchHolidays;
  }, [fetchHolidays]);

  useEffect(() => {
    // Reset calendar_id when year changes and fetch holidays
    if (!user?.empid) {
      return;
    }

    setCalendarId(null);
    calendarIdRef.current = null;
    if (fetchHolidaysRef.current) {
      fetchHolidaysRef.current(true);
    }
  }, [year, user?.empid]);

  return (
    <div className="px-4 sm:px-5 max-w-[1000px] mx-auto mb-[50px]">
      <h1 className="text-2xl sm:text-3xl text-center font-bold mb-3">Holidays</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm sm:text-base text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Label htmlFor="year" className="text-sm sm:text-base font-semibold whitespace-nowrap">
              Year:
            </Label>
            <Input
              type="number"
              id="year"
              value={year}
              onChange={(e) =>
                setYear(parseInt(e.target.value) || new Date().getFullYear())
              }
              className="w-24"
              min="2000"
              max="2100"
            />
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <Spinner size={28} />
                <p className="text-gray-600 text-sm">Loading holidays...</p>
              </div>
            </CardContent>
          </Card>
        ) : holidays.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-gray-500 text-sm">
              No holidays found for {year}.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {holidays.map((holiday) => (
              <Card key={holiday.id || holiday.holiday_id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg mb-2 break-words">
                        {holiday.name || holiday.holiday_name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <p className="text-sm text-gray-600">
                          {formatDateDisplay(
                            holiday.holiday_date || holiday.date
                          )}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge
                            variant={
                              holiday.is_optional === "Y" ||
                              holiday.is_optional === 1
                                ? "secondary"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {holiday.is_optional === "Y" ||
                            holiday.is_optional === 1
                              ? "Optional"
                              : "Mandatory"}
                          </Badge>
                          {(holiday.is_override === "Y" ||
                            holiday.is_override === 1) && (
                            <Badge variant="outline" className="text-xs">
                              Override
                            </Badge>
                          )}
                        </div>
                      </div>
                      {holiday.description && (
                        <p className="text-sm text-gray-600 mt-2 break-words">
                          {holiday.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidaysPage;


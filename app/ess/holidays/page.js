"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Calendar, CalendarDays, AlertCircle, Sparkles } from "lucide-react";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";
import { getErrorMessage } from "@/lib/emsUtil";
import { Input } from "@/components/ui/input";
import { getCurrentFinancialYear } from "@/lib/organizationUtil";

const HolidaysPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const financialYear = getCurrentFinancialYear();

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get(
        `/employees/${user?.empid}/holidays`
      );
      const holidaysData = res.data?.holidays || [];
      //   console.log(holidaysData);
      holidaysData.sort((a, b) => {
        const dateA = new Date(a.holiday_date || a.date);
        const dateB = new Date(b.holiday_date || b.date);
        return dateB - dateA;
      });
      setHolidays(holidaysData);
      setError("");
    } catch (e) {
      console.error("Error fetching holidays:", e);
      const errorMessage = getErrorMessage(e, "Error fetching holidays");
      setError(errorMessage);
      toast.error(`Failed to load holidays: ${errorMessage}`);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [user?.empid]);

  // Keep fetchHolidays ref in sync
  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    // Reset calendar_id when financial year changes and fetch holidays
    if (!user?.empid) {
      return;
    }
  }, [user?.empid]);

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 mb-[50px]">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Holidays</h1>
            <p className="text-gray-600 text-sm mt-1">
              View your organization's holiday calendar
            </p>
          </div>
        </div>
      </div>
      {/* Financial Year Selection Card */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 sm:flex-initial">
              <Label
                htmlFor="financialYear"
                className="text-sm font-medium mb-2 block"
              >
                Financial Year
              </Label>
              <Input type="text" value={financialYear} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays Content */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Spinner size={32} />
              <div>
                <p className="text-gray-700 font-medium">Loading holidays...</p>
                <p className="text-gray-500 text-sm mt-1">
                  Fetching holiday calendar for {financialYear}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : holidays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <CalendarDays className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-700 font-medium">
                  {hasCalendarError
                    ? "Holiday Not Setup"
                    : `No Holidays found for ${financialYear}`}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {hasCalendarError
                    ? "Unable to resolve calendar for this year. Please contact your administrator."
                    : "No holidays have been configured for this year. Please check back later or contact your administrator."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {holidays.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                Holidays ({holidays.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holidays.map((holiday) => (
                  <Card
                    key={holiday.id || holiday.holiday_id}
                    className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  >
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-2 break-words">
                            {holiday.name || holiday.holiday_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                              {formatDateDisplay(
                                holiday.holiday_date || holiday.date
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default" className="text-xs">
                            Mandatory
                          </Badge>
                          {(holiday.is_override === "Y" ||
                            holiday.is_override === 1) && (
                            <Badge variant="outline" className="text-xs">
                              Override
                            </Badge>
                          )}
                        </div>
                        {holiday.description && (
                          <p className="text-sm text-gray-600 mt-2 break-words line-clamp-2">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HolidaysPage;

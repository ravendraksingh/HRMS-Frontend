"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";
import { CalendarClock, Copy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/emsUtil";

const AttendanceCorrectionPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Local state (replacing Zustand)
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    dates: [], // Array of selected dates
    dateEntries: {}, // { [dateStr]: { checkInTime, checkOutTime, comment } }
    checkInTime: "09:00", // For copy-to-all
    checkOutTime: "18:00", // For copy-to-all
    comment: "", // For copy-to-all
  });
  const [correctionValidationErrors, setCorrectionValidationErrors] = useState(
    {}
  );
  const [loading, setLoading] = useState(true);

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async (employeeId, month) => {
    try {
      const startDate = `${month}-01`;
      const lastDayOfMonth = new Date(
        new Date(`${month}-01`).setMonth(
          new Date(`${month}-01`).getMonth() + 1
        ) - 1
      );
      const endDate = formatDateToYYYYMMDD(lastDayOfMonth);

      const res = await externalApiClient.get(
        `/attendance?empid=${employeeId}&start_date=${startDate}&end_date=${endDate}`
      );
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.attendance || res.data?.data || [];
      setAttendanceHistory(data);
      return data;
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      setAttendanceHistory([]);
      throw error;
    }
  }, []);

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(async (employeeId) => {
    try {
      const today = formatDateToYYYYMMDD(new Date());
      const res = await externalApiClient.get(
        `/attendance?attendance_date=${today}&empid=${employeeId}`
      );
      const attendanceData = Array.isArray(res.data)
        ? res.data[0]
        : res.data?.attendance?.[0] || res.data;
      setTodayAttendance(attendanceData || null);
      return attendanceData;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setTodayAttendance(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (user?.empid) {
      const employeeId = user.empid;
      setLoading(true);
      Promise.all([
        fetchTodayAttendance(employeeId),
        fetchAttendanceHistory(employeeId, selectedMonth),
      ]).finally(() => setLoading(false));
    }
  }, [
    user?.empid,
    selectedMonth,
    fetchTodayAttendance,
    fetchAttendanceHistory,
  ]);

  // Get available dates for the current month
  const getAvailableDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const dates = [];

    for (
      let d = new Date(firstDay);
      d <= lastDay && d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const date = new Date(d);
      const dateStr = formatDateToYYYYMMDD(date);

      // Check if date has both check-in AND check-out
      const hasBothCheckInAndOut = (() => {
        let checkIn = null;
        let checkOut = null;

        if (dateStr === formatDateToYYYYMMDD(today) && todayAttendance) {
          checkIn = todayAttendance.check_in_time;
          checkOut = todayAttendance.check_out_time;
        } else {
          const record = attendanceHistory.find(
            (att) =>
              (att.attendance_date || att.date || att.work_date) === dateStr
          );
          if (record) {
            checkIn = record.check_in_time;
            checkOut = record.check_out_time;
          }
        }

        // Date is only unavailable if BOTH check-in AND check-out are present
        return !!(checkIn && checkOut);
      })();

      // Date is available if either check-in or check-out is missing
      if (!hasBothCheckInAndOut) {
        dates.push(date);
      }
    }

    return dates;
  };

  const availableDates = getAvailableDates();

  const handleDateToggle = (date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    const currentDates = correctionForm.dates || [];
    const isSelected = currentDates.some(
      (d) => formatDateToYYYYMMDD(d) === dateStr
    );

    if (isSelected) {
      // Remove date
      const newDates = currentDates.filter(
        (d) => formatDateToYYYYMMDD(d) !== dateStr
      );
      const newDateEntries = { ...correctionForm.dateEntries };
      delete newDateEntries[dateStr];
      setCorrectionForm({
        ...correctionForm,
        dates: newDates,
        dateEntries: newDateEntries,
      });
      // Clear validation errors for this date
      const newErrors = { ...correctionValidationErrors };
      delete newErrors[`${dateStr}_checkInTime`];
      delete newErrors[`${dateStr}_checkOutTime`];
      setCorrectionValidationErrors(newErrors);
    } else {
      // Add date
      const newDates = [...currentDates, date];
      const newDateEntries = {
        ...correctionForm.dateEntries,
        [dateStr]: {
          checkInTime: "",
          checkOutTime: "",
          comment: "",
        },
      };
      setCorrectionForm({
        ...correctionForm,
        dates: newDates,
        dateEntries: newDateEntries,
      });
    }
  };

  // Handle calendar date selection (multiple mode)
  const handleCalendarSelect = (selectedDates) => {
    if (!selectedDates) return;

    // Convert selected dates to array if single date
    const datesArray = Array.isArray(selectedDates)
      ? selectedDates
      : [selectedDates];

    // Get current selected dates as strings for comparison
    const currentDateStrings = (correctionForm.dates || []).map((d) =>
      formatDateToYYYYMMDD(d)
    );

    // Get new selected dates as strings
    const newDateStrings = datesArray.map((d) => formatDateToYYYYMMDD(d));

    // Find dates to add and remove
    const datesToAdd = datesArray.filter((d) => {
      const dateStr = formatDateToYYYYMMDD(d);
      return !currentDateStrings.includes(dateStr);
    });

    const datesToRemove = (correctionForm.dates || []).filter((d) => {
      const dateStr = formatDateToYYYYMMDD(d);
      return !newDateStrings.includes(dateStr);
    });

    // Update dates
    const newDates = datesArray;
    const newDateEntries = { ...correctionForm.dateEntries };

    // Remove entries for unselected dates
    datesToRemove.forEach((date) => {
      const dateStr = formatDateToYYYYMMDD(date);
      delete newDateEntries[dateStr];
      // Clear validation errors
      const newErrors = { ...correctionValidationErrors };
      delete newErrors[`${dateStr}_checkInTime`];
      delete newErrors[`${dateStr}_checkOutTime`];
      setCorrectionValidationErrors(newErrors);
    });

    // Add entries for newly selected dates
    datesToAdd.forEach((date) => {
      const dateStr = formatDateToYYYYMMDD(date);
      if (!newDateEntries[dateStr]) {
        newDateEntries[dateStr] = {
          checkInTime: "",
          checkOutTime: "",
          comment: "",
        };
      }
    });

    setCorrectionForm({
      ...correctionForm,
      dates: newDates,
      dateEntries: newDateEntries,
    });
  };

  // Check if a date should be disabled in calendar
  const isDateDisabled = (date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    const today = new Date();
    const todayStr = formatDateToYYYYMMDD(today);

    // Disable future dates
    if (date > today) return true;

    // Disable dates that have both check-in and check-out
    if (dateStr === todayStr && todayAttendance) {
      return !!(
        todayAttendance.check_in_time && todayAttendance.check_out_time
      );
    }

    const record = attendanceHistory.find(
      (att) => (att.attendance_date || att.date || att.work_date) === dateStr
    );

    if (record) {
      return !!(record.check_in_time && record.check_out_time);
    }

    return false;
  };

  const handleCopyToAll = () => {
    const { dates, checkInTime, checkOutTime, comment } = correctionForm;
    const newDateEntries = { ...correctionForm.dateEntries };

    dates.forEach((date) => {
      const dateStr = formatDateToYYYYMMDD(date);
      newDateEntries[dateStr] = {
        checkInTime: checkInTime || "",
        checkOutTime: checkOutTime || "",
        comment: comment || "",
      };
    });

    setCorrectionForm({
      ...correctionForm,
      dateEntries: newDateEntries,
    });
  };

  const handleDateFieldChange = (dateStr, field, value) => {
    setCorrectionForm({
      ...correctionForm,
      dateEntries: {
        ...correctionForm.dateEntries,
        [dateStr]: {
          ...(correctionForm.dateEntries[dateStr] || {
            checkInTime: "",
            checkOutTime: "",
            comment: "",
          }),
          [field]: value,
        },
      },
    });
    // Clear validation error for this field
    const newErrors = { ...correctionValidationErrors };
    delete newErrors[`${dateStr}_${field}`];
    setCorrectionValidationErrors(newErrors);
  };

  const validateCorrectionForm = () => {
    const errors = {};

    if (!correctionForm.dates || correctionForm.dates.length === 0) {
      errors.dates = "At least one date is required";
    }

    // Validate each date entry
    correctionForm.dates?.forEach((date) => {
      const dateStr = formatDateToYYYYMMDD(date);
      const entry = correctionForm.dateEntries[dateStr] || {};

      if (!entry.checkInTime || entry.checkInTime.trim() === "") {
        errors[`${dateStr}_checkInTime`] = "Check-in time is required";
      }

      if (!entry.checkOutTime || entry.checkOutTime.trim() === "") {
        errors[`${dateStr}_checkOutTime`] = "Check-out time is required";
      }

      // Validate that check-out is after check-in
      if (entry.checkInTime && entry.checkOutTime) {
        const checkInTime = new Date(`2000-01-01T${entry.checkInTime}`);
        const checkOutTime = new Date(`2000-01-01T${entry.checkOutTime}`);
        if (checkOutTime <= checkInTime) {
          errors[`${dateStr}_checkOutTime`] =
            "Check-out time must be after check-in time";
        }
      }
    });

    setCorrectionValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCorrectionSubmit = async () => {
    if (!validateCorrectionForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    if (!user?.empid) {
      toast.error("User information not available");
      return;
    }

    try {
      setSubmittingCorrection(true);
      const dates = correctionForm.dates || [];
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Process each date
      for (const date of dates) {
        try {
          const dateStr = formatDateToYYYYMMDD(date);
          const entry = correctionForm.dateEntries[dateStr] || {};
          const checkInTime = entry.checkInTime || correctionForm.checkInTime;
          const checkOutTime =
            entry.checkOutTime || correctionForm.checkOutTime;
          const reason = entry.comment || correctionForm.comment || "";

          if (!checkInTime || !checkOutTime) {
            throw new Error("Check-in and check-out times are required");
          }

          // Format datetime strings: "YYYY-MM-DD HH:MM:SS"
          const requestedCheckIn = `${dateStr} ${checkInTime}:00`;
          const requestedCheckOut = `${dateStr} ${checkOutTime}:00`;

          // Get existing attendance record to get attendance_record_id
          let attendanceRecordId = null;

          try {
            const res = await externalApiClient.get(
              `/attendance?attendance_date=${dateStr}&empid=${user.empid}`
            );
            const data = Array.isArray(res.data)
              ? res.data[0]
              : res.data?.attendance?.[0] || res.data;
            if (data && data.id) {
              attendanceRecordId = data.id;
            }
          } catch (error) {
            // No existing record, that's okay - attendance_record_id will be null
            attendanceRecordId = null;
          }

          // Create correction request using the corrections API endpoint
          const response = await externalApiClient.post(
            "/attendance/corrections",
            {
              empid: user.empid,
              attendance_record_id: attendanceRecordId,
              correction_date: dateStr,
              requested_check_in: requestedCheckIn,
              requested_check_out: requestedCheckOut,
              reason: reason || "Attendance correction request",
            }
          );

          // Response format: { message: "...", request: { ... } }
          if (response.data && response.data.request) {
            console.log("Correction request created:", response.data.request);
          }

          successCount++;
        } catch (error) {
          failCount++;
          const errorMsg = getErrorMessage(
            error,
            "Failed to submit correction"
          );
          errors.push({
            date: formatDateToYYYYMMDD(date),
            error: errorMsg,
          });
          console.error(
            `Error submitting correction for ${formatDateToYYYYMMDD(date)}:`,
            error
          );
        }
      }

      // Show results
      if (successCount > 0 && failCount === 0) {
        toast.success(
          `Successfully submitted ${successCount} correction request${
            successCount > 1 ? "s" : ""
          }!`
        );
        // Reset form
        setCorrectionForm({
          dates: [],
          dateEntries: {},
          checkInTime: "",
          checkOutTime: "",
          comment: "",
        });
        setCorrectionValidationErrors({});
        // Refresh data
        if (user?.empid) {
          await fetchTodayAttendance(user.empid);
          await fetchAttendanceHistory(user.empid, selectedMonth);
        }
        // Navigate back to attendance page
        router.push("/ess/attendance");
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Submitted ${successCount} correction request${
            successCount > 1 ? "s" : ""
          } successfully, but ${failCount} failed.`
        );
      } else {
        toast.error(
          `Failed to submit corrections. ${errors[0]?.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error in handleCorrectionSubmit:", error);
      const errorMsg = getErrorMessage(
        error,
        "Failed to submit correction request"
      );
      toast.error(errorMsg);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleCancel = () => {
    setCorrectionForm({
      dates: [],
      dateEntries: {},
      checkInTime: "",
      checkOutTime: "",
      comment: "",
    });
    setCorrectionValidationErrors({});
    router.push("/ess/attendance");
  };

  const isDateSelected = (date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    return (correctionForm.dates || []).some(
      (d) => formatDateToYYYYMMDD(d) === dateStr
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-1 flex items-center gap-2">
          <CalendarClock className="h-6 w-6" />
          Request Attendance Correction
        </h2>
        <p className="text-gray-600 text-sm">
          Select dates and set check-in/check-out times individually or use
          copy-to-all.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Correction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Copy to All Section */}
          {correctionForm.dates && correctionForm.dates.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-blue-900">
                  Copy to All Selected Dates ({correctionForm.dates.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToAll}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Apply to All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="copy-checkin" className="text-sm">
                    Check-In Time
                  </Label>
                  <Input
                    id="copy-checkin"
                    type="time"
                    value={correctionForm.checkInTime}
                    onChange={(e) =>
                      setCorrectionForm({
                        ...correctionForm,
                        checkInTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copy-checkout" className="text-sm">
                    Check-Out Time
                  </Label>
                  <Input
                    id="copy-checkout"
                    type="time"
                    value={correctionForm.checkOutTime}
                    onChange={(e) =>
                      setCorrectionForm({
                        ...correctionForm,
                        checkOutTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-comment" className="text-sm">
                  Comment (Optional)
                </Label>
                <Textarea
                  id="copy-comment"
                  value={correctionForm.comment}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      comment: e.target.value,
                    })
                  }
                  placeholder="Reason for correction (optional)..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Select Dates <span className="text-destructive">*</span>
              </Label>
              <Badge variant="secondary">
                {availableDates.length} available dates
              </Badge>
            </div>

            {availableDates.length === 0 ? (
              <div className="p-8 text-center border rounded-md bg-gray-50">
                <p className="text-gray-600">
                  No dates available for correction. All dates in the current
                  month either have complete attendance records or are in the
                  future.
                </p>
              </div>
            ) : (
              <div className="flex justify-center border rounded-md p-4">
                <Calendar
                  mode="multiple"
                  selected={correctionForm.dates || []}
                  onSelect={handleCalendarSelect}
                  disabled={isDateDisabled}
                  className="rounded-md border-0"
                  modifiers={{
                    selected: correctionForm.dates || [],
                  }}
                  modifiersClassNames={{
                    selected:
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  }}
                />
              </div>
            )}

            {correctionValidationErrors.dates && (
              <p className="text-sm text-destructive">
                {correctionValidationErrors.dates}
              </p>
            )}
          </div>

          <Separator />

          {/* Individual Date Entries */}
          {correctionForm.dates && correctionForm.dates.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Set Times for Each Date
              </Label>
              <div className="space-y-6">
                {correctionForm.dates.map((date, idx) => {
                  const dateStr = formatDateToYYYYMMDD(date);
                  const entry = correctionForm.dateEntries[dateStr] || {
                    checkInTime: "",
                    checkOutTime: "",
                    comment: "",
                  };

                  return (
                    <Card key={idx} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {formatDateToDDMMYYYY(date)}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDateToggle(date)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`${dateStr}-checkin`}>
                              Check-In Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`${dateStr}-checkin`}
                              type="time"
                              value={entry.checkInTime}
                              onChange={(e) =>
                                handleDateFieldChange(
                                  dateStr,
                                  "checkInTime",
                                  e.target.value
                                )
                              }
                              className={
                                correctionValidationErrors[
                                  `${dateStr}_checkInTime`
                                ]
                                  ? "border-destructive"
                                  : ""
                              }
                              required
                            />
                            {correctionValidationErrors[
                              `${dateStr}_checkInTime`
                            ] && (
                              <p className="text-xs text-destructive">
                                {
                                  correctionValidationErrors[
                                    `${dateStr}_checkInTime`
                                  ]
                                }
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${dateStr}-checkout`}>
                              Check-Out Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`${dateStr}-checkout`}
                              type="time"
                              value={entry.checkOutTime}
                              onChange={(e) =>
                                handleDateFieldChange(
                                  dateStr,
                                  "checkOutTime",
                                  e.target.value
                                )
                              }
                              className={
                                correctionValidationErrors[
                                  `${dateStr}_checkOutTime`
                                ]
                                  ? "border-destructive"
                                  : ""
                              }
                              required
                            />
                            {correctionValidationErrors[
                              `${dateStr}_checkOutTime`
                            ] && (
                              <p className="text-xs text-destructive">
                                {
                                  correctionValidationErrors[
                                    `${dateStr}_checkOutTime`
                                  ]
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${dateStr}-comment`}>
                            Comment (Optional)
                          </Label>
                          <Textarea
                            id={`${dateStr}-comment`}
                            value={entry.comment}
                            onChange={(e) =>
                              handleDateFieldChange(
                                dateStr,
                                "comment",
                                e.target.value
                              )
                            }
                            placeholder="Reason for this date (optional)..."
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={submittingCorrection}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCorrectionSubmit}
              disabled={
                submittingCorrection ||
                !correctionForm.dates ||
                correctionForm.dates.length === 0
              }
              className="flex-1"
            >
              {submittingCorrection
                ? `Submitting ${correctionForm.dates?.length || 0} correction${
                    (correctionForm.dates?.length || 0) > 1 ? "s" : ""
                  }...`
                : `Submit ${correctionForm.dates?.length || 0} Correction${
                    (correctionForm.dates?.length || 0) > 1 ? "s" : ""
                  }`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCorrectionPage;

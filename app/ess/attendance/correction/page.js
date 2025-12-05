"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  formatDateToDDMMYYYY,
  formatDateToYYYYMMDD,
  getTodayDate,
  getCurrentMonth,
} from "@/lib/dateTimeUtil";
import { getFYStartDate, getFYEndDate } from "@/lib/organizationUtil";
import {
  CalendarClock,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/emsUtil";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SelectMonth from "@/components/common/SelectMonth";

const AttendanceCorrectionPage = () => {
  const { user } = useAuth();

  // Local state
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [eligibleDates, setEligibleDates] = useState([]);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    dates: [], // Array of selected dates
    dateEntries: {}, // { [dateStr]: { checkInTime, checkOutTime, comment } }
    checkInTime: "09:00",
    checkOutTime: "18:00",
    comment: "",
  });
  const [correctionValidationErrors, setCorrectionValidationErrors] = useState(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [correctionHistory, setCorrectionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyMonthFilter, setHistoryMonthFilter] = useState(
    getCurrentMonth()
  );

  // Fetch eligible dates for correction
  const fetchEligibleDates = useCallback(async (employeeId, month) => {
    try {
      const res = await externalApiClient.get(
        `/employees/${employeeId}/attendance/corrections/eligible-dates`
      );
      const data = res.data?.eligible_dates || [];
      setEligibleDates(data);
      return data;
    } catch (error) {
      console.error("Error fetching eligible dates:", error);
      setEligibleDates([]);
      throw error;
    }
  }, []);

  // Fetch correction request history
  const fetchCorrectionHistory = useCallback(async (employeeId) => {
    try {
      setLoadingHistory(true);
      const res = await externalApiClient.get(
        `/employees/${employeeId}/attendance/corrections`
      );
      const correctionRequests = res.data?.requests || [];

      // Map the response to match the expected format
      const mappedCorrections = correctionRequests.map((request) => {
        return {
          id: request.id,
          attendance_id: request.attendance_record_id,
          correction_date: request.correction_date,
          requested_check_in: request.requested_check_in,
          requested_check_out: request.requested_check_out,
          status: request.status,
          reason: request.reason,
          applied_at: request.applied_at,
          approver_remarks: request.remarks || request.rejection_reason || "",
          approved_by: request.approved_by,
          approved_at: request.approved_at,
        };
      });

      // Sort by date descending (newest first)
      mappedCorrections.sort((a, b) => {
        const dateA = new Date(a.applied_at || a.correction_date || 0);
        const dateB = new Date(b.applied_at || b.correction_date || 0);
        return dateB - dateA;
      });

      setCorrectionHistory(mappedCorrections);
    } catch (error) {
      console.error("Error fetching correction history:", error);
      setCorrectionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (user?.empid) {
      const employeeId = user.empid;
      setLoading(true);
      fetchEligibleDates(employeeId, selectedMonth).finally(() =>
        setLoading(false)
      );
      fetchCorrectionHistory(employeeId);
    }
  }, [user?.empid, selectedMonth, fetchEligibleDates, fetchCorrectionHistory]);

  // Get available dates from eligible dates API
  const getAvailableDates = () => {
    const todayStr = getTodayDate();
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);
    const availableDatesList = [];

    // Use eligible dates from API
    eligibleDates.forEach((eligibleDate) => {
      if (!eligibleDate.date) return;

      const recordDate = new Date(eligibleDate.date);
      recordDate.setHours(0, 0, 0, 0);

      // Exclude future dates
      if (recordDate > today) return;

      const date = new Date(eligibleDate.date);
      availableDatesList.push({
        date: date,
        dateStr: eligibleDate.date,
        dayStatus: eligibleDate.has_attendance_record ? "PRESENT" : "ABSENT",
        reason: eligibleDate.eligibility_reason || "Eligible for correction",
        eligibilityReason: eligibleDate.eligibility_reason,
        hasAttendanceRecord: eligibleDate.has_attendance_record,
        attendanceId: eligibleDate.attendance_id,
        checkInTime: eligibleDate.check_in_time,
        checkOutTime: eligibleDate.check_out_time,
      });
    });

    // Sort by date (most recent first)
    availableDatesList.sort((a, b) => {
      return new Date(b.dateStr) - new Date(a.dateStr);
    });

    return availableDatesList;
  };

  const availableDates = getAvailableDates();

  const handleDateToggle = (dateOrObj) => {
    // Handle both Date objects and dateObj objects
    const date = dateOrObj instanceof Date ? dateOrObj : dateOrObj.date;
    const dateStr = dateOrObj.dateStr || formatDateToYYYYMMDD(date);
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
      delete newErrors[`${dateStr}_comment`];
      setCorrectionValidationErrors(newErrors);
    } else {
      // Add date with default times
      const newDates = [...currentDates, date];
      const newDateEntries = {
        ...correctionForm.dateEntries,
        [dateStr]: {
          checkInTime: "09:30",
          checkOutTime: "18:30",
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

      // Validate comment is required and at least 15 characters
      if (!entry.comment || entry.comment.trim().length < 15) {
        errors[`${dateStr}_comment`] =
          "Comment is required and must be at least 15 characters";
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

          // Get attendance_record_id from eligible dates data
          const eligibleDate = eligibleDates.find((ed) => ed.date === dateStr);
          const attendanceRecordId = eligibleDate?.attendance_id || null;

          // Create correction request using the corrections API endpoint
          const payload = {
            empid: user.empid,
            attendance_record_id: attendanceRecordId,
            correction_date: dateStr,
            requested_check_in: requestedCheckIn,
            requested_check_out: requestedCheckOut,
            reason: reason || "Attendance correction request",
          };

          console.log("Submitting correction request:", payload);

          const response = await externalApiClient.post(
            `/employees/${user.empid}/attendance/corrections`,
            payload
          );

          console.log("Correction request response:", response);

          // Check if response is successful
          if (response && response.status >= 200 && response.status < 300) {
            // Response format: { message: "...", request: { ... } }
            if (response.data) {
              console.log("Correction request created:", response.data);
              // Check for different possible response structures
              if (
                response.data.request ||
                response.data.correction ||
                response.data.id
              ) {
                successCount++;
              } else {
                // If response doesn't have expected structure but status is OK, still count as success
                console.warn("Unexpected response structure:", response.data);
                successCount++;
              }
            } else {
              console.warn("Response has no data:", response);
              successCount++;
            }
          } else {
            throw new Error(
              `API returned status ${response?.status || "unknown"}`
            );
          }
        } catch (error) {
          failCount++;
          console.error(
            `Error submitting correction for ${formatDateToYYYYMMDD(date)}:`,
            error
          );
          console.error("Error response:", error.response?.data);
          console.error("Error status:", error.response?.status);

          const errorMsg = getErrorMessage(
            error,
            "Failed to submit correction"
          );
          errors.push({
            date: formatDateToYYYYMMDD(date),
            error: errorMsg,
          });

          // Show error toast for each failed request
          toast.error(
            `Failed to submit correction for ${formatDateToDDMMYYYY(
              date
            )}: ${errorMsg}`
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
        // Refresh eligible dates and history
        if (user?.empid) {
          await fetchEligibleDates(user.empid, selectedMonth);
          await fetchCorrectionHistory(user.empid);
        }
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
  };

  const isDateSelected = (dateStr) => {
    return (correctionForm.dates || []).some(
      (d) => formatDateToYYYYMMDD(d) === dateStr
    );
  };

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === "APPROVED") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (statusUpper === "REJECTED") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    if (statusUpper === "CANCELLED") {
      return (
        <Badge variant="secondary">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeString;
    }
  };

  // Filter correction history by selected month
  const filteredCorrectionHistory = correctionHistory.filter((correction) => {
    if (!correction.correction_date || !historyMonthFilter) return false;

    const correctionDate = new Date(correction.correction_date);
    const [year, month] = historyMonthFilter.split("-").map(Number);
    return (
      correctionDate.getFullYear() === year &&
      correctionDate.getMonth() + 1 === month
    );
  });

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

      <div className="space-y-6 max-w-2xl">
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
                No dates available for correction. All dates either have
                complete attendance records, are holidays/weekly offs, or are in
                the future.
              </p>
            </div>
          ) : (
            <div>
              <div className="space-y-4">
                {availableDates.map((dateObj, index) => {
                  const dateStr = dateObj.dateStr;
                  const isSelected = isDateSelected(dateStr);
                  const entry = correctionForm.dateEntries[dateStr] || {
                    checkInTime: "",
                    checkOutTime: "",
                    comment: "",
                  };

                  return (
                    <div
                      key={index}
                      className={`border rounded-md transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-300 shadow-sm"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {/* Date Header */}
                      <div className="flex items-center space-x-3 p-3">
                        <Checkbox
                          id={`date-${dateStr}`}
                          checked={isSelected}
                          onCheckedChange={() => handleDateToggle(dateObj)}
                        />
                        <label
                          htmlFor={`date-${dateStr}`}
                          className="flex-1 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatDateToDDMMYYYY(dateObj.date)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {dateObj.reason}
                            </span>
                          </div>
                          <Badge
                            variant={
                              dateObj.dayStatus === "ABSENT"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {dateObj.dayStatus}
                          </Badge>
                        </label>
                      </div>

                      {/* Input Fields - Shown when selected */}
                      {isSelected && (
                        <div className="px-3 pb-3 space-y-4 border-t border-blue-200 pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`${dateStr}-checkin`}
                                className="text-sm"
                              >
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
                              <Label
                                htmlFor={`${dateStr}-checkout`}
                                className="text-sm"
                              >
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
                            <Label
                              htmlFor={`${dateStr}-comment`}
                              className="text-sm"
                            >
                              Comment{" "}
                              <span className="text-destructive">*</span>
                              <span className="text-xs text-gray-500 ml-1">
                                (Minimum 15 characters)
                              </span>
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
                              placeholder="Please provide a reason for this correction (minimum 15 characters)..."
                              rows={2}
                              className={
                                correctionValidationErrors[`${dateStr}_comment`]
                                  ? "border-destructive"
                                  : ""
                              }
                              required
                            />
                            {correctionValidationErrors[
                              `${dateStr}_comment`
                            ] && (
                              <p className="text-xs text-destructive">
                                {
                                  correctionValidationErrors[
                                    `${dateStr}_comment`
                                  ]
                                }
                              </p>
                            )}
                            {entry.comment && (
                              <p className="text-xs text-gray-500">
                                {entry.comment.trim().length}/15 characters
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {correctionValidationErrors.dates && (
            <p className="text-sm text-destructive">
              {correctionValidationErrors.dates}
            </p>
          )}
        </div>

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
      </div>

      {/* Correction Request History Section */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Correction Request History
              </CardTitle>
              <div className="flex items-center gap-3">
                <SelectMonth
                  value={historyMonthFilter}
                  onValueChange={setHistoryMonthFilter}
                  placeholder="Select month"
                />
                <Badge variant="secondary">
                  {filteredCorrectionHistory.length} request(s)
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-600">Loading history...</p>
              </div>
            ) : filteredCorrectionHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Applied At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCorrectionHistory.map((correction, index) => (
                      <TableRow key={correction.id || index}>
                        <TableCell>
                          {formatDateDisplay(correction.correction_date)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatTime(correction.requested_check_in)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatTime(correction.requested_check_out)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {correction.reason || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(correction.status)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {correction.approver_remarks || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {correction.applied_at
                            ? formatDateDisplay(correction.applied_at)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>
                  {correctionHistory.length > 0
                    ? "No correction requests found for the selected month."
                    : "No correction requests found."}
                </p>
                <p className="text-sm mt-2">
                  {correctionHistory.length > 0
                    ? "Try selecting a different month."
                    : "Your correction request history will appear here."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceCorrectionPage;

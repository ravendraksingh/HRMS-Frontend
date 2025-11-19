"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";
import useAttendanceStore from "@/store/attendanceStore";
import { ArrowLeft, CalendarClock, Copy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const AttendanceCorrectionPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Zustand store state and actions
  const {
    attendanceHistory,
    todayAttendance,
    selectedMonth,
    submittingCorrection,
    correctionForm,
    correctionValidationErrors,
    setCorrectionFormField,
    resetCorrectionForm,
    validateCorrectionForm,
    submitCorrection,
    fetchAttendanceHistory,
    applyToAllDates,
  } = useAttendanceStore();

  useEffect(() => {
    if (user?.employee_id) {
      fetchAttendanceHistory(user.employee_id, selectedMonth);
    }
  }, [user?.employee_id, selectedMonth]);

  // Get available dates for the current month
  const getAvailableDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const dates = [];

    for (let d = new Date(firstDay); d <= lastDay && d <= today; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const dateStr = formatDateToYYYYMMDD(date);
      
      // Check if date has both clock-in AND clock-out
      const hasBothClockInAndOut = (() => {
        let clockIn = null;
        let clockOut = null;
        
        if (dateStr === formatDateToYYYYMMDD(today) && todayAttendance) {
          clockIn =
            todayAttendance.clock_in ||
            todayAttendance.clockin ||
            todayAttendance.clockin_time;
          clockOut =
            todayAttendance.clock_out ||
            todayAttendance.clockout ||
            todayAttendance.clockout_time;
        } else {
          const record = attendanceHistory.find(
            (att) => (att.date || att.work_date) === dateStr
          );
          if (record) {
            clockIn = record.clock_in || record.clockin || record.clockin_time;
            clockOut = record.clock_out || record.clockout || record.clockout_time;
          }
        }
        
        // Date is only unavailable if BOTH clock-in AND clock-out are present
        return !!(clockIn && clockOut);
      })();

      // Date is available if either clock-in or clock-out is missing
      if (!hasBothClockInAndOut) {
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
      setCorrectionFormField("dates", newDates);
    } else {
      // Add date
      const newDates = [...currentDates, date];
      setCorrectionFormField("dates", newDates);
    }
  };

  const handleCopyToAll = () => {
    applyToAllDates();
  };

  const handleDateFieldChange = (dateStr, field, value) => {
    setCorrectionFormField(`dateEntry_${dateStr}_${field}`, value);
  };

  const handleCorrectionSubmit = async () => {
    if (!validateCorrectionForm()) {
      return;
    }
    const success = await submitCorrection(user.employee_id);
    if (success) {
      router.push("/attendance");
    }
  };

  const handleCancel = () => {
    resetCorrectionForm();
    router.push("/attendance");
  };

  const isDateSelected = (date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    return (correctionForm.dates || []).some(
      (d) => formatDateToYYYYMMDD(d) === dateStr
    );
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarClock className="h-8 w-8" />
          Request Attendance Correction
        </h1>
        <p className="text-gray-600 mt-2">
          Select dates and set clock-in/clock-out times individually or use copy-to-all.
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
                  <Label htmlFor="copy-clockin" className="text-sm">
                    Clock-In Time
                  </Label>
                  <Input
                    id="copy-clockin"
                    type="time"
                    value={correctionForm.clockIn}
                    onChange={(e) =>
                      setCorrectionFormField("clockIn", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copy-clockout" className="text-sm">
                    Clock-Out Time
                  </Label>
                  <Input
                    id="copy-clockout"
                    type="time"
                    value={correctionForm.clockOut}
                    onChange={(e) =>
                      setCorrectionFormField("clockOut", e.target.value)
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
                    setCorrectionFormField("comment", e.target.value)
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
                  No dates available for correction. All dates in the current month either have clock-in records or are in the future.
                </p>
              </div>
            ) : (
              <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {availableDates.map((date, idx) => {
                    const dateStr = formatDateToYYYYMMDD(date);
                    const isSelected = isDateSelected(date);
                    return (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleDateToggle(date)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleDateToggle(date)}
                        />
                        <Label className="cursor-pointer text-sm">
                          {formatDateToDDMMYYYY(date)}
                        </Label>
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
                    clockIn: "",
                    clockOut: "",
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
                            <Label htmlFor={`${dateStr}-clockin`}>
                              Clock-In Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`${dateStr}-clockin`}
                              type="time"
                              value={entry.clockIn}
                              onChange={(e) =>
                                handleDateFieldChange(
                                  dateStr,
                                  "clockIn",
                                  e.target.value
                                )
                              }
                              className={
                                correctionValidationErrors[`${dateStr}_clockIn`]
                                  ? "border-destructive"
                                  : ""
                              }
                              required
                            />
                            {correctionValidationErrors[`${dateStr}_clockIn`] && (
                              <p className="text-xs text-destructive">
                                {
                                  correctionValidationErrors[
                                    `${dateStr}_clockIn`
                                  ]
                                }
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${dateStr}-clockout`}>
                              Clock-Out Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`${dateStr}-clockout`}
                              type="time"
                              value={entry.clockOut}
                              onChange={(e) =>
                                handleDateFieldChange(
                                  dateStr,
                                  "clockOut",
                                  e.target.value
                                )
                              }
                              className={
                                correctionValidationErrors[`${dateStr}_clockOut`]
                                  ? "border-destructive"
                                  : ""
                              }
                              required
                            />
                            {correctionValidationErrors[`${dateStr}_clockOut`] && (
                              <p className="text-xs text-destructive">
                                {
                                  correctionValidationErrors[
                                    `${dateStr}_clockOut`
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
                ? `Submitting ${
                    correctionForm.dates?.length || 0
                  } correction${
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

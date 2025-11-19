import { create } from "zustand";
import { devtools } from "zustand/middleware";
import apiClient from "@/app/services/internalApiClient";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";
import { toast } from "sonner";

const useAttendanceStore = create(
  devtools(
    (set, get) => ({
      // State
      todayAttendance: null,
      attendanceHistory: [],
      monthlyStats: {
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
      },
      weeklyStats: {
        days: [],
        totalHours: 0,
        averageHours: 0,
      },
      selectedDate: new Date(),
      selectedMonth: (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
      })(),

      // Loading states
      loading: true,
      clocking: false,
      submittingCorrection: false,

      // Correction form state
      correctionDialogOpen: false,
      correctionForm: {
        dates: [], // Array of selected dates
        dateEntries: {}, // { [dateStr]: { clockIn, clockOut, comment } }
        clockIn: "", // For copy-to-all
        clockOut: "", // For copy-to-all
        comment: "", // For copy-to-all
      },
      correctionValidationErrors: {},

      // Actions - Setters
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setLoading: (loading) => set({ loading }),
      setClocking: (clocking) => set({ clocking }),
      setCorrectionDialogOpen: (open) => set({ correctionDialogOpen: open }),

      // Correction form actions
      setCorrectionFormField: (field, value) =>
        set((state) => {
          if (field === "dates") {
            // Handle dates array - initialize dateEntries for new dates
            const newDateEntries = { ...state.correctionForm.dateEntries };
            const dateStrings = value.map((d) => formatDateToYYYYMMDD(d));

            // Remove entries for dates that are no longer selected
            Object.keys(newDateEntries).forEach((dateStr) => {
              if (!dateStrings.includes(dateStr)) {
                delete newDateEntries[dateStr];
              }
            });

            // Initialize entries for new dates
            dateStrings.forEach((dateStr) => {
              if (!newDateEntries[dateStr]) {
                newDateEntries[dateStr] = {
                  clockIn: "",
                  clockOut: "",
                  comment: "",
                };
              }
            });

            return {
              correctionForm: {
                ...state.correctionForm,
                dates: value,
                dateEntries: newDateEntries,
              },
              correctionValidationErrors: {
                ...state.correctionValidationErrors,
                dates: undefined,
              },
            };
          }

          if (field.startsWith("dateEntry_")) {
            // Handle per-date field: dateEntry_YYYY-MM-DD_field
            // Remove "dateEntry_" prefix
            const remaining = field.replace("dateEntry_", "");
            // Split by last underscore to separate date and field
            const lastUnderscoreIndex = remaining.lastIndexOf("_");
            const dateStr = remaining.substring(0, lastUnderscoreIndex);
            const entryField = remaining.substring(lastUnderscoreIndex + 1);

            return {
              correctionForm: {
                ...state.correctionForm,
                dateEntries: {
                  ...state.correctionForm.dateEntries,
                  [dateStr]: {
                    ...(state.correctionForm.dateEntries[dateStr] || {
                      clockIn: "",
                      clockOut: "",
                      comment: "",
                    }),
                    [entryField]: value,
                  },
                },
              },
              correctionValidationErrors: {
                ...state.correctionValidationErrors,
                [`${dateStr}_${entryField}`]: undefined,
              },
            };
          }

          return {
            correctionForm: {
              ...state.correctionForm,
              [field]: value,
            },
            correctionValidationErrors: {
              ...state.correctionValidationErrors,
              [field]: undefined, // Clear error when field changes
            },
          };
        }),

      // Apply copy-to-all values to all selected dates
      applyToAllDates: () =>
        set((state) => {
          const { dates, clockIn, clockOut, comment } = state.correctionForm;
          const newDateEntries = { ...state.correctionForm.dateEntries };

          dates.forEach((date) => {
            const dateStr = formatDateToYYYYMMDD(date);
            newDateEntries[dateStr] = {
              clockIn: clockIn || "",
              clockOut: clockOut || "",
              comment: comment || "",
            };
          });

          return {
            correctionForm: {
              ...state.correctionForm,
              dateEntries: newDateEntries,
            },
          };
        }),

      // Apply clock-in/clock-out/comment to all selected dates
      applyToAllSelectedDates: () =>
        set((state) => {
          // This is a no-op in the store, the UI will handle it
          // But we can use this to trigger validation
          return state;
        }),

      setCorrectionValidationErrors: (errors) =>
        set({ correctionValidationErrors: errors }),

      resetCorrectionForm: () =>
        set({
          correctionForm: {
            dates: [],
            dateEntries: {},
            clockIn: "",
            clockOut: "",
            comment: "",
          },
          correctionValidationErrors: {},
        }),

      // Actions - Data fetching
      fetchTodayAttendance: async (employeeId) => {
        try {
          set({ loading: true });
          const date = new Date();
          const todayStr = formatDateToYYYYMMDD(date);
          const res = await externalApiClient.get(
            `/attendance?work_date=${todayStr}&employee_id=${employeeId}`
          );
          const attendanceData = Array.isArray(res.data)
            ? res.data[0]
            : res.data?.attendance?.[0] || res.data;
          set({ todayAttendance: attendanceData });
          return attendanceData;
        } catch (error) {
          console.error("Error fetching attendance:", error);
          const errorMsg = error?.response?.data?.error || error?.message;
          toast.error("Failed to load attendance data");
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      fetchAttendanceHistory: async (employeeId, month) => {
        try {
          const startDate = `${month}-01`;
          const lastDayOfMonth = new Date(
            new Date(`${month}-01`).setMonth(
              new Date(`${month}-01`).getMonth() + 1
            ) - 1
          );
          const endDate = formatDateToYYYYMMDD(lastDayOfMonth);

          const res = await externalApiClient.get(
            `/attendance?employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`
          );
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.attendance || res.data?.data || [];
          set({ attendanceHistory: data });
          return data;
        } catch (error) {
          console.error("Error fetching attendance history:", error);
          set({ attendanceHistory: [] });
          throw error;
        }
      },

      fetchMonthlyStats: async (employeeId, month) => {
        try {
          const res = await externalApiClient.get(
            `/reports/attendance/monthly?month=${month}&employeeId=${employeeId}`
          );
          const data = res.data;
          set({
            monthlyStats: {
              onTimePercentage: data?.on_time_percentage || 0,
              latePercentage: data?.late_percentage || 0,
              totalBreakHours: data?.total_break_hours || 0,
              totalWorkingHours: data?.total_working_hours || 0,
              totalDays: data?.total_days || 0,
              presentDays: data?.present_days || data?.days_present || 0,
              absentDays: data?.absent_days || 0,
              lateArrivals: data?.late_arrivals || 0,
              earlyDepartures: data?.early_departures || 0,
              overtimeHours: data?.overtime_hours || 0,
            },
          });
        } catch (error) {
          console.error("Error fetching monthly stats:", error);
        }
      },

      fetchWeeklyStats: async (employeeId) => {
        try {
          const today = new Date();
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

          const weekDays = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = formatDateToYYYYMMDD(date);

            try {
              const res = await externalApiClient.get(
                `/attendance?work_date=${dateStr}&employee_id=${employeeId}`
              );
              const attData = Array.isArray(res.data)
                ? res.data[0]
                : res.data?.attendance?.[0] || res.data;

              if (attData) {
                const clockIn =
                  attData.clock_in || attData.clockin || attData.clockin_time;
                const clockOut =
                  attData.clock_out ||
                  attData.clockout ||
                  attData.clockout_time;
                let hours = 0;
                if (clockIn && clockOut) {
                  const diff = new Date(clockOut) - new Date(clockIn);
                  hours = diff / (1000 * 60 * 60);
                }

                weekDays.push({
                  date: dateStr,
                  day: date.toLocaleDateString("en-US", { weekday: "short" }),
                  present: !!clockIn,
                  hours: hours.toFixed(1),
                });
              } else {
                weekDays.push({
                  date: dateStr,
                  day: date.toLocaleDateString("en-US", { weekday: "short" }),
                  present: false,
                  hours: 0,
                });
              }
            } catch (e) {
              weekDays.push({
                date: dateStr,
                day: date.toLocaleDateString("en-US", { weekday: "short" }),
                present: false,
                hours: 0,
              });
            }
          }

          const totalHours = weekDays.reduce(
            (sum, day) => sum + parseFloat(day.hours),
            0
          );
          set({
            weeklyStats: {
              days: weekDays,
              totalHours: totalHours.toFixed(1),
              averageHours: (totalHours / 7).toFixed(1),
            },
          });
        } catch (error) {
          console.error("Error fetching weekly stats:", error);
        }
      },

      // Actions - Clock in/out
      handleClockIn: async (employeeId) => {
        try {
          set({ clocking: true });
          const today = formatDateToYYYYMMDD(new Date());
          const now = new Date();
          const clockInTime = `${today} ${String(now.getHours()).padStart(
            2,
            "0"
          )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
            now.getSeconds()
          ).padStart(2, "0")}`;

          await externalApiClient.post("/attendance/clockin", {
            employee_id: employeeId,
            work_date: today,
            clock_in: clockInTime,
          });
          toast.success("Clocked in successfully!");
          await get().fetchTodayAttendance(employeeId);
        } catch (error) {
          const errorMsg =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message;
          if (
            errorMsg?.includes("table") ||
            errorMsg?.includes("doesn't exist")
          ) {
            toast.error(
              "Attendance system not configured. Please contact administrator."
            );
          } else {
            toast.error(errorMsg || "Failed to clock in");
          }
          throw error;
        } finally {
          set({ clocking: false });
        }
      },

      handleClockOut: async (employeeId) => {
        try {
          set({ clocking: true });
          const today = formatDateToYYYYMMDD(new Date());
          const now = new Date();
          const clockOutTime = `${today} ${String(now.getHours()).padStart(
            2,
            "0"
          )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
            now.getSeconds()
          ).padStart(2, "0")}`;

          await externalApiClient.post("/attendance/clockout", {
            employee_id: employeeId,
            work_date: today,
            clock_out: clockOutTime,
          });
          toast.success("Clocked out successfully!");
          await get().fetchTodayAttendance(employeeId);
        } catch (error) {
          const errorMsg =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message;
          toast.error(errorMsg || "Failed to clock out");
          throw error;
        } finally {
          set({ clocking: false });
        }
      },

      // Actions - Correction submission
      validateCorrectionForm: () => {
        const { correctionForm } = get();
        const errors = {};

        if (!correctionForm.dates || correctionForm.dates.length === 0) {
          errors.dates = "At least one date is required";
        }

        // Validate each date entry
        correctionForm.dates?.forEach((date) => {
          const dateStr = formatDateToYYYYMMDD(date);
          const entry = correctionForm.dateEntries[dateStr] || {};

          if (!entry.clockIn || entry.clockIn.trim() === "") {
            errors[`${dateStr}_clockIn`] = "Clock-in time is required";
          }

          if (!entry.clockOut || entry.clockOut.trim() === "") {
            errors[`${dateStr}_clockOut`] = "Clock-out time is required";
          }

          // Validate that clock-out is after clock-in
          if (entry.clockIn && entry.clockOut) {
            const clockInTime = new Date(`2000-01-01T${entry.clockIn}`);
            const clockOutTime = new Date(`2000-01-01T${entry.clockOut}`);
            if (clockOutTime <= clockInTime) {
              errors[`${dateStr}_clockOut`] =
                "Clock-out time must be after clock-in time";
            }
          }
        });

        set({ correctionValidationErrors: errors });
        return Object.keys(errors).length === 0;
      },

      submitCorrection: async (employeeId) => {
        const { correctionForm, validateCorrectionForm } = get();

        if (!validateCorrectionForm()) {
          toast.error("Please fill in all required fields correctly");
          return false;
        }

        try {
          set({ submittingCorrection: true });
          const dates = correctionForm.dates || [];
          let successCount = 0;
          let failCount = 0;
          const errors = [];

          // Process each date
          for (const date of dates) {
            try {
              const dateStr = formatDateToYYYYMMDD(date);
              const entry = correctionForm.dateEntries[dateStr] || {};
              const clockIn = entry.clockIn || correctionForm.clockIn;
              const clockOut = entry.clockOut || correctionForm.clockOut;
              const comment = entry.comment || correctionForm.comment || "";

              if (!clockIn || !clockOut) {
                throw new Error("Clock-in and clock-out times are required");
              }

              const clockInDateTime = `${dateStr} ${clockIn}:00`;
              const clockOutDateTime = `${dateStr} ${clockOut}:00`;

              console.log("Starting correction submission for date:", {
                dateStr,
                clockInDateTime,
                clockOutDateTime,
                employee_id: employeeId,
              });

              // Check if attendance record exists
              let attendanceRecord;
              try {
                const res = await externalApiClient.get(
                  `/attendance?work_date=${dateStr}&employee_id=${employeeId}`
                );
                const data = Array.isArray(res.data)
                  ? res.data[0]
                  : res.data?.attendance?.[0] || res.data;
                attendanceRecord = data;
              } catch (error) {
                attendanceRecord = null;
              }

              let attendanceId;

              if (attendanceRecord && attendanceRecord.id) {
                // Update existing record using PATCH
                attendanceId = attendanceRecord.id;
                await externalApiClient.patch(`/attendance/${attendanceId}`, {
                  clock_in: clockInDateTime,
                  clock_out: clockOutDateTime,
                  status: "present",
                });
              } else {
                // Create new record using clockin endpoint (which creates or updates)
                // First clock in to create the record
                const clockInRes = await externalApiClient.post(
                  "/attendance/clockin",
                  {
                    employee_id: employeeId,
                    work_date: dateStr,
                    clock_in: clockInDateTime,
                    source: "web",
                  }
                );

                // Then clock out to set the clock_out time
                await externalApiClient.post("/attendance/clockout", {
                  employee_id: employeeId,
                  work_date: dateStr,
                  clock_out: clockOutDateTime,
                  source: "web",
                });

                // Fetch the created record to get the ID
                const fetchRes = await externalApiClient.get(
                  `/attendance?work_date=${dateStr}&employee_id=${employeeId}`
                );
                const fetchedData = Array.isArray(fetchRes.data)
                  ? fetchRes.data[0]
                  : fetchRes.data?.attendance?.[0] ||
                    fetchRes.data?.data?.[0] ||
                    fetchRes.data;
                attendanceId = fetchedData?.id;
              }

              // Submit regularization request if comment provided
              if (attendanceId && comment?.trim()) {
                try {
                  await externalApiClient.post(
                    `/attendance/${attendanceId}/regularize`,
                    {
                      requested_by: employeeId,
                      kind: "regularization",
                      comment: comment,
                    }
                  );
                } catch (regularizeError) {
                  // Don't fail the whole process if regularization fails
                  console.warn("Regularization failed for date:", dateStr);
                }
              }

              successCount++;
            } catch (error) {
              failCount++;
              const errorMsg =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to submit correction";
              errors.push({
                date: formatDateToYYYYMMDD(date),
                error: errorMsg,
              });
              console.error(
                `Error submitting correction for ${formatDateToYYYYMMDD(
                  date
                )}:`,
                error
              );
            }
          }

          // Show results
          if (successCount > 0 && failCount === 0) {
            toast.success(
              `Successfully submitted corrections for ${successCount} date${
                successCount > 1 ? "s" : ""
              }!`
            );
          } else if (successCount > 0 && failCount > 0) {
            toast.warning(
              `Submitted ${successCount} correction${
                successCount > 1 ? "s" : ""
              } successfully, but ${failCount} failed.`
            );
          } else {
            toast.error(
              `Failed to submit corrections. ${
                errors[0]?.error || "Unknown error"
              }`
            );
          }

          get().resetCorrectionForm();
          set({ correctionDialogOpen: false });

          // Refresh data
          await get().fetchTodayAttendance(employeeId);
          await get().fetchAttendanceHistory(employeeId, get().selectedMonth);
          await get().fetchMonthlyStats(employeeId, get().selectedMonth);

          return successCount > 0;
        } catch (error) {
          console.error("Error in submitCorrection:", error);
          const errorMsg =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to submit correction request";
          toast.error(errorMsg);
          return false;
        } finally {
          set({ submittingCorrection: false });
        }
      },

      // Refresh all data
      refreshAll: async (employeeId) => {
        const { selectedMonth } = get();
        await Promise.all([
          get().fetchTodayAttendance(employeeId),
          get().fetchAttendanceHistory(employeeId, selectedMonth),
          get().fetchMonthlyStats(employeeId, selectedMonth),
          get().fetchWeeklyStats(employeeId),
        ]);
      },
    }),
    { name: "AttendanceStore" }
  )
);

export default useAttendanceStore;

"use client";
import { useEffect, useMemo, useState } from "react";

import { Calendar } from "../ui/calendar";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import apiClient from "@/app/services/internalApiClient";
import { formatTime } from "@/lib/dateTimeUtil";
import { Captions } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

function normalizeToHHMM(value) {
  if (!value) return "";
  // Already HH:mm
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  // Handle HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [hh, mm] = value.split(":");
    return `${hh}:${mm}`;
  }
  // Try parseable date string/number
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  // Fallback empty if unknown format
  return "";
}

function CustomDay(props) {
  const { selectedDay, attendance, onEdit } = props;
  console.log(props);
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth();
  const date = props.day.date;
  const month = date.getMonth();
  const attnIndex = format(date, "yyyy-MM-dd");
  const { status, clockin_time, clockout_time, id } = attendance[attnIndex] || {
    status: "",
    clockin_time: "",
    clockout_time: "",
    id: undefined,
  };

  function handleDateSelect(date) {
    alert(props.selectedDay);
  }

  return (
    <>
      <div
        className={cn(
          "w-full max-w-sm flex flex-col p-2 rounded",
          "min-h-[100px]",
          "me-2 last:me-0",
          month === currentMonth &&
            status == "" &&
            "bg-gray-50 hover:bg-gray-100",
          // Light-green background whenever attendance data exists
          month === currentMonth &&
            status !== "" &&
            "bg-green-100 hover:bg-green-200"
        )}
        //   onClick={() => handleDateSelect()}
      >
        <p
          className={`text-end ${
            month !== currentMonth ? "text-muted-foreground" : ""
          }`}
        >
          {format(date, "d")}
        </p>
        {status !== "" && (
          <>
            <span className="text-xs">
              {status === "P" ? "Present" : status === "A" ? "Absent" : status}
            </span>
            <span className="text-xs mt-0.5">
              {clockin_time && `Clock-in: ${formatTime(clockin_time)}`}
            </span>
            <span className="text-xs">
              {clockout_time && `Clock-out: ${formatTime(clockout_time)}`}
            </span>
            <div className="mt-1">
              <button
                type="button"
                className="text-xs underline text-primary hover:opacity-80"
                onClick={() =>
                  onEdit({
                    id,
                    date,
                    status,
                    clockin_time,
                    clockout_time,
                  })
                }
              >
                Edit
              </button>
            </div>
          </>
        )}
        {/* {status && <span className="text-xs">{status}</span>} */}
      </div>
    </>
  );
}

function CustomWeekdays(props) {
  // The weekdays. You can localize or change their order.
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="grid grid-cols-7">
      {weekdays.map((day, idx) => (
        <div
          key={day}
          className={`p-2 text-center text-xs font-semibold
            ${day === "Su" ? "text-red-500" : ""}
            ${day === "Sa" ? "text-blue-500" : ""}
          `}
        >
          {day}
        </div>
      ))}
    </div>
  );
}

function CustomCaption({ date, decreaseMonth, increaseMonth }) {
  const monthName = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  return (
    <div className="space-x-2 p-2 border-b">
      <button
        onClick={decreaseMonth}
        className="p-1 rounded hover:bg-gray-200"
        aria-label="Previous Month"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      <span className="text-lg font-semibold flex items-center space-x-1">
        <span className="lowercase">{monthName}</span>
        <span>{year}</span>
      </span>

      <button
        onClick={increaseMonth}
        className="p-1 rounded hover:bg-gray-200"
        aria-label="Next Month"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

const AttendanceCalendar = ({ data }) => {
  const [date, setDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState({
    id: undefined,
    date: undefined,
    status: "",
    clockin_time: "",
    clockout_time: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    const map = [];
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const dateKey = (item.date || "").split("T")[0];
        if (!dateKey) return;
        map[dateKey] = {
          employee_id: item?.employee_id,
          status: item?.status,
          clockin_time: item?.clockin_time,
          clockout_time: item?.clockout_time,
          approved: item?.approved,
          approver_id: item?.approver_id,
          approved_at: item?.approved_at,
          approver_remarks: item?.approver_remarks,
          id: item?.id,
        };
      });
    }
    setAttendanceMap(map);
  }, [data]);

  function openEditor(payload) {
    setSaveError("");
    setEditing({
      id: payload.id,
      date: payload.date,
      status: payload.status || "",
      clockin_time: normalizeToHHMM(payload.clockin_time || ""),
      clockout_time: normalizeToHHMM(payload.clockout_time || ""),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editing.date) {
      return;
    }
    try {
      setSaving(true);
      setSaveError("");
      const dateKey = format(editing.date, "yyyy-MM-dd");
      const toHHMMSS = (t) => (t ? `${t}:00` : "");
      const payload = {
        date: dateKey,
        employee_id: user?.id,
        clockin_time: toHHMMSS(editing.clockin_time),
        clockout_time: toHHMMSS(editing.clockout_time),
      };
      if (editing.id) {
        await apiClient.put(`/attendance/${editing.id}`, payload);
      } else {
        await apiClient.post(`/attendance`, payload);
      }
      // Optimistically update local map for immediate UI feedback
      setAttendanceMap((prev) => ({
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
          ...payload,
          // ensure stored values are consistent
          clockin_time: toHHMMSS(editing.clockin_time),
          clockout_time: toHHMMSS(editing.clockout_time),
          status: prev[dateKey]?.status || "P",
          id: editing.id || prev[dateKey]?.id,
        },
      }));
      setDialogOpen(false);
    } catch (err) {
      setSaveError("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="w-full p-6 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          // captionLayout="dropdown"
          className="w-full max-w-[1200px] rounded-md border shadow-sm"
          showOutsideDays={false}
          components={{
            Day: function (props) {
              return (
                <CustomDay
                  {...props}
                  selectedDay={date}
                  attendance={attendanceMap}
                  onEdit={openEditor}
                />
              );
            },
            //   Weekdays: (props) => <CustomWeekdays {...props} />,
          }}
          weekStartsOn="1"
        />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {editing.date ? format(editing.date, "EEEE, dd MMM yyyy") : ""}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1">Clock-in</label>
                <Input
                  type="time"
                  min="08:00"
                  max="20:00"
                  step="300"
                  value={editing.clockin_time || ""}
                  onChange={(e) =>
                    setEditing((prev) => ({
                      ...prev,
                      clockin_time: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs block mb-1">Clock-out</label>
                <Input
                  type="time"
                  min="08:00"
                  max="20:00"
                  step="300"
                  value={editing.clockout_time || ""}
                  onChange={(e) =>
                    setEditing((prev) => ({
                      ...prev,
                      clockout_time: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {saveError && (
              <div className="text-xs text-red-500">{saveError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttendanceCalendar;

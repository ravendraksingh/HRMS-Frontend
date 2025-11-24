"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Clock } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { getErrorMessage } from "@/lib/emsUtil";
import { useAuth } from "@/components/common/AuthContext";

const ShiftsPage = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newShift, setNewShift] = useState({
    shiftid: "",
    name: "",
    start_time: "09:30:00",
    end_time: "18:30:00",
    is_overnight: "N",
    grace_in_minutes: 30,
    default_break_minutes: 30,
    total_hours: "8.50",
    is_active: "Y",
  });
  const [draftShift, setDraftShift] = useState({});

  const { user } = useAuth();

  // Calculate total hours from start time, end time, and break minutes
  const calculateTotalHours = (startTime, endTime, breakMinutes) => {
    if (!startTime || !endTime) return "";
    
    try {
      const [startHours, startMins, startSecs = 0] = startTime.split(":").map(Number);
      const [endHours, endMins, endSecs = 0] = endTime.split(":").map(Number);
      
      // Convert to minutes
      const startTotalMinutes = startHours * 60 + startMins + startSecs / 60;
      const endTotalMinutes = endHours * 60 + endMins + endSecs / 60;
      
      // Calculate difference
      let diffMinutes = endTotalMinutes - startTotalMinutes;
      
      // Handle overnight shifts (if end time is before start time, add 24 hours)
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
      }
      
      // Subtract break minutes
      const breakMins = breakMinutes || 0;
      const totalMinutes = diffMinutes - breakMins;
      
      // Convert to hours (round to 2 decimal places)
      const totalHours = (totalMinutes / 60).toFixed(2);
      
      return totalHours;
    } catch (error) {
      console.error("Error calculating total hours:", error);
      return "";
    }
  };

  useEffect(() => {
    if (user?.empid) {
      fetchShifts();
    }
  }, [user?.empid]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await externalApiClient.get("/attendance/shifts");
      // API returns { shifts: [...] } format
      const shiftsData = res.data?.shifts || res.data || [];
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      setError("");
    } catch (e) {
      console.error("Error fetching shifts:", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Error fetching shifts";
      setError(errorMessage);
      toast.error(`Failed to load shifts: ${errorMessage}`);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setAdding(true);
    const defaultStartTime = "09:30:00";
    const defaultEndTime = "18:30:00";
    const defaultBreakMinutes = 30;
    const defaultGraceMinutes = 30;
    const calculatedTotalHours = calculateTotalHours(
      defaultStartTime,
      defaultEndTime,
      defaultBreakMinutes
    );
    setNewShift({
      shiftid: "",
      name: "",
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      is_overnight: "N",
      grace_in_minutes: defaultGraceMinutes,
      default_break_minutes: defaultBreakMinutes,
      total_hours: calculatedTotalHours,
      is_active: "Y",
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    const defaultStartTime = "09:30:00";
    const defaultEndTime = "18:30:00";
    const defaultBreakMinutes = 30;
    const defaultGraceMinutes = 30;
    const calculatedTotalHours = calculateTotalHours(
      defaultStartTime,
      defaultEndTime,
      defaultBreakMinutes
    );
    setNewShift({
      shiftid: "",
      name: "",
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      is_overnight: "N",
      grace_in_minutes: defaultGraceMinutes,
      default_break_minutes: defaultBreakMinutes,
      total_hours: calculatedTotalHours,
      is_active: "Y",
    });
    setError("");
  };

  const handleNewShiftChange = (e) => {
    const { name, value } = e.target;
    const updatedShift = {
      ...newShift,
      [name]:
        name === "shiftid"
          ? value.toUpperCase() // Always convert shiftid to uppercase
          : name === "is_overnight" ||
            name === "grace_in_minutes" ||
            name === "default_break_minutes"
          ? parseInt(value) || (name === "default_break_minutes" ? 30 : 0)
          : value,
    };
    
    // Recalculate total_hours when start_time, end_time, or default_break_minutes changes
    if (name === "start_time" || name === "end_time" || name === "default_break_minutes") {
      updatedShift.total_hours = calculateTotalHours(
        updatedShift.start_time,
        updatedShift.end_time,
        updatedShift.default_break_minutes
      );
    }
    
    setNewShift(updatedShift);
  };

  const handleSaveNew = async () => {
    if (
      !newShift.shiftid ||
      !newShift.shiftid.trim() ||
      !newShift.name ||
      !newShift.name.trim() ||
      !newShift.start_time ||
      !newShift.end_time ||
      !newShift.default_break_minutes
    ) {
      setError("Shift ID, name, start time, end time, and break minutes are required");
      toast.error("Shift ID, name, start time, end time, and break minutes are required");
      return;
    }
    try {
      // Calculate total_hours before saving
      const calculatedTotalHours = calculateTotalHours(
        newShift.start_time,
        newShift.end_time,
        newShift.default_break_minutes
      );
      
      // Prepare payload, mapping form fields to API fields
      const { grace_in_minutes, ...shiftPayload } = newShift;
      const res = await externalApiClient.post("/attendance/shifts", {
        ...shiftPayload,
        shiftid: newShift.shiftid.trim().toUpperCase(), // Ensure uppercase
        name: newShift.name.trim(),
        grace_duration_minutes: newShift.grace_in_minutes || 0, // Map grace_in_minutes to grace_duration_minutes
        total_hours: calculatedTotalHours || undefined,
      });
      console.log("Add shift response:", res.data);
      toast.success("Shift added successfully!");
      handleCancelNew();
      setError("");
      await fetchShifts();
    } catch (error) {
      console.error("Error adding shift:", error);
      const errorMsg = getErrorMessage(error, "Failed to add shift");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (shift) => {
    setEditingId(shift.shiftid || shift.id);
    // Map API fields to form fields
    const breakMinutes = shift.break_duration_minutes || shift.default_break_minutes || 30;
    const graceMinutes = shift.grace_duration_minutes || shift.grace_in_minutes || 0;
    const draft = {
      ...shift,
      default_break_minutes: breakMinutes,
      grace_in_minutes: graceMinutes, // Map grace_duration_minutes to grace_in_minutes for form
      is_overnight: shift.is_overnight || 0, // Keep existing field if present
      is_active: shift.is_active || "Y", // Default to active if not set
    };
    // Calculate total_hours if we have start_time and end_time
    if (draft.start_time && draft.end_time) {
      draft.total_hours = calculateTotalHours(
        draft.start_time,
        draft.end_time,
        draft.default_break_minutes
      );
    }
    setDraftShift(draft);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftShift({});
    setError("");
  };

  const handleDraftShiftChange = (field, value) => {
    let processedValue = value;
    
    // Handle numeric fields
    if (field === "default_break_minutes") {
      processedValue = parseInt(value) || 30;
    } else if (field === "grace_in_minutes") {
      processedValue = parseInt(value) || 0;
    } else if (field === "is_overnight") {
      processedValue = parseInt(value) || 0;
    }
    
    const updatedDraft = {
      ...draftShift,
      [field]: processedValue,
    };
    
    // Recalculate total_hours when start_time, end_time, or default_break_minutes changes
    if (field === "start_time" || field === "end_time" || field === "default_break_minutes") {
      updatedDraft.total_hours = calculateTotalHours(
        updatedDraft.start_time,
        updatedDraft.end_time,
        updatedDraft.default_break_minutes
      );
    }
    
    setDraftShift(updatedDraft);
  };

  const handleSaveEdit = async (shift) => {
    if (
      !draftShift.shiftid ||
      !draftShift.shiftid.trim() ||
      !draftShift.name ||
      !draftShift.name.trim() ||
      !draftShift.start_time ||
      !draftShift.end_time ||
      !draftShift.default_break_minutes
    ) {
      setError("Shift ID, name, start time, end time, and break minutes are required");
      toast.error("Shift ID, name, start time, end time, and break minutes are required");
      return;
    }
    try {
      const shiftId = shift.shiftid || shift.id;
      // Calculate total_hours before saving
      const calculatedTotalHours = calculateTotalHours(
        draftShift.start_time,
        draftShift.end_time,
        draftShift.default_break_minutes
      );
      
      // Prepare payload, mapping form fields to API fields
      // Exclude form-only fields and API fields that we'll map explicitly
      const { grace_in_minutes, default_break_minutes, grace_duration_minutes, break_duration_minutes, ...draftPayload } = draftShift;
      const payload = {
        ...draftPayload,
        shiftid: draftShift.shiftid?.trim().toUpperCase(), // Ensure uppercase
        name: draftShift.name?.trim() || draftShift.name,
        // Map form fields back to API fields
        break_duration_minutes:
          draftShift.default_break_minutes ||
          draftShift.break_duration_minutes ||
          30,
        grace_duration_minutes: draftShift.grace_in_minutes || 0, // Map grace_in_minutes to grace_duration_minutes
        total_hours: calculatedTotalHours || undefined,
      };
      console.log("Update shift payload:", payload);
      const res = await externalApiClient.patch(
        `/attendance/shifts/${shiftId}`,
        payload
      );
      console.log("Update shift response:", res.data);
      toast.success("Shift updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchShifts();
    } catch (error) {
      console.error("Error updating shift:", error);
      const errorMsg = getErrorMessage(error, "Failed to update shift");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (shift) => {
    if (!confirm(`Are you sure you want to delete ${shift.name}?`)) return;
    try {
      const shiftId = shift.shiftid || shift.id;
      await externalApiClient.delete(`/attendance/shifts/${shiftId}`);
      toast.success("Shift deleted successfully!");
      await fetchShifts();
    } catch (error) {
      console.error("Error deleting shift:", error);
      const errorMsg = getErrorMessage(error, "Failed to delete shift");
      toast.error(errorMsg);
    }
  };

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold mb-3">Shifts</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1000px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Shift List</h2>
          {!adding && (
            <Button onClick={handleAddNew} disabled={editingId !== null}>
              <Clock className="h-4 w-4 mr-2" />
              Add New Shift
            </Button>
          )}
        </div>

        {adding && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Shift</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shiftid" className="mb-1">
                    Shift ID *
                  </Label>
                  <Input
                    type="text"
                    name="shiftid"
                    id="shiftid"
                    value={newShift.shiftid}
                    onChange={handleNewShiftChange}
                    placeholder="GENERAL"
                    required
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="mb-1">
                    Name *
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    value={newShift.name}
                    onChange={handleNewShiftChange}
                    placeholder="Enter shift name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_time" className="mb-1">
                    Start Time * (HH:MM:SS)
                  </Label>
                  <Input
                    type="text"
                    name="start_time"
                    id="start_time"
                    placeholder="09:00:00"
                    value={newShift.start_time}
                    onChange={handleNewShiftChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time" className="mb-1">
                    End Time * (HH:MM:SS)
                  </Label>
                  <Input
                    type="text"
                    name="end_time"
                    id="end_time"
                    placeholder="18:00:00"
                    value={newShift.end_time}
                    onChange={handleNewShiftChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grace_in_minutes" className="mb-1">
                    Grace Period (minutes)
                  </Label>
                  <Input
                    type="number"
                    name="grace_in_minutes"
                    id="grace_in_minutes"
                    value={newShift.grace_in_minutes}
                    onChange={handleNewShiftChange}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="default_break_minutes" className="mb-1">
                    Default Break (minutes) *
                  </Label>
                  <Input
                    type="number"
                    name="default_break_minutes"
                    id="default_break_minutes"
                    value={newShift.default_break_minutes}
                    onChange={handleNewShiftChange}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="is_overnight" className="mb-1">
                    Overnight Shift
                  </Label>
                  <Select
                    value={String(newShift.is_overnight)}
                    onValueChange={(value) =>
                      setNewShift({
                        ...newShift,
                        is_overnight: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="is_overnight" className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="total_hours" className="mb-1">
                    Total Hours
                  </Label>
                  <Input
                    type="number"
                    name="total_hours"
                    id="total_hours"
                    value={newShift.total_hours}
                    placeholder="8.50"
                    step="0.01"
                    disabled
                    readOnly
                    style={{
                      backgroundColor: "#f3f4f6",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="is_active" className="mb-1">
                    Active Status
                  </Label>
                  <Select
                    value={newShift.is_active}
                    onValueChange={(value) =>
                      setNewShift({
                        ...newShift,
                        is_active: value,
                      })
                    }
                  >
                    <SelectTrigger id="is_active" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Active</SelectItem>
                      <SelectItem value="N">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveNew}>Save</Button>
                <Button onClick={handleCancelNew} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              Loading shifts...
            </CardContent>
          </Card>
        ) : shifts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No shifts found. Click "Add New Shift" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => {
              const shiftId = shift.shiftid || shift.id;
              return (
                <Card key={shiftId}>
                  <CardContent className="p-6">
                    {editingId === shiftId ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-1">Shift ID *</Label>
                          <Input
                            value={draftShift.shiftid || ""}
                            placeholder="GENERAL"
                            required
                            disabled
                            readOnly
                            style={{
                              textTransform: "uppercase",
                              backgroundColor: "#f3f4f6",
                              cursor: "not-allowed",
                            }}
                          />
                        </div>
                        <div>
                          <Label className="mb-1">Name *</Label>
                          <Input
                            value={draftShift.name || ""}
                            onChange={(e) =>
                              handleDraftShiftChange("name", e.target.value)
                            }
                            placeholder="Enter shift name"
                            required
                          />
                        </div>
                        <div>
                          <Label className="mb-1">Start Time *</Label>
                          <Input
                            value={draftShift.start_time || ""}
                            onChange={(e) =>
                              handleDraftShiftChange("start_time", e.target.value)
                            }
                            placeholder="09:00:00"
                            required
                          />
                        </div>
                        <div>
                          <Label className="mb-1">End Time *</Label>
                          <Input
                            value={draftShift.end_time || ""}
                            onChange={(e) =>
                              handleDraftShiftChange("end_time", e.target.value)
                            }
                            placeholder="18:00:00"
                            required
                          />
                        </div>
                        <div>
                          <Label className="mb-1">Grace Period (minutes)</Label>
                          <Input
                            type="number"
                            value={draftShift.grace_in_minutes || 0}
                            onChange={(e) =>
                              handleDraftShiftChange("grace_in_minutes", e.target.value)
                            }
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="mb-1">
                            Default Break (minutes) *
                          </Label>
                          <Input
                            type="number"
                            value={draftShift.default_break_minutes || 30}
                            onChange={(e) =>
                              handleDraftShiftChange("default_break_minutes", e.target.value)
                            }
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <Label className="mb-1">Overnight Shift</Label>
                          <Select
                            value={String(draftShift.is_overnight ?? 0)}
                            onValueChange={(value) =>
                              handleDraftShiftChange("is_overnight", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">No</SelectItem>
                              <SelectItem value="1">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1">Total Hours</Label>
                          <Input
                            type="number"
                            value={draftShift.total_hours || ""}
                            placeholder="8.50"
                            step="0.01"
                            disabled
                            readOnly
                            style={{
                              backgroundColor: "#f3f4f6",
                              cursor: "not-allowed",
                            }}
                          />
                        </div>
                        <div>
                          <Label className="mb-1">Active Status</Label>
                          <Select
                            value={draftShift.is_active || "Y"}
                            onValueChange={(value) =>
                              handleDraftShiftChange("is_active", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">Active</SelectItem>
                              <SelectItem value="N">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(shift)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {shift.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {shift.start_time} - {shift.end_time}
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge variant="outline">
                                Grace: {shift.grace_duration_minutes || shift.grace_in_minutes || 0} min
                              </Badge>
                              <Badge variant="outline">
                                Break:{" "}
                                {shift.break_duration_minutes ||
                                  shift.default_break_minutes ||
                                  0}{" "}
                                min
                              </Badge>
                              {shift.total_hours && (
                                <Badge variant="outline">
                                  Total: {shift.total_hours} hrs
                                </Badge>
                              )}
                              {shift.is_active === "Y" && (
                                <Badge variant="default">Active</Badge>
                              )}
                              {shift.is_active === "N" && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                              {shift.is_overnight === 1 && (
                                <Badge variant="default">Overnight Shift</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(shift)}
                              disabled={adding}
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(shift)}
                              disabled={adding}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftsPage;

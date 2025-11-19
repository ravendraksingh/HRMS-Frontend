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
import { useAuth } from "@/components/auth/AuthContext";
import { Clock } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";

const ShiftsPage = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newShift, setNewShift] = useState({
    name: "",
    start_time: "",
    end_time: "",
    is_overnight: 0,
    grace_in_minutes: 0,
    default_break_minutes: 0,
  });
  const [draftShift, setDraftShift] = useState({});

  useEffect(() => {
    if (user?.user_id) {
      fetchShifts();
    }
  }, [user?.user_id]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await externalApiClient.get("/attendance/shifts");
      setShifts(res.data.shifts);
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
    setNewShift({
      name: "",
      start_time: "",
      end_time: "",
      is_overnight: 0,
      grace_in_minutes: 0,
      default_break_minutes: 0,
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewShift({
      name: "",
      start_time: "",
      end_time: "",
      is_overnight: 0,
      grace_in_minutes: 0,
      default_break_minutes: 0,
    });
    setError("");
  };

  const handleNewShiftChange = (e) => {
    const { name, value } = e.target;
    setNewShift((prev) => ({
      ...prev,
      [name]:
        name === "is_overnight" ||
        name === "grace_in_minutes" ||
        name === "default_break_minutes"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSaveNew = async () => {
    if (
      !newShift.name ||
      !newShift.name.trim() ||
      !newShift.start_time ||
      !newShift.end_time
    ) {
      setError("Name, start time, and end time are required");
      toast.error("Name, start time, and end time are required");
      return;
    }
    if (!user?.org_id && !user?.organization_id) {
      setError("Organization ID not found");
      toast.error("Organization ID not found");
      return;
    }
    try {
      const res = await externalApiClient.post("/attendance/shifts", {
        ...newShift,
        name: newShift.name.trim(),
        organization_id: user?.org_id || user?.organization_id,
      });
      console.log("Add shift response:", res.data);
      toast.success("Shift added successfully!");
      handleCancelNew();
      setError("");
      await fetchShifts();
    } catch (error) {
      console.error("Error adding shift:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to add shift";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (shift) => {
    setEditingId(shift.id);
    setDraftShift({ ...shift });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftShift({});
    setError("");
  };

  const handleSaveEdit = async (shift) => {
    try {
      const res = await externalApiClient.patch(`/attendance/shifts/${shift.id}`, {
        ...draftShift,
        name: draftShift.name?.trim() || draftShift.name,
      });
      console.log("Update shift response:", res.data);
      toast.success("Shift updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchShifts();
    } catch (error) {
      console.error("Error updating shift:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update shift";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (shift) => {
    if (!confirm(`Are you sure you want to delete ${shift.name}?`)) return;
    try {
      await externalApiClient.delete(`/attendance/shifts/${shift.id}`);
      toast.success("Shift deleted successfully!");
      await fetchShifts();
    } catch (error) {
      console.error("Error deleting shift:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete shift";
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
                    Default Break (minutes)
                  </Label>
                  <Input
                    type="number"
                    name="default_break_minutes"
                    id="default_break_minutes"
                    value={newShift.default_break_minutes}
                    onChange={handleNewShiftChange}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="is_overnight" className="mb-1">
                    Overnight Shift
                  </Label>
                  <Select
                    value={String(newShift.is_overnight)}
                    onValueChange={(value) =>
                      setNewShift({ ...newShift, is_overnight: parseInt(value) })
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
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardContent className="p-6">
                  {editingId === shift.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1">Name *</Label>
                        <Input
                          value={draftShift.name || ""}
                          onChange={(e) =>
                            setDraftShift({
                              ...draftShift,
                              name: e.target.value,
                            })
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
                            setDraftShift({
                              ...draftShift,
                              start_time: e.target.value,
                            })
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
                            setDraftShift({
                              ...draftShift,
                              end_time: e.target.value,
                            })
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
                            setDraftShift({
                              ...draftShift,
                              grace_in_minutes: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Default Break (minutes)</Label>
                        <Input
                          type="number"
                          value={draftShift.default_break_minutes || 0}
                          onChange={(e) =>
                            setDraftShift({
                              ...draftShift,
                              default_break_minutes:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Overnight Shift</Label>
                        <Select
                          value={String(draftShift.is_overnight ?? 0)}
                          onValueChange={(value) =>
                            setDraftShift({
                              ...draftShift,
                              is_overnight: parseInt(value),
                            })
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
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={() => handleSaveEdit(shift)}>
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
                              Grace: {shift.grace_in_minutes || 0} min
                            </Badge>
                            <Badge variant="outline">
                              Break: {shift.default_break_minutes || 0} min
                            </Badge>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftsPage;

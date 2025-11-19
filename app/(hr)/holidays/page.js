"use client";

import { useEffect, useState, useCallback } from "react";
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
import apiClient from "@/app/services/internalApiClient";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/auth/AuthContext";
import { Calendar } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { formatDateDisplay } from "@/lib/formatDateDisplay";

const HolidaysPage = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [newHoliday, setNewHoliday] = useState({
    holiday_date: "",
    name: "",
    type: "company",
    is_optional: 0,
  });
  const [draftHoliday, setDraftHoliday] = useState({});

  const fetchHolidays = useCallback(async () => {
    if (!user?.user_id) {
      return;
    }
    try {
      setLoading(true);
      const res = await externalApiClient.get(`/holidays?year=${year}`);
      setHolidays(res.data.holidays);
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
  }, [year, user?.user_id]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleAddNew = () => {
    setAdding(true);
    setNewHoliday({
      holiday_date: "",
      name: "",
      type: "company",
      is_optional: 0,
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewHoliday({
      holiday_date: "",
      name: "",
      type: "company",
      is_optional: 0,
    });
    setError("");
  };

  const handleNewHolidayChange = (e) => {
    const { name, value } = e.target;
    setNewHoliday((prev) => ({
      ...prev,
      [name]: name === "is_optional" ? parseInt(value) : value,
    }));
  };

  const handleSaveNew = async () => {
    if (
      !newHoliday.holiday_date ||
      !newHoliday.name ||
      !newHoliday.name.trim()
    ) {
      setError("Date and name are required");
      toast.error("Date and name are required");
      return;
    }
    if (!user?.organization_id) {
      setError("Organization ID not found");
      toast.error("Organization ID not found");
      return;
    }
    try {
      const res = await externalApiClient.post("/holidays", {
        ...newHoliday,
        name: newHoliday.name.trim(),
        organization_id: user?.organization_id,
      });
      console.log("Add holiday response:", res.data);
      toast.success("Holiday added successfully!");
      handleCancelNew();
      setError("");
      await fetchHolidays();
    } catch (error) {
      console.error("Error adding holiday:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to add holiday";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Helper function to normalize date to YYYY-MM-DD format for date inputs
  const normalizeDateForInput = (dateValue) => {
    if (!dateValue) return "";

    try {
      let date;

      // If it's already in YYYY-MM-DD format, return as is
      if (
        typeof dateValue === "string" &&
        dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        return dateValue;
      }

      // If it's already a Date object
      if (dateValue instanceof Date) {
        date = dateValue;
      }
      // If it's a string, try to parse it
      else if (typeof dateValue === "string") {
        // Try parsing as ISO string first
        date = new Date(dateValue);

        // If that fails, try adding time component
        if (isNaN(date.getTime())) {
          date = new Date(dateValue + "T00:00:00");
        }
      }
      // If it's a number (timestamp)
      else if (typeof dateValue === "number") {
        date = new Date(dateValue);
      } else {
        return "";
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      // Format as YYYY-MM-DD for date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error normalizing date:", error, dateValue);
      return "";
    }
  };

  const handleEdit = (holiday) => {
    setEditingId(holiday.id);
    setDraftHoliday({
      ...holiday,
      holiday_date: normalizeDateForInput(holiday.holiday_date),
    });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftHoliday({});
    setError("");
  };

  const handleSaveEdit = async (holiday) => {
    try {
      const res = await externalApiClient.patch(`/holidays/${holiday.id}`, {
        ...draftHoliday,
        name: draftHoliday.name?.trim() || draftHoliday.name,
      });
      console.log("Update holiday response:", res.data);
      toast.success("Holiday updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchHolidays();
    } catch (error) {
      console.error("Error updating holiday:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update holiday";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (holiday) => {
    if (!confirm(`Are you sure you want to delete ${holiday.name}?`)) return;
    try {
      await externalApiClient.delete(`/holidays/${holiday.id}`);
      toast.success("Holiday deleted successfully!");
      await fetchHolidays();
    } catch (error) {
      console.error("Error deleting holiday:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete holiday";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="px-5 max-w-[1000px] mx-auto">
      <h1 className="text-3xl text-center font-bold mb-3">Holidays</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="year" className="text-base font-semibold">
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
          {!adding && (
            <Button onClick={handleAddNew} disabled={editingId !== null}>
              <Calendar className="h-4 w-4 mr-2" />
              Add New Holiday
            </Button>
          )}
        </div>

        {adding && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Holiday</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="holiday_date" className="mb-1">
                    Date *
                  </Label>
                  <Input
                    type="date"
                    name="holiday_date"
                    id="holiday_date"
                    value={newHoliday.holiday_date}
                    onChange={handleNewHolidayChange}
                    required
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
                    value={newHoliday.name}
                    onChange={handleNewHolidayChange}
                    placeholder="Enter holiday name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="mb-1">
                    Type
                  </Label>
                  <Select
                    value={newHoliday.type}
                    onValueChange={(value) =>
                      setNewHoliday({ ...newHoliday, type: value })
                    }
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="is_optional" className="mb-1">
                    Optional
                  </Label>
                  <Select
                    value={String(newHoliday.is_optional)}
                    onValueChange={(value) =>
                      setNewHoliday({
                        ...newHoliday,
                        is_optional: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="is_optional" className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No (Mandatory)</SelectItem>
                      <SelectItem value="1">Yes (Optional)</SelectItem>
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
              Loading holidays...
            </CardContent>
          </Card>
        ) : holidays.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No holidays found for {year}. Click "Add New Holiday" to create
              one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {holidays.map((holiday) => (
              <Card key={holiday.id}>
                <CardContent className="p-6">
                  {editingId === holiday.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1">Date *</Label>
                        <Input
                          type="date"
                          value={
                            normalizeDateForInput(draftHoliday.holiday_date) ||
                            ""
                          }
                          onChange={(e) =>
                            setDraftHoliday({
                              ...draftHoliday,
                              holiday_date: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Name *</Label>
                        <Input
                          value={draftHoliday.name || ""}
                          onChange={(e) =>
                            setDraftHoliday({
                              ...draftHoliday,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter holiday name"
                          required
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Type</Label>
                        <Select
                          value={draftHoliday.type || "company"}
                          onValueChange={(value) =>
                            setDraftHoliday({ ...draftHoliday, type: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="regional">Regional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1">Optional</Label>
                        <Select
                          value={String(draftHoliday.is_optional ?? 0)}
                          onValueChange={(value) =>
                            setDraftHoliday({
                              ...draftHoliday,
                              is_optional: parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No (Mandatory)</SelectItem>
                            <SelectItem value="1">Yes (Optional)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(holiday)}
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
                            {holiday.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Date: {formatDateDisplay(holiday.holiday_date)}
                          </p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline">
                              {holiday.type || "company"}
                            </Badge>
                            <Badge
                              variant={
                                holiday.is_optional === 1
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {holiday.is_optional === 1
                                ? "Optional"
                                : "Mandatory"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(holiday)}
                            disabled={adding}
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(holiday)}
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

export default HolidaysPage;

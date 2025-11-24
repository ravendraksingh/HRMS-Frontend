"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { Calendar } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import SelectDepartment from "@/components/common/SelectDepartment";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";
import { getErrorMessage } from "@/lib/emsUtil";

const ManageHolidaysPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [calendarId, setCalendarId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filter state for calendar scope
  const [filters, setFilters] = useState({
    scope: "organization", // 'organization', 'location', 'department'
    locationId: "",
    departmentId: "",
  });

  const [newHoliday, setNewHoliday] = useState({
    holiday_date: "",
    name: "",
    is_optional: "N",
    is_override: "N",
    description: "",
  });
  const [draftHoliday, setDraftHoliday] = useState({});
  const { user } = useAuth();
  const calendarIdRef = useRef(calendarId);
  const fetchHolidaysRef = useRef();

  // Keep ref in sync with state
  useEffect(() => {
    calendarIdRef.current = calendarId;
  }, [calendarId]);

  // Fetch departments and locations
  useEffect(() => {
    fetchDepartments();
    fetchLocations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const deptData = res.data?.departments || res.data || [];
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await externalApiClient.get("/locations");
      const locData = res.data?.locations || res.data || [];
      setLocations(Array.isArray(locData) ? locData : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Fetch calendar_id for the selected scope
  const fetchCalendarId = useCallback(async () => {
    try {
      let url = `/calendars?calendar_type=${filters.scope.toUpperCase()}&year=${year}`;

      if (filters.scope === "location" && filters.locationId) {
        url += `&location_id=${filters.locationId}`;
      } else if (filters.scope === "department" && filters.departmentId) {
        url += `&department_id=${filters.departmentId}`;
      }

      const res = await externalApiClient.get(url);
      const calendars = res.data?.calendars || res.data || [];

      // Get the first calendar for the selected scope/year
      if (calendars.length > 0) {
        const calendar = calendars[0];
        const id = calendar.calendar_id || calendar.id || calendar.calendarId;
        return id;
      }

      // If no calendar exists, return null (will need to create one)
      return null;
    } catch (error) {
      console.error("Error fetching calendar ID:", error);
      return null;
    }
  }, [filters.scope, filters.locationId, filters.departmentId, year]);

  // Fetch holidays with calendar_id
  const fetchHolidays = useCallback(
    async (forceResetCalendarId = false) => {
      if (!user?.empid) {
        return;
      }

      // Validate required IDs based on scope
      if (filters.scope === "location" && !filters.locationId) {
        setHolidays([]);
        setLoading(false);
        return;
      }
      if (filters.scope === "department" && !filters.departmentId) {
        setHolidays([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // First, get the calendar_id - use ref to avoid dependency issues
        let currentCalendarId = forceResetCalendarId
          ? null
          : calendarIdRef.current;
        if (!currentCalendarId) {
          currentCalendarId = await fetchCalendarId();
          if (currentCalendarId) {
            setCalendarId(currentCalendarId);
            calendarIdRef.current = currentCalendarId;
          } else {
            // No calendar exists yet - show empty list
            setHolidays([]);
            setError("");
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
        const errorMessage = getErrorMessage(e, "Error fetching holidays");
        setError(errorMessage);
        toast.error(`Failed to load holidays: ${errorMessage}`);
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    },
    [
      year,
      user?.empid,
      fetchCalendarId,
      filters.scope,
      filters.locationId,
      filters.departmentId,
    ]
  );

  // Keep fetchHolidays ref in sync
  useEffect(() => {
    fetchHolidaysRef.current = fetchHolidays;
  }, [fetchHolidays]);

  useEffect(() => {
    // Reset calendar_id when filters change and fetch holidays
    if (!user?.empid) {
      return;
    }

    setCalendarId(null);
    calendarIdRef.current = null;
    if (fetchHolidaysRef.current) {
      fetchHolidaysRef.current(true);
    }
  }, [
    filters.scope,
    filters.locationId,
    filters.departmentId,
    year,
    user?.empid,
  ]);

  const handleAddNew = () => {
    setAdding(true);
    setNewHoliday({
      holiday_date: "",
      name: "",
      is_optional: "N",
      is_override: "N",
      description: "",
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewHoliday({
      holiday_date: "",
      name: "",
      is_optional: "N",
      is_override: "N",
      description: "",
    });
    setError("");
  };

  const handleNewHolidayChange = (e) => {
    const { name, value } = e.target;
    setNewHoliday((prev) => ({
      ...prev,
      [name]: value,
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

    // Validate calendar_id
    if (!calendarId) {
      setError("Please select a calendar scope first");
      toast.error("Please select a calendar scope first");
      return;
    }

    try {
      const res = await externalApiClient.post("/holidays", {
        calendar_id: calendarId,
        name: newHoliday.name.trim(),
        holiday_date: newHoliday.holiday_date,
        is_optional: newHoliday.is_optional || "N",
        is_override: newHoliday.is_override || "N",
        description: newHoliday.description || "",
      });
      console.log("Add holiday response:", res.data);
      toast.success("Holiday added successfully!");
      handleCancelNew();
      setError("");
      await fetchHolidays();
    } catch (error) {
      console.error("Error adding holiday:", error);
      const errorMsg = getErrorMessage(error, "Failed to add holiday");
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
      is_optional:
        holiday.is_optional === "Y" || holiday.is_optional === 1 ? "Y" : "N",
      is_override:
        holiday.is_override === "Y" || holiday.is_override === 1 ? "Y" : "N",
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
        name: draftHoliday.name?.trim() || draftHoliday.name,
        holiday_date: draftHoliday.holiday_date,
        is_optional: draftHoliday.is_optional || "N",
        is_override: draftHoliday.is_override || "N",
        description: draftHoliday.description || "",
      });
      console.log("Update holiday response:", res.data);
      toast.success("Holiday updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchHolidays();
    } catch (error) {
      console.error("Error updating holiday:", error);
      const errorMsg = getErrorMessage(error, "Failed to update holiday");
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
      const errorMsg = getErrorMessage(error, "Failed to delete holiday");
      toast.error(errorMsg);
    }
  };

  return (
    <div className="px-5 max-w-[1000px] mx-auto">
      <h1 className="text-3xl text-center font-bold mb-3">Manage Holidays</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Scope:</Label>
              <Select
                value={filters.scope}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    scope: value,
                    locationId: value === "location" ? prev.locationId : "",
                    departmentId:
                      value === "department" ? prev.departmentId : "",
                  }));
                }}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.scope === "location" && (
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Location:</Label>
                <Select
                  value={filters.locationId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, locationId: value }))
                  }
                >
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem
                        key={loc.locationid || loc.id}
                        value={String(loc.locationid || loc.id)}
                      >
                        {loc.name || loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filters.scope === "department" && (
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Dept:</Label>
                <Select
                  value={filters.departmentId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, departmentId: value }))
                  }
                >
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.deptid || dept.id}
                        value={String(dept.deptid || dept.id)}
                      >
                        {dept.name || dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
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
                  <Label htmlFor="is_optional" className="mb-1">
                    Optional
                  </Label>
                  <Select
                    value={String(newHoliday.is_optional)}
                    onValueChange={(value) =>
                      setNewHoliday({
                        ...newHoliday,
                        is_optional: value,
                      })
                    }
                  >
                    <SelectTrigger id="is_optional" className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">No (Mandatory)</SelectItem>
                      <SelectItem value="Y">Yes (Optional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="is_override" className="mb-1">
                    Override
                  </Label>
                  <Select
                    value={String(newHoliday.is_override || "N")}
                    onValueChange={(value) =>
                      setNewHoliday({
                        ...newHoliday,
                        is_override: value,
                      })
                    }
                  >
                    <SelectTrigger id="is_override" className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">No</SelectItem>
                      <SelectItem value="Y">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description" className="mb-1">
                    Description
                  </Label>
                  <Input
                    type="text"
                    name="description"
                    id="description"
                    value={newHoliday.description || ""}
                    onChange={handleNewHolidayChange}
                    placeholder="Enter holiday description (optional)"
                  />
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
              <div className="flex flex-col items-center gap-4">
                <Spinner size={32} />
                <p className="text-gray-600">Loading holidays...</p>
              </div>
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
                        <Label className="mb-1">Optional</Label>
                        <Select
                          value={String(draftHoliday.is_optional || "N")}
                          onValueChange={(value) =>
                            setDraftHoliday({
                              ...draftHoliday,
                              is_optional: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="N">No (Mandatory)</SelectItem>
                            <SelectItem value="Y">Yes (Optional)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1">Override</Label>
                        <Select
                          value={String(draftHoliday.is_override || "N")}
                          onValueChange={(value) =>
                            setDraftHoliday({
                              ...draftHoliday,
                              is_override: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="N">No</SelectItem>
                            <SelectItem value="Y">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="mb-1">Description</Label>
                        <Input
                          value={draftHoliday.description || ""}
                          onChange={(e) =>
                            setDraftHoliday({
                              ...draftHoliday,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter holiday description (optional)"
                        />
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
                            <Badge
                              variant={
                                holiday.is_optional === "Y" ||
                                holiday.is_optional === 1
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {holiday.is_optional === "Y" ||
                              holiday.is_optional === 1
                                ? "Optional"
                                : "Mandatory"}
                            </Badge>
                            {(holiday.is_override === "Y" ||
                              holiday.is_override === 1) && (
                              <Badge variant="outline">Override</Badge>
                            )}
                          </div>
                          {holiday.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {holiday.description}
                            </p>
                          )}
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

export default ManageHolidaysPage;

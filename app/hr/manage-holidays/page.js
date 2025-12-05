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
import SelectLocation from "@/components/common/SelectLocation";
import SelectFinancialYear from "@/components/common/SelectFinancialYear";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";
import { getErrorMessage } from "@/lib/emsUtil";
import { getFYFromDate, getCurrentFinancialYear } from "@/lib/organizationUtil";

const ManageHolidaysPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [calendarId, setCalendarId] = useState(null);

  // Filter state for calendar scope
  const [filters, setFilters] = useState({
    scope: "organization", // 'organization', 'location', 'department'
    locationId: "",
    departmentId: "",
  });

  const [newHoliday, setNewHoliday] = useState({
    scope: "organization",
    holiday_date: "",
    name: "",
    is_optional: "N",
    is_override: "N",
    description: "",
    locationId: "",
    departmentId: "",
    financialYear: "",
  });
  const [draftHoliday, setDraftHoliday] = useState({});
  const { user } = useAuth();
  const calendarIdRef = useRef(calendarId);
  const fetchHolidaysRef = useRef();

  // Keep ref in sync with state
  useEffect(() => {
    calendarIdRef.current = calendarId;
  }, [calendarId]);

  // Fetch calendar_id for the selected scope
  const fetchCalendarId = useCallback(async () => {
    if (!financialYear) {
      return null;
    }

    try {
      let url = `/calendars?calendar_type=${filters.scope.toUpperCase()}&financial_year=${financialYear}`;

      if (filters.scope === "location" && filters.locationId) {
        url += `&location_id=${filters.locationId}`;
      } else if (filters.scope === "department" && filters.departmentId) {
        url += `&department_id=${filters.departmentId}`;
      }

      const res = await externalApiClient.get(url);
      const calendars = res.data?.calendars || res.data || [];

      // Get the first calendar for the selected scope/financial year
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
  }, [filters.scope, filters.locationId, filters.departmentId, financialYear]);

  // Fetch holidays with calendar_id
  const fetchHolidays = useCallback(
    async (forceResetCalendarId = false) => {
      if (!user?.empid) {
        return;
      }

      if (!financialYear) {
        setHolidays([]);
        setLoading(false);
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
          `/holidays?calendar_id=${currentCalendarId}&financial_year=${financialYear}`
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
      financialYear,
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
    financialYear,
    user?.empid,
  ]);

  const handleAddNew = () => {
    setAdding(true);
    setNewHoliday({
      scope: filters.scope || "organization",
      holiday_date: "",
      name: "",
      is_optional: "N",
      is_override: "N",
      description: "",
      locationId: filters.scope === "location" ? filters.locationId : "",
      departmentId: filters.scope === "department" ? filters.departmentId : "",
      financialYear: financialYear || getCurrentFinancialYear(),
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewHoliday({
      scope: "organization",
      holiday_date: "",
      name: "",
      is_optional: "N",
      is_override: "N",
      description: "",
      locationId: "",
      departmentId: "",
      financialYear: "",
    });
    setError("");
  };

  const handleNewHolidayChange = (e) => {
    const { name, value } = e.target;
    const updates = {
      ...newHoliday,
      [name]: value,
    };

    // If holiday_date changes, automatically calculate and set financialYear
    if (name === "holiday_date") {
      if (value) {
        const calculatedFY = getFYFromDate(value);
        if (calculatedFY) {
          updates.financialYear = calculatedFY;
        }
      } else {
        // Clear financial year if date is cleared
        updates.financialYear = "";
      }
    }

    setNewHoliday(updates);
  };

  // Fetch calendar_id for the new holiday form
  const fetchCalendarIdForNewHoliday = useCallback(
    async (holidayFinancialYear) => {
      const fyToUse = holidayFinancialYear || financialYear;
      if (!fyToUse) {
        return null;
      }

      const scopeToUse = newHoliday.scope || filters.scope || "organization";

      // Validate required IDs based on scope
      const locationIdToUse = newHoliday.locationId || "";
      const departmentIdToUse = newHoliday.departmentId || "";

      if (scopeToUse === "location" && !locationIdToUse) {
        return null;
      }
      if (scopeToUse === "department" && !departmentIdToUse) {
        return null;
      }

      try {
        let url = `/calendars?calendar_type=${scopeToUse.toUpperCase()}&financial_year=${fyToUse}`;

        if (scopeToUse === "location" && locationIdToUse) {
          url += `&location_id=${locationIdToUse}`;
        } else if (scopeToUse === "department" && departmentIdToUse) {
          url += `&department_id=${departmentIdToUse}`;
        }

        const res = await externalApiClient.get(url);
        const calendars = res.data?.calendars || res.data || [];

        // Get the first calendar for the selected scope/financial year
        if (calendars.length > 0) {
          const calendar = calendars[0];
          const id = calendar.calendar_id || calendar.id || calendar.calendarId;
          return id;
        }

        // If no calendar exists, return null (will need to create one)
        return null;
      } catch (error) {
        console.error("Error fetching calendar ID for new holiday:", error);
        return null;
      }
    },
    [
      filters.scope,
      filters.locationId,
      filters.departmentId,
      financialYear,
      newHoliday.scope,
      newHoliday.locationId,
      newHoliday.departmentId,
    ]
  );

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

    const holidayFinancialYear = newHoliday.financialYear || financialYear;
    if (!holidayFinancialYear) {
      setError("Financial year is required");
      toast.error("Financial year is required");
      return;
    }

    const scopeToUse = newHoliday.scope || filters.scope || "organization";

    // Validate required IDs based on scope
    const locationIdToUse = newHoliday.locationId || "";
    const departmentIdToUse = newHoliday.departmentId || "";

    if (scopeToUse === "location" && !locationIdToUse) {
      setError("Location is required");
      toast.error("Location is required");
      return;
    }
    if (scopeToUse === "department" && !departmentIdToUse) {
      setError("Department is required");
      toast.error("Department is required");
      return;
    }

    // Fetch calendar_id for the new holiday
    const holidayCalendarId = await fetchCalendarIdForNewHoliday(
      holidayFinancialYear
    );
    if (!holidayCalendarId) {
      setError(
        "Unable to find calendar for the selected scope. Please check your selections."
      );
      toast.error("Unable to find calendar for the selected scope");
      return;
    }

    try {
      const res = await externalApiClient.post("/holidays", {
        calendar_id: holidayCalendarId,
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
    <div className="container mx-auto max-w-7xl p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Manage Holidays</h1>
        <p className="text-gray-600">
          Create and manage holiday calendars for your organization, locations,
          or departments
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Add New Holiday Button */}
      {!adding && (
        <div className="mb-6">
          <Button
            onClick={handleAddNew}
            disabled={editingId !== null}
            className="w-full md:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add New Holiday
          </Button>
        </div>
      )}

      {/* Add New Holiday Form */}
      {adding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Holiday</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scope" className="text-sm font-medium">
                  Scope <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newHoliday.scope}
                  onValueChange={(value) => {
                    setNewHoliday({
                      ...newHoliday,
                      scope: value,
                      locationId:
                        value === "location" ? newHoliday.locationId : "",
                      departmentId:
                        value === "department" ? newHoliday.departmentId : "",
                    });
                  }}
                >
                  <SelectTrigger id="scope" className="w-full h-9">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newHoliday.scope === "location" && (
                <div className="space-y-2">
                  <SelectLocation
                    value={newHoliday.locationId}
                    onValueChange={(value) =>
                      setNewHoliday({
                        ...newHoliday,
                        locationId: value,
                      })
                    }
                    showLabel={true}
                    label="Location"
                    placeholder="Select location"
                    required={true}
                  />
                </div>
              )}
              {newHoliday.scope === "department" && (
                <div className="space-y-2">
                  <SelectDepartment
                    value={newHoliday.departmentId}
                    onValueChange={(value) =>
                      setNewHoliday({
                        ...newHoliday,
                        departmentId: value,
                      })
                    }
                    showLabel={true}
                    label="Department"
                    placeholder="Select department"
                    required={true}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="holiday_date" className="text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  name="holiday_date"
                  id="holiday_date"
                  value={newHoliday.holiday_date}
                  onChange={handleNewHolidayChange}
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  value={newHoliday.name}
                  onChange={handleNewHolidayChange}
                  placeholder="Enter holiday name"
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="financialYear" className="text-sm font-medium">
                  Financial Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="financialYear"
                  value={newHoliday.financialYear || ""}
                  readOnly
                  className="h-9 bg-gray-50"
                  placeholder="Financial year will be auto-calculated from date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_optional" className="text-sm font-medium">
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
                  <SelectTrigger id="is_optional" className="w-full h-9">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">No (Mandatory)</SelectItem>
                    <SelectItem value="Y">Yes (Optional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_override" className="text-sm font-medium">
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
                  <SelectTrigger id="is_override" className="w-full h-9">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">No</SelectItem>
                    <SelectItem value="Y">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Input
                  type="text"
                  name="description"
                  id="description"
                  value={newHoliday.description || ""}
                  onChange={handleNewHolidayChange}
                  placeholder="Enter holiday description (optional)"
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveNew}>Save Holiday</Button>
              <Button onClick={handleCancelNew} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">List of Holidays</h2>
        {/* Filters Section */}
        <div className="mb-6 pb-6 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">
                Scope:
              </Label>
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
                disabled={adding}
              >
                <SelectTrigger className="h-9 w-[160px]">
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
              <SelectLocation
                value={filters.locationId}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, locationId: value }))
                }
                showLabel={true}
                label="Location:"
                placeholder="Select location"
                className="flex items-center gap-2"
                disabled={adding}
              />
            )}

            {filters.scope === "department" && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">
                  Department:
                </Label>
                <SelectDepartment
                  value={filters.departmentId}
                  showLabel={false}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, departmentId: value }))
                  }
                  disabled={adding}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">
                Financial Year:
              </Label>
              <SelectFinancialYear
                yearsAhead={1}
                yearsBehind={1}
                value={financialYear}
                onValueChange={(value) => setFinancialYear(value)}
                showLabel={false}
                label="Financial Year:"
                placeholder="Select financial year"
                className="flex items-center gap-2"
                id="financialYear"
                disabled={adding}
              />
            </div>
          </div>
        </div>

        {/* Holidays Content */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Spinner size={32} />
              <p className="text-gray-600">Loading holidays...</p>
            </div>
          </div>
        ) : holidays.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Calendar className="h-12 w-12 text-gray-400" />
              <p className="text-gray-500 text-lg font-medium">
                No holidays found for {financialYear}
              </p>
              <p className="text-gray-400 text-sm">
                Click "Add New Holiday" to create one.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Holidays ({holidays.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holidays.map((holiday) => (
                <Card key={holiday.id}>
                  <CardContent className="p-6">
                    {editingId === holiday.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="date"
                              value={
                                normalizeDateForInput(
                                  draftHoliday.holiday_date
                                ) || ""
                              }
                              disabled
                              required
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Financial Year
                            </Label>
                            <Input
                              type="text"
                              value={financialYear || ""}
                              disabled
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Name <span className="text-red-500">*</span>
                            </Label>
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
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Optional
                            </Label>
                            <Select
                              value={String(draftHoliday.is_optional || "N")}
                              onValueChange={(value) =>
                                setDraftHoliday({
                                  ...draftHoliday,
                                  is_optional: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="N">
                                  No (Mandatory)
                                </SelectItem>
                                <SelectItem value="Y">
                                  Yes (Optional)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Override
                            </Label>
                            <Select
                              value={String(draftHoliday.is_override || "N")}
                              onValueChange={(value) =>
                                setDraftHoliday({
                                  ...draftHoliday,
                                  is_override: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="N">No</SelectItem>
                                <SelectItem value="Y">Yes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-sm font-medium">
                              Description
                            </Label>
                            <Input
                              value={draftHoliday.description || ""}
                              onChange={(e) =>
                                setDraftHoliday({
                                  ...draftHoliday,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Enter holiday description (optional)"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button onClick={() => handleSaveEdit(holiday)}>
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {holiday.name}
                            </h3>
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
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span>{" "}
                            {formatDateDisplay(holiday.holiday_date)}
                          </p>
                          {holiday.description && (
                            <p className="text-sm text-gray-600">
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
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageHolidaysPage;

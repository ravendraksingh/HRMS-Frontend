"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/app/services/internalApiClient";
import { externalApiClient } from "@/app/services/externalApiClient";
import { UsersRound, Plus, X, Search } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import SearchEmployee from "@/components/common/SearchEmployee";
import { getErrorMessage } from "@/lib/emsUtil";

const AddEmployeesPage = () => {
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [draftEmployee, setDraftEmployee] = useState({});
  const [error, setError] = useState("");
  const [showManagerSearch, setShowManagerSearch] = useState(false);
  const [selectedManagerData, setSelectedManagerData] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchLocations();
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const departmentsData = res.data.departments || [];
      setDepartments(departmentsData);
    } catch (e) {
      console.error("Failed to load departments", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load departments";
      toast.error(errorMessage);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await externalApiClient.get("/locations");
      const locationsData = res.data.locations || [];
      setLocations(locationsData);
    } catch (e) {
      console.error("Failed to load locations", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load locations";
      toast.error(errorMessage);
    }
  }, []);

  const validateNewEmployee = () => {
    return (
      draftEmployee.empid &&
      draftEmployee.empid.trim() !== "" &&
      draftEmployee.name &&
      draftEmployee.name.trim() !== "" &&
      draftEmployee.email &&
      draftEmployee.email.trim() !== ""
    );
  };

  const handleManagerSelect = (manager) => {
    setDraftEmployee({
      ...draftEmployee,
      manager_id: manager.empid,
    });
    setSelectedManagerData(manager);
    setShowManagerSearch(false);
  };

  const handleClearManager = () => {
    setDraftEmployee({
      ...draftEmployee,
      manager_id: "",
    });
    setSelectedManagerData(null);
  };

  const handleCancelNew = () => {
    setDraftEmployee({});
    setError("");
    setSelectedManagerData(null);
    setShowManagerSearch(false);
  };

  const handleSaveNew = async () => {
    try {
      if (!validateNewEmployee()) {
        toast.error("Please fill in Employee ID, Name, and Email");
        return;
      }

      // Prepare payload with only required fields and optional fields as null if empty
      const payload = {
        empid: draftEmployee.empid?.trim(),
        name: draftEmployee.name?.trim(),
        email: draftEmployee.email?.trim(),
        manager_id:
          draftEmployee.manager_id && draftEmployee.manager_id !== ""
            ? draftEmployee.manager_id
            : null,
        department_id:
          draftEmployee.department && draftEmployee.department !== ""
            ? String(draftEmployee.department)
            : null,
        location_id:
          draftEmployee.location_id && draftEmployee.location_id !== ""
            ? Number(draftEmployee.location_id)
            : null,
      };

      const res = await apiClient.post("/api/employees", payload);
      toast.success("Employee created successfully!");
      setError("");
      setDraftEmployee({});
      setSelectedManagerData(null);
      setShowManagerSearch(false);
    } catch (error) {
      console.error("Error creating employee:", error);
      const errorMsg = getErrorMessage(error, "Failed to create employee");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="container mx-auto max-w-[1000px] p-6">
      <OrganizationInfoCard />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Add New Employee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1">Employee ID *</Label>
                  <Input
                    value={draftEmployee.empid || ""}
                    onChange={(e) =>
                      setDraftEmployee({
                        ...draftEmployee,
                        empid: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Enter employee ID"
                    required
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div>
                  <Label className="mb-1">Name *</Label>
                  <Input
                    value={draftEmployee.name || ""}
                    onChange={(e) =>
                      setDraftEmployee({
                        ...draftEmployee,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1">Email *</Label>
                  <Input
                    type="email"
                    value={draftEmployee.email || ""}
                    onChange={(e) =>
                      setDraftEmployee({
                        ...draftEmployee,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1">Department</Label>
                  <Select
                    value={
                      draftEmployee.department
                        ? String(draftEmployee.department)
                        : ""
                    }
                    onValueChange={(value) =>
                      setDraftEmployee({
                        ...draftEmployee,
                        department: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.deptid}
                          value={String(dept.deptid)}
                        >
                          {dept.name}{" "}
                          {dept.short_name ? `(${dept.short_name})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1">Location</Label>
                  <Select
                    value={
                      draftEmployee.location_id
                        ? String(draftEmployee.location_id)
                        : ""
                    }
                    onValueChange={(value) =>
                      setDraftEmployee({
                        ...draftEmployee,
                        location_id: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem
                          key={loc.id || loc.location_id}
                          value={String(loc.id || loc.location_id)}
                        >
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-1">Manager (Optional)</Label>
                  {!showManagerSearch && !selectedManagerData ? (
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowManagerSearch(true)}
                        className="w-full justify-start"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {draftEmployee.manager_id
                          ? `Manager ID: ${draftEmployee.manager_id}`
                          : "Click to search for manager"}
                      </Button>
                    </div>
                  ) : showManagerSearch ? (
                    <div className="space-y-2">
                      <SearchEmployee
                        onSelect={handleManagerSelect}
                        label=""
                        showLabel={false}
                        placeholder="Search manager by name or employee ID..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowManagerSearch(false)}
                        className="w-full"
                      >
                        Cancel Search
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {selectedManagerData?.employee_name ||
                              selectedManagerData?.name ||
                              "Manager"}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {draftEmployee.manager_id}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearManager}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowManagerSearch(true)}
                        className="w-full"
                      >
                        Change Manager
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4 md:col-span-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNew}
                    disabled={
                      !draftEmployee.empid ||
                      !draftEmployee.name ||
                      !draftEmployee.email
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelNew}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEmployeesPage;


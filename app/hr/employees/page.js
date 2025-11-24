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
import { useAuth } from "@/components/common/AuthContext";
import SearchEmployee from "@/components/common/SearchEmployee";
import { getErrorMessage } from "@/lib/emsUtil";

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState({});
  const [editingDraftEmployee, setEditingDraftEmployee] = useState({});
  const [editingError, setEditingError] = useState("");
  const [showManagerSearch, setShowManagerSearch] = useState(false);
  const [selectedManagerData, setSelectedManagerData] = useState(null);
  const [showEditManagerSearch, setShowEditManagerSearch] = useState(false);
  const [selectedEditManagerData, setSelectedEditManagerData] = useState(null);
  const { user} = useAuth();

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/employees");
      console.log("employees", res.data);
      setEmployees(res.data.employees || res.data || []);
      setError("");
    } catch (e) {
      console.error("Error fetching employees:", e);
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Error fetching employees";
      setError(errorMessage);
      toast.error(errorMessage);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const departmentsData = res.data.departments || [];
      setDepartments(departmentsData);
    } catch (e) {
      console.error("Failed to load departments", e);
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load departments";
      toast.error(errorMessage);
    }
  }, []);

  // Extract department heads from departments to use as managers
  useEffect(() => {
    if (departments.length === 0) return;

    const departmentHeads = [];
    departments.forEach((dept) => {
      if (dept.department_head_empid) {
        const headId = dept.department_head_empid;
        const employee = employees.find((e) => e.empid === headId);
        if (employee) {
          departmentHeads.push({
            empid: employee.empid,
            name: employee.name || employee.employee_name,
            employee_name: employee.employee_name || employee.name,
          });
        } else {
          departmentHeads.push({
            empid: headId,
            name: `Manager ${headId}`,
            employee_name: `Manager ${headId}`,
          });
        }
      }
    });

    // Remove duplicates based on empid
    const uniqueHeads = departmentHeads.filter(
      (head, index, self) =>
        index === self.findIndex((h) => h.empid === head.empid)
    );

    setManagers(uniqueHeads);
  }, [departments, employees]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await externalApiClient.get("/locations");
      setLocations(res.data.locations || res.data || []);
    } catch (e) {
      console.error("Failed to load locations", e);
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load locations";
      toast.error(errorMessage);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchDepartments();
      fetchLocations();
    }
  }, [
    user?.empid,
    user?.username,
    fetchEmployees,
    fetchDepartments,
    fetchLocations,
  ]);

  const handleChildUpdate = async () => {
    await fetchEmployees();
  };

  const handleAddNew = () => {
    setAdding(true);
    setEditingId(null);
    setError("");
    setShowManagerSearch(false);
    setSelectedManagerData(null);
    setDraftEmployee({
      empid: "",
      name: "",
      email: "",
      department: "",
      location_id: "",
      manager_id: "",
    });
  };

  // Handle manager selection from SearchEmployee
  const handleManagerSelect = (empid, employee) => {
    setDraftEmployee({
      ...draftEmployee,
      manager_id: empid || "",
    });
    setSelectedManagerData(employee);
    setShowManagerSearch(false); // Hide search after selection
  };

  // Handle clear manager
  const handleClearManager = () => {
    setDraftEmployee({
      ...draftEmployee,
      manager_id: "",
    });
    setSelectedManagerData(null);
    setShowManagerSearch(false);
  };

  const handleEditStart = (employeeId) => {
    setEditingId(employeeId);
    setAdding(false);
    setShowEditManagerSearch(false);
    const employee = employees.find((e) => e.empid === employeeId);
    if (employee) {
      setEditingDraftEmployee({
        empid: employee.empid || "",
        name: employee.name || employee.employee_name || "",
        email: employee.email || employee.employee_email || "",
        department: employee.department_id || "",
        location_id: employee.location_id || "",
        manager_id: employee.manager_id || "",
      });
      // Find and set the manager data if manager_id exists
      if (employee.manager_id) {
        const manager = employees.find((e) => e.empid === employee.manager_id);
        if (manager) {
          setSelectedEditManagerData(manager);
        } else {
          setSelectedEditManagerData(null);
        }
      } else {
        setSelectedEditManagerData(null);
      }
    }
    setEditingError("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingDraftEmployee({});
    setEditingError("");
    setShowEditManagerSearch(false);
    setSelectedEditManagerData(null);
  };

  // Handle manager selection for edit form
  const handleEditManagerSelect = (empid, employee) => {
    setEditingDraftEmployee({
      ...editingDraftEmployee,
      manager_id: empid || "",
    });
    setSelectedEditManagerData(employee);
    setShowEditManagerSearch(false); // Hide search after selection
  };

  // Handle clear manager in edit form
  const handleClearEditManager = () => {
    setEditingDraftEmployee({
      ...editingDraftEmployee,
      manager_id: "",
    });
    setSelectedEditManagerData(null);
    setShowEditManagerSearch(false);
  };

  const handleCancelNew = () => {
    setAdding(false);
    setError("");
    setShowManagerSearch(false);
    setSelectedManagerData(null);
  };

  const validateNewEmployee = () => {
    if (
      !draftEmployee.empid ||
      !draftEmployee.name ||
      !draftEmployee.email
    ) {
      return false;
    }
    return true;
  };

  const validateEditEmployee = () => {
    if (
      !editingDraftEmployee.empid ||
      !editingDraftEmployee.name ||
      !editingDraftEmployee.email
    ) {
      return false;
    }
    return true;
  };

  const handleSaveEdit = async (employeeToEdit) => {
    if (!validateEditEmployee()) {
      setEditingError("Employee ID, Name, and Email are required");
      toast.error("Please fill in Employee ID, Name, and Email");
      return;
    }

    try {
      const identifier = employeeToEdit.empid;
      const payload = {
        empid: editingDraftEmployee.empid?.trim(),
        name: editingDraftEmployee.name?.trim(),
        email: editingDraftEmployee.email?.trim(),
        manager_id: editingDraftEmployee.manager_id && editingDraftEmployee.manager_id !== ""
          ? editingDraftEmployee.manager_id
          : null,
        department_id: editingDraftEmployee.department && editingDraftEmployee.department !== ""
          ? String(editingDraftEmployee.department)
          : null,
        location_id: editingDraftEmployee.location_id && editingDraftEmployee.location_id !== ""
          ? Number(editingDraftEmployee.location_id)
          : null,
      };

      await apiClient.patch(`/api/employees/${identifier}`, payload);
      toast.success("Employee updated successfully!");
      setEditingDraftEmployee({});
      setEditingError("");
      handleEditCancel();
      await fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      const errorMsg = getErrorMessage(error, "Failed to update employee");
      setEditingError(errorMsg);
      toast.error(errorMsg);
    }
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
        manager_id: draftEmployee.manager_id && draftEmployee.manager_id !== ""
          ? draftEmployee.manager_id
          : null,
        department_id: draftEmployee.department && draftEmployee.department !== ""
          ? String(draftEmployee.department)
          : null,
        location_id: draftEmployee.location_id && draftEmployee.location_id !== ""
          ? Number(draftEmployee.location_id)
          : null,
      };
      
      const res = await apiClient.post("/api/employees", payload);
      toast.success("Employee created successfully!");
      setAdding(false);
      setError("");
      setDraftEmployee({});
      await fetchEmployees();
    } catch (error) {
      console.error("Error creating employee:", error);
      const errorMsg = getErrorMessage(error, "Failed to create employee");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (employeeToDelete) => {
    if (
      !confirm(
        `Are you sure you want to delete employee ${
          employeeToDelete.name || employeeToDelete.employee_name
        }?`
      )
    )
      return;
    try {
      const identifier = employeeToDelete.empid;
      await apiClient.delete(`/api/employees/${identifier}`);
      setEmployees((prev) =>
        prev.filter((e) => e.empid !== employeeToDelete.empid)
      );
      toast.success("Employee deleted successfully!");
    } catch (error) {
      console.error("Error deleting employee:", error);
      const errorMsg = getErrorMessage(error, "Failed to delete employee");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const getDepartmentName = (deptId) => {
    if (!deptId) return "N/A";
    const dept = departments.find((d) => d.deptid === deptId);
    return dept?.name || "N/A";
  };

  const getLocationName = (locId) => {
    if (!locId) return "N/A";
    const loc = locations.find((l) => l.id === locId || l.location_id === locId);
    return loc?.name || "N/A";
  };

  const getManagerName = (mgrId) => {
    if (!mgrId) return "N/A";
    // Check in managers list (department heads)
    const mgr = managers.find((m) => m.empid === mgrId);
    if (mgr) {
      return mgr.name || mgr.employee_name || "N/A";
    }
    // Fallback: check in departments for department_head_empid
    const dept = departments.find((d) => d.department_head_empid === mgrId);
    if (dept) {
      const headEmployee = employees.find(
        (e) => e.empid === dept.department_head_empid
      );
      if (headEmployee) {
        return headEmployee.name || headEmployee.employee_name || "N/A";
      }
    }
    return "N/A";
  };

  if (loading && employees.length === 0) {
    return (
      <div className="container mx-auto max-w-[1000px] p-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1000px] p-6">
      <OrganizationInfoCard />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Employees
            </CardTitle>
            {!adding && (
              <Button onClick={handleAddNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New Employee
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {adding ? (
            <Card>
              <CardHeader>
                <CardTitle>Add New Employee</CardTitle>
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
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelNew}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <p>Loading employees...</p>
                </div>
              ) : employees &&
                Array.isArray(employees) &&
                employees.length > 0 ? (
                employees.map((employee) => (
                  <Card key={employee.empid}>
                    <CardContent className="p-4">
                      {editingId === employee.empid ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {editingError && (
                            <div className="md:col-span-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                              {editingError}
                            </div>
                          )}
                          <div>
                            <Label
                              htmlFor={`edit-empid-${employee.empid}`}
                              className="mb-1"
                            >
                              Employee ID *
                            </Label>
                            <Input
                              id={`edit-empid-${employee.empid}`}
                              value={editingDraftEmployee.empid || ""}
                              onChange={(e) =>
                                setEditingDraftEmployee({
                                  ...editingDraftEmployee,
                                  empid: e.target.value.toUpperCase(),
                                })
                              }
                              placeholder="Enter employee ID"
                              required
                              style={{ textTransform: "uppercase" }}
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-name-${employee.empid}`}
                              className="mb-1"
                            >
                              Name *
                            </Label>
                            <Input
                              id={`edit-name-${employee.empid}`}
                              value={editingDraftEmployee.name || ""}
                              onChange={(e) =>
                                setEditingDraftEmployee({
                                  ...editingDraftEmployee,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Enter name"
                              required
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-email-${employee.empid}`}
                              className="mb-1"
                            >
                              Email *
                            </Label>
                            <Input
                              id={`edit-email-${employee.empid}`}
                              type="email"
                              value={editingDraftEmployee.email || ""}
                              onChange={(e) =>
                                setEditingDraftEmployee({
                                  ...editingDraftEmployee,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Enter email"
                              required
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-dept-${employee.empid}`}
                              className="mb-1"
                            >
                              Department
                            </Label>
                            <Select
                              value={
                                editingDraftEmployee.department
                                  ? String(editingDraftEmployee.department)
                                  : ""
                              }
                              onValueChange={(value) =>
                                setEditingDraftEmployee({
                                  ...editingDraftEmployee,
                                  department: value === "none" ? "" : value,
                                })
                              }
                            >
                              <SelectTrigger id={`edit-dept-${employee.empid}`}>
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
                                    {dept.short_name
                                      ? `(${dept.short_name})`
                                      : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-loc-${employee.empid}`}
                              className="mb-1"
                            >
                              Location
                            </Label>
                            <Select
                              value={
                                editingDraftEmployee.location_id
                                  ? String(editingDraftEmployee.location_id)
                                  : ""
                              }
                              onValueChange={(value) =>
                                setEditingDraftEmployee({
                                  ...editingDraftEmployee,
                                  location_id: value === "none" ? "" : value,
                                })
                              }
                            >
                              <SelectTrigger id={`edit-loc-${employee.empid}`}>
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
                            <Label
                              htmlFor={`edit-mgr-${employee.empid}`}
                              className="mb-1"
                            >
                              Manager (Optional)
                            </Label>
                            {!showEditManagerSearch && !selectedEditManagerData ? (
                              <div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowEditManagerSearch(true)}
                                  className="w-full justify-start"
                                >
                                  <Search className="mr-2 h-4 w-4" />
                                  {editingDraftEmployee.manager_id
                                    ? `Manager ID: ${editingDraftEmployee.manager_id}`
                                    : "Click to search for manager"}
                                </Button>
                              </div>
                            ) : showEditManagerSearch ? (
                              <div className="space-y-2">
                                <SearchEmployee
                                  onSelect={handleEditManagerSelect}
                                  label=""
                                  showLabel={false}
                                  placeholder="Search manager by name or employee ID..."
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowEditManagerSearch(false)}
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
                                      {selectedEditManagerData?.employee_name ||
                                        selectedEditManagerData?.name ||
                                        "Manager"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      ID: {editingDraftEmployee.manager_id}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearEditManager}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowEditManagerSearch(true)}
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
                              onClick={() => handleSaveEdit(employee)}
                              disabled={
                                !editingDraftEmployee.empid ||
                                !editingDraftEmployee.name ||
                                !editingDraftEmployee.email
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {employee?.name || employee?.employee_name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Employee ID: {employee?.empid}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Email: {employee?.email}
                            </p>
                            <div className="flex gap-4 mt-1 text-sm text-gray-600">
                              <span>
                                Dept: {getDepartmentName(employee?.department_id)}
                              </span>
                              <span>
                                Location: {getLocationName(employee?.location_id)}
                              </span>
                              <span>
                                Manager: {getManagerName(employee?.manager_id)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditStart(employee.empid)}
                              disabled={editingId !== null}
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(employee)}
                              disabled={editingId !== null}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No employees found</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesPage;

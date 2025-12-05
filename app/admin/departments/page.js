"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Users, Plus } from "lucide-react";
import { getErrorMessage } from "@/lib/emsUtil";

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState({
    deptid: "",
    name: "",
    short_name: "",
    department_head: "",
  });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftDept, setDraftDept] = useState({
    deptid: "",
    name: "",
    short_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [hrManagers, setHrManagers] = useState({}); // { departmentId: [managers] }
  const [managers, setManagers] = useState([]); // All available managers
  const [expandedDept, setExpandedDept] = useState(null); // Track which department is expanded
  const [addingHrManager, setAddingHrManager] = useState({}); // { departmentId: true/false }
  const [selectedHrManager, setSelectedHrManager] = useState({}); // { departmentId: managerId }

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchHrManagers = async (departmentId) => {
    try {
      const res = await externalApiClient.get(
        `/departments/${departmentId}/hr-managers`
      );
      setHrManagers((prev) => ({
        ...prev,
        [departmentId]: res.data.hr_managers,
      }));
    } catch (error) {
      console.error("Error fetching HR managers:", error);
      toast.error("Failed to fetch HR managers");
    }
  };

  const handleAddHrManager = async (departmentId) => {
    const managerId = selectedHrManager[departmentId];
    if (!managerId) {
      toast.error("Please select an HR manager");
      return;
    }

    try {
      await externalApiClient.post(`/departments/${departmentId}/hr-managers`, {
        hr_manager: managerId,
      });
      toast.success("HR manager added successfully");
      setAddingHrManager((prev) => ({ ...prev, [departmentId]: false }));
      setSelectedHrManager((prev) => ({ ...prev, [departmentId]: "" }));
      await fetchHrManagers(departmentId);
    } catch (error) {
      console.error("Error adding HR manager:", error);
      const errorMsg = getErrorMessage(error, "Failed to add HR manager");
      toast.error(errorMsg);
    }
  };

  const handleRemoveHrManager = async (departmentId, hrManagerId) => {
    try {
      await externalApiClient.delete(
        `/departments/${departmentId}/hr-managers/${hrManagerId}`
      );
      toast.success("HR manager removed successfully");
      await fetchHrManagers(departmentId);
    } catch (error) {
      console.error("Error removing HR manager:", error);
      const errorMsg = getErrorMessage(error, "Failed to remove HR manager");
      toast.error(errorMsg);
    }
  };

  const toggleDepartmentExpansion = (departmentId) => {
    const deptIdStr = String(departmentId);
    if (expandedDept === deptIdStr) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptIdStr);
      // Fetch HR managers when expanding
      if (!hrManagers[deptIdStr] && !hrManagers[departmentId]) {
        fetchHrManagers(departmentId);
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/departments");
      setDepartments(res.data.departments);
      setError("");
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Failed to fetch departments");
      toast.error("Failed to fetch departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // Validation function for new department
  const validateNewDepartment = () => {
    const errors = {};
    if (!newDept.deptid || newDept.deptid.trim() === "") {
      errors.deptid = "Department ID is required";
    } else if (newDept.deptid.trim().length > 10) {
      errors.deptid = "Department ID must be 10 characters or less";
    }
    if (!newDept.name || newDept.name.trim() === "") {
      errors.name = "Department Name is required";
    } else if (newDept.name.trim().length > 150) {
      errors.name = "Department Name must be 150 characters or less";
    }
    if (newDept.short_name && newDept.short_name.trim().length > 50) {
      errors.short_name = "Short Name must be 50 characters or less";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation function for edit department
  const validateEditDepartment = () => {
    const errors = {};
    if (!draftDept.deptid || draftDept.deptid.trim() === "") {
      errors.deptid = "Department ID is required";
    } else if (draftDept.deptid.trim().length > 10) {
      errors.deptid = "Department ID must be 10 characters or less";
    }
    if (!draftDept.name || draftDept.name.trim() === "") {
      errors.name = "Department Name is required";
    } else if (draftDept.name.trim().length > 150) {
      errors.name = "Department Name must be 150 characters or less";
    }
    if (draftDept.short_name && draftDept.short_name.trim().length > 50) {
      errors.short_name = "Short Name must be 50 characters or less";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers for adding new department
  const handleAddNew = () => {
    setAdding(true);
    setNewDept({ deptid: "", name: "", short_name: "", department_head: "" });
    setError("");
    setValidationErrors({});
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewDept({ deptid: "", name: "", short_name: "", department_head: "" });
    setError("");
    setValidationErrors({});
  };

  const handleNewDeptChange = (e) => {
    const { name, value } = e.target;
    // Enforce character limits
    let processedValue = name === "deptid" ? value.toUpperCase() : value;
    if (name === "deptid" && processedValue.length > 10) {
      processedValue = processedValue.slice(0, 10);
    } else if (name === "name" && processedValue.length > 150) {
      processedValue = processedValue.slice(0, 150);
    } else if (name === "short_name" && processedValue.length > 50) {
      processedValue = processedValue.slice(0, 50);
    }
    setNewDept((prev) => ({ ...prev, [name]: processedValue }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNewDeptBlur = (e) => {
    const { name, value } = e.target;
    // Validate individual field on blur
    if (!value || value.trim() === "") {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: `${
          name === "deptid" ? "Department ID" : "Department Name"
        } is required`,
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveNew = async () => {
    // Validate before submitting
    if (!validateNewDepartment()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const updateData = {
        deptid: newDept.deptid.trim(),
        name: newDept.name.trim(),
        short_name: newDept.short_name?.trim() || null,
        department_head_empid:
          newDept.department_head && newDept.department_head !== "none"
            ? newDept.department_head
            : null,
      };

      const res = await externalApiClient.post("/departments", updateData);
      toast.success("Department added successfully!");
      handleCancelNew();
      setError("");
      // Refresh the departments list from server
      await fetchDepartments();
    } catch (error) {
      console.error("Error adding department:", error);
      const errorMsg = getErrorMessage(error, "Failed to add department");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Handlers for editing department
  const handleEdit = (dept) => {
    // Use deptid as the unique identifier for editing (API returns deptid)
    const identifier = dept.deptid;
    setEditingId(String(identifier)); // Ensure it's a string for comparison
    setDraftDept({
      deptid: dept.deptid || "",
      name: dept.name || "",
      short_name: dept.short_name || "",
      department_head: dept.department_head_empid
        ? String(dept.department_head_empid)
        : "",
    });
    setError("");
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftDept({ deptid: "", name: "", short_name: "", department_head: "" });
    setError("");
    setValidationErrors({});
  };

  const handleDraftChange = (e) => {
    const { name, value } = e.target;
    // Enforce character limits
    let processedValue = name === "deptid" ? value.toUpperCase() : value;
    if (name === "deptid" && processedValue.length > 10) {
      processedValue = processedValue.slice(0, 10);
    } else if (name === "name" && processedValue.length > 150) {
      processedValue = processedValue.slice(0, 150);
    } else if (name === "short_name" && processedValue.length > 50) {
      processedValue = processedValue.slice(0, 50);
    }
    setDraftDept((prev) => ({ ...prev, [name]: processedValue }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDraftBlur = (e) => {
    const { name, value } = e.target;
    // Validate individual field on blur
    if (!value || value.trim() === "") {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: `${
          name === "deptid" ? "Department ID" : "Department Name"
        } is required`,
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveEdit = async (dept) => {
    // Validate before submitting
    if (!validateEditDepartment()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Use deptid as identifier for the API call (API returns deptid)
      const identifier = dept.deptid;
      const updateData = {
        deptid: draftDept.deptid.trim(),
        name: draftDept.name.trim(),
        short_name: draftDept.short_name?.trim() || null,
      };

      // Always include department_head_empid - convert empty string to null, otherwise use the value
      // This ensures the backend always receives the field to update
      updateData.department_head_empid =
        draftDept.department_head &&
        draftDept.department_head !== "" &&
        draftDept.department_head !== "none"
          ? draftDept.department_head
          : null;

      const res = await externalApiClient.patch(
        `/departments/${identifier}`,
        updateData
      );
      toast.success("Department updated successfully!");
      handleCancelEdit();
      setError("");
      setValidationErrors({});
      // Refresh the departments list from server to get updated data
      await fetchDepartments();
    } catch (error) {
      console.error("Error updating department:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update department";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold mb-3">Departments</h1>
      {/* Organization Info Card */}
      <OrganizationInfoCard maxWidth="1000px" />

      {error && (
        <div className="max-w-[800px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1000px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Department List</h2>
          {!adding && (
            <Button onClick={handleAddNew} disabled={editingId !== null}>
              Add New Department
            </Button>
          )}
        </div>

        {adding && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="newDeptCode" className="mb-1">
                    Department ID *
                  </Label>
                  <Input
                    type="text"
                    name="deptid"
                    id="newDeptCode"
                    value={newDept.deptid}
                    onChange={handleNewDeptChange}
                    onBlur={handleNewDeptBlur}
                    placeholder="Enter department ID (e.g., IT)"
                    className={validationErrors.deptid ? "border-red-500" : ""}
                    required
                    maxLength={10}
                    style={{ textTransform: "uppercase" }}
                  />
                  {validationErrors.deptid && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.deptid}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="newDeptName" className="mb-1">
                    Department Name *
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    id="newDeptName"
                    value={newDept.name}
                    onChange={handleNewDeptChange}
                    onBlur={handleNewDeptBlur}
                    placeholder="Enter department name"
                    className={validationErrors.name ? "border-red-500" : ""}
                    required
                    maxLength={150}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="newDeptShortName" className="mb-1">
                    Short Name
                  </Label>
                  <Input
                    type="text"
                    name="short_name"
                    id="newDeptShortName"
                    value={newDept.short_name}
                    onChange={handleNewDeptChange}
                    placeholder="Enter short name (optional)"
                    maxLength={50}
                  />
                  {validationErrors.short_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.short_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="newDeptHead" className="mb-1">
                  Department Head
                </Label>
                <Input
                  type="text"
                  name="department_head_empid"
                  id="newDeptHeadEmpId"
                  value={newDept.department_head_empid}
                  onChange={handleNewDeptChange}
                  placeholder="Enter dept. head employee id"
                  maxLength={10}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSaveNew}
                  disabled={!newDept.deptid?.trim() || !newDept.name?.trim()}
                >
                  Save
                </Button>
                <Button onClick={handleCancelNew} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">Loading departments...</div>
            ) : !Array.isArray(departments) || departments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No departments found. Click "Add New Department" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(departments) &&
                  departments.map((dept) => (
                    <div
                      key={dept.deptid}
                      className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                    >
                      {editingId === String(dept.deptid) ? (
                        <>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <Label
                                htmlFor={`editDeptCode-${dept.deptid}`}
                                className="mb-3"
                              >
                                Department ID *
                              </Label>
                              <Input
                                type="text"
                                name="deptid"
                                id={`editDeptCode-${dept.deptid}`}
                                value={draftDept.deptid}
                                onChange={handleDraftChange}
                                onBlur={handleDraftBlur}
                                className={
                                  validationErrors.deptid
                                    ? "border-red-500"
                                    : ""
                                }
                                required
                                maxLength={10}
                                style={{ textTransform: "uppercase" }}
                              />
                              {validationErrors.deptid && (
                                <p className="text-red-500 text-sm mt-1">
                                  {validationErrors.deptid}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor={`editDeptName-${dept.deptid}`}
                                className="mb-3"
                              >
                                Name *
                              </Label>
                              <Input
                                type="text"
                                name="name"
                                id={`editDeptName-${dept.deptid}`}
                                value={draftDept.name}
                                onChange={handleDraftChange}
                                onBlur={handleDraftBlur}
                                className={
                                  validationErrors.name ? "border-red-500" : ""
                                }
                                required
                                maxLength={150}
                              />
                              {validationErrors.name && (
                                <p className="text-red-500 text-sm mt-1">
                                  {validationErrors.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor={`editDeptShortName-${dept.deptid}`}
                                className="mb-3"
                              >
                                Short Name
                              </Label>
                              <Input
                                type="text"
                                name="short_name"
                                id={`editDeptShortName-${dept.deptid}`}
                                value={draftDept.short_name || ""}
                                onChange={handleDraftChange}
                                placeholder="Enter short name (optional)"
                                maxLength={50}
                              />
                              {validationErrors.short_name && (
                                <p className="text-red-500 text-sm mt-1">
                                  {validationErrors.short_name}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor={`editDeptHead-${dept.deptid}`}
                                className="mb-3"
                              >
                                Department Head
                              </Label>
                              <Input
                                type="text"
                                name="department_head_empid"
                                id={`editDeptHeadEmpId-${dept.deptid}`}
                                value={draftDept.department_head_empid}
                                onChange={handleDraftChange}
                                placeholder="Emp ID of head"
                                maxLength={10}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(dept)}
                              disabled={
                                !draftDept.deptid?.trim() ||
                                !draftDept.name?.trim()
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCancelEdit}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                              <div>
                                <p className="text-sm text-gray-500">
                                  Department ID
                                </p>
                                <p className="font-semibold">{dept.deptid}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-semibold">{dept.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Short Name
                                </p>
                                <p className="font-semibold">
                                  {dept.short_name || "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Department Head
                                </p>
                                {dept.department_head_empid ? (
                                  <p className="text-sm">
                                    ID: {dept.department_head_empid}
                                  </p>
                                ) : (
                                  <p className="text-gray-400 italic">
                                    Not assigned
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* HR Managers Section */}
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  toggleDepartmentExpansion(dept.deptid)
                                }
                                className="flex items-center gap-2 text-sm"
                              >
                                <Users className="h-4 w-4" />
                                HR Managers
                                {expandedDept === String(dept.deptid) && (
                                  <span className="ml-1">
                                    ({hrManagers[dept.deptid]?.length || 0})
                                  </span>
                                )}
                              </Button>
                              {expandedDept === String(dept.deptid) && (
                                <div className="mt-2 p-3 bg-gray-50 rounded border">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold">
                                      HR Managers
                                    </h4>
                                    {!addingHrManager[dept.deptid] && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setAddingHrManager((prev) => ({
                                            ...prev,
                                            [dept.deptid]: true,
                                          }));
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                  {addingHrManager[dept.deptid] && (
                                    <div className="mb-3 p-2 bg-white rounded border">
                                      <Select
                                        value={
                                          selectedHrManager[dept.deptid] || ""
                                        }
                                        onValueChange={(value) => {
                                          setSelectedHrManager((prev) => ({
                                            ...prev,
                                            [dept.deptid]: value,
                                          }));
                                        }}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Select HR Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {managers
                                            .filter(
                                              (mgr) =>
                                                !hrManagers[dept.deptid]?.some(
                                                  (hm) => hm.empid === mgr.empid
                                                )
                                            )
                                            .map((mgr) => (
                                              <SelectItem
                                                key={mgr.empid}
                                                value={String(mgr.empid)}
                                              >
                                                {mgr.name || mgr.employee_name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleAddHrManager(dept.deptid)
                                          }
                                          disabled={
                                            !selectedHrManager[dept.deptid]
                                          }
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setAddingHrManager((prev) => ({
                                              ...prev,
                                              [dept.deptid]: false,
                                            }));
                                            setSelectedHrManager((prev) => ({
                                              ...prev,
                                              [dept.deptid]: "",
                                            }));
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    {hrManagers[dept.deptid]?.length > 0 ? (
                                      hrManagers[dept.deptid].map((hm) => (
                                        <Badge
                                          key={hm.empid}
                                          variant="secondary"
                                          className="flex items-center gap-1 w-fit"
                                        >
                                          {hm.name ||
                                            hm.employee_name ||
                                            "HR Manager"}
                                          <button
                                            onClick={() =>
                                              handleRemoveHrManager(
                                                dept.deptid,
                                                hm.empid
                                              )
                                            }
                                            className="ml-1 hover:text-red-600"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-sm text-gray-500">
                                        No HR managers assigned
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(dept)}
                              disabled={adding}
                              variant="outline"
                            >
                              Edit
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepartmentsPage;

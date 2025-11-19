"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthContext";
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

const DepartmentsPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState({ department_code: "", name: "" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftDept, setDraftDept] = useState({ department_code: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [hrManagers, setHrManagers] = useState({}); // { departmentId: [managers] }
  const [managers, setManagers] = useState([]); // All available managers
  const [employees, setEmployees] = useState([]); // All employees for department_head selection
  const [expandedDept, setExpandedDept] = useState(null); // Track which department is expanded
  const [addingHrManager, setAddingHrManager] = useState({}); // { departmentId: true/false }
  const [selectedHrManager, setSelectedHrManager] = useState({}); // { departmentId: managerId }

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await externalApiClient.get("/employees");
      setEmployees(res.data.employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Don't show error toast for employees fetch failure - it's not critical
      // The department head dropdown will just be empty
      setEmployees([]);
    }
  };

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
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to add HR manager";
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
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to remove HR manager";
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
    if (!newDept.department_code || newDept.department_code.trim() === "") {
      errors.department_code = "Department Code is required";
    }
    if (!newDept.name || newDept.name.trim() === "") {
      errors.name = "Department Name is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation function for edit department
  const validateEditDepartment = () => {
    const errors = {};
    if (!draftDept.department_code || draftDept.department_code.trim() === "") {
      errors.department_code = "Department Code is required";
    }
    if (!draftDept.name || draftDept.name.trim() === "") {
      errors.name = "Department Name is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers for adding new department
  const handleAddNew = () => {
    setAdding(true);
    setNewDept({ department_code: "", name: "" });
    setError("");
    setValidationErrors({});
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewDept({ department_code: "", name: "" });
    setError("");
    setValidationErrors({});
  };

  const handleNewDeptChange = (e) => {
    const { name, value } = e.target;
    setNewDept((prev) => ({ ...prev, [name]: value }));
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
          name === "department_code" ? "Department Code" : "Department Name"
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
      const res = await externalApiClient.post("/departments", {
        department_code: newDept.department_code.trim(),
        name: newDept.name.trim(),
      });
      toast.success("Department added successfully!");
      handleCancelNew();
      setError("");
      // Refresh the departments list from server
      await fetchDepartments();
    } catch (error) {
      console.error("Error adding department:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to add department";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Handlers for editing department
  const handleEdit = (dept) => {
    // Use department_code or id as identifier for editing
    const identifier = dept.id;
    setEditingId(String(identifier)); // Ensure it's a string for comparison

    // Handle department_head - could be object, ID, or null
    let departmentHeadId = "";
    if (dept.department_head) {
      if (typeof dept.department_head === "object") {
        departmentHeadId = String(
          dept.department_head.id || dept.department_head.employee_id || ""
        );
      } else {
        departmentHeadId = String(dept.department_head);
      }
    } else if (dept.department_head_id) {
      departmentHeadId = String(dept.department_head_id);
    }

    setDraftDept({
      department_code: dept.department_code || dept.id || "",
      name: dept.name || "",
      department_head: departmentHeadId,
    });
    setError("");
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftDept({ department_code: "", name: "", department_head: "" });
    setError("");
    setValidationErrors({});
  };

  const handleDraftChange = (e) => {
    const { name, value } = e.target;
    setDraftDept((prev) => ({ ...prev, [name]: value }));
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
          name === "department_code" ? "Department Code" : "Department Name"
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
      // Use department_code or id as identifier for the API call
      const identifier = dept.id;
      const updateData = {
        department_code: draftDept.department_code.trim(),
        name: draftDept.name.trim(),
      };

      // Include id if it exists
      if (dept.id) {
        updateData.id = dept.id;
      }

      // Always include department_head - convert empty string to null, otherwise use the value
      // This ensures the backend always receives the field to update
      if (
        draftDept.department_head === "" ||
        draftDept.department_head === undefined
      ) {
        updateData.department_head = null;
      } else {
        updateData.department_head = draftDept.department_head;
      }

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newDeptCode" className="mb-1">
                    Department Code *
                  </Label>
                  <Input
                    type="text"
                    name="department_code"
                    id="newDeptCode"
                    value={newDept.department_code}
                    onChange={handleNewDeptChange}
                    onBlur={handleNewDeptBlur}
                    placeholder="Enter department code (e.g., ENG)"
                    className={
                      validationErrors.department_code ? "border-red-500" : ""
                    }
                    required
                  />
                  {validationErrors.department_code && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.department_code}
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
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSaveNew}
                  disabled={
                    !newDept.department_code?.trim() || !newDept.name?.trim()
                  }
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
                      key={dept.id}
                      className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                    >
                      {editingId === String(dept.id) ? (
                        <>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label
                                htmlFor={`editDeptCode-${dept.id}`}
                                className="mb-1"
                              >
                                Code *
                              </Label>
                              <Input
                                type="text"
                                name="department_code"
                                id={`editDeptCode-${dept.department_code}`}
                                value={draftDept.department_code}
                                onChange={handleDraftChange}
                                onBlur={handleDraftBlur}
                                className={
                                  validationErrors.department_code
                                    ? "border-red-500"
                                    : ""
                                }
                                required
                              />
                              {validationErrors.department_code && (
                                <p className="text-red-500 text-sm mt-1">
                                  {validationErrors.department_code}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor={`editDeptName-${dept.id}`}
                                className="mb-1"
                              >
                                Name *
                              </Label>
                              <Input
                                type="text"
                                name="name"
                                id={`editDeptName-${dept.id}`}
                                value={draftDept.name}
                                onChange={handleDraftChange}
                                onBlur={handleDraftBlur}
                                className={
                                  validationErrors.name ? "border-red-500" : ""
                                }
                                required
                              />
                              {validationErrors.name && (
                                <p className="text-red-500 text-sm mt-1">
                                  {validationErrors.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor={`editDeptHead-${dept.id}`}
                                className="mb-1"
                              >
                                Department Head
                              </Label>
                              <Select
                                value={
                                  draftDept.department_head
                                    ? String(draftDept.department_head)
                                    : "none"
                                }
                                onValueChange={(value) =>
                                  setDraftDept({
                                    ...draftDept,
                                    department_head:
                                      value === "none" ? "" : value,
                                  })
                                }
                              >
                                <SelectTrigger
                                  id={`editDeptHead-${dept.id}`}
                                  className="w-full"
                                >
                                  <SelectValue placeholder="Select department head" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {employees.length > 0 ? (
                                    employees.map((emp) => (
                                      <SelectItem
                                        key={emp.id || emp.employee_id}
                                        value={String(
                                          emp.id || emp.employee_id
                                        )}
                                      >
                                        {emp.name || emp.employee_name} (
                                        {emp.employee_code || ""})
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem
                                      value="__no_employees__"
                                      disabled
                                    >
                                      No employees available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(dept)}
                              disabled={
                                !draftDept.department_code?.trim() ||
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                              <div>
                                <p className="text-sm text-gray-500">Code</p>
                                <p className="font-semibold">
                                  {dept.department_code || dept.id}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-semibold">{dept.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Department Head
                                </p>
                                {dept.department_head ||
                                dept.department_head_id ? (
                                  <div>
                                    {dept.department_head &&
                                    typeof dept.department_head === "object" ? (
                                      <>
                                        <p className="font-semibold">
                                          {dept.department_head?.name ||
                                            dept.department_head
                                              ?.employee_name ||
                                            "N/A"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          ID:{" "}
                                          {dept.department_head?.id ||
                                            dept.department_head?.employee_id ||
                                            "N/A"}{" "}
                                          | Emp Code:{" "}
                                          {dept.department_head
                                            ?.employee_code || "N/A"}
                                        </p>
                                      </>
                                    ) : (
                                      (() => {
                                        const headId =
                                          dept.department_head ||
                                          dept.department_head_id;
                                        const headEmployee = employees.find(
                                          (emp) =>
                                            (emp.id || emp.employee_id) ==
                                            headId
                                        );
                                        return headEmployee ? (
                                          <>
                                            <p className="font-semibold">
                                              {headEmployee.name ||
                                                headEmployee.employee_name ||
                                                "N/A"}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                              ID:{" "}
                                              {headEmployee.id ||
                                                headEmployee.employee_id ||
                                                "N/A"}{" "}
                                              | Code:{" "}
                                              {headEmployee.employee_code ||
                                                "N/A"}
                                            </p>
                                          </>
                                        ) : (
                                          <p className="text-gray-400 italic">
                                            ID: {headId} (Loading...)
                                          </p>
                                        );
                                      })()
                                    )}
                                  </div>
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
                                  toggleDepartmentExpansion(
                                    dept.id || dept.department_code
                                  )
                                }
                                className="flex items-center gap-2 text-sm"
                              >
                                <Users className="h-4 w-4" />
                                HR Managers
                                {expandedDept ===
                                  String(dept.id || dept.department_code) && (
                                  <span className="ml-1">
                                    (
                                    {hrManagers[dept.id || dept.department_code]
                                      ?.length || 0}
                                    )
                                  </span>
                                )}
                              </Button>
                              {expandedDept ===
                                String(dept.id || dept.department_code) && (
                                <div className="mt-2 p-3 bg-gray-50 rounded border">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold">
                                      HR Managers
                                    </h4>
                                    {!addingHrManager[
                                      dept.id || dept.department_code
                                    ] && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setAddingHrManager((prev) => ({
                                            ...prev,
                                            [dept.id ||
                                            dept.department_code]: true,
                                          }));
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                  {addingHrManager[
                                    dept.id || dept.department_code
                                  ] && (
                                    <div className="mb-3 p-2 bg-white rounded border">
                                      <Select
                                        value={
                                          selectedHrManager[
                                            dept.id || dept.department_code
                                          ] || ""
                                        }
                                        onValueChange={(value) => {
                                          setSelectedHrManager((prev) => ({
                                            ...prev,
                                            [dept.id || dept.department_code]:
                                              value,
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
                                                !hrManagers[
                                                  dept.id ||
                                                    dept.department_code
                                                ]?.some(
                                                  (hm) =>
                                                    hm.id === mgr.id ||
                                                    hm.employee_id ===
                                                      mgr.employee_id
                                                )
                                            )
                                            .map((mgr) => (
                                              <SelectItem
                                                key={mgr.id || mgr.employee_id}
                                                value={String(
                                                  mgr.id || mgr.employee_id
                                                )}
                                              >
                                                {mgr.name || mgr.employee_name}{" "}
                                                ({mgr.employee_code || ""})
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleAddHrManager(
                                              dept.id || dept.department_code
                                            )
                                          }
                                          disabled={
                                            !selectedHrManager[
                                              dept.id || dept.department_code
                                            ]
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
                                              [dept.id ||
                                              dept.department_code]: false,
                                            }));
                                            setSelectedHrManager((prev) => ({
                                              ...prev,
                                              [dept.id || dept.department_code]:
                                                "",
                                            }));
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    {hrManagers[dept.id || dept.department_code]
                                      ?.length > 0 ? (
                                      hrManagers[
                                        dept.id || dept.department_code
                                      ].map((hm) => (
                                        <Badge
                                          key={hm.id || hm.employee_id}
                                          variant="secondary"
                                          className="flex items-center gap-1 w-fit"
                                        >
                                          {hm.name ||
                                            hm.employee_name ||
                                            "HR Manager"}{" "}
                                          ({hm.employee_code || ""})
                                          <button
                                            onClick={() =>
                                              handleRemoveHrManager(
                                                dept.id || dept.department_code,
                                                hm.id || hm.employee_id
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

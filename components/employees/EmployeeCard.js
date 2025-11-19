import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { toast } from "sonner";
import apiClient from "@/app/services/internalApiClient";

const EmployeeCard = ({
  employee,
  departments,
  locations,
  managers,
  onUpdate,
  editing: isEditing,
  onEditStart,
  onEditCancel,
  isAnyEditing,
}) => {
  const [draftEmployee, setDraftEmployee] = useState({});
  const [error, setError] = useState("");

  const handleEdit = (employee) => {
    if (onEditStart) {
      onEditStart(employee.id);
    }
    setDraftEmployee({
      employee_code: employee.employee_code || "",
      name: employee.name || employee.employee_name || "",
      email: employee.email || employee.employee_email || "",
      department: employee.department_id || "",
      location_id: employee.location_id || "",
      manager_id: employee.manager_id || "",
    });
    setError("");
  };

  const handleCancelEdit = () => {
    setDraftEmployee({});
    setError("");
    if (onEditCancel) {
      onEditCancel();
    }
  };

  const handleSaveEdit = async (employeeToEdit) => {
    // Validate all required fields
    if (
      !draftEmployee.employee_code ||
      !draftEmployee.name ||
      !draftEmployee.email ||
      !draftEmployee.department ||
      !draftEmployee.location_id ||
      !draftEmployee.manager_id
    ) {
      setError("All fields are required");
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const id = employeeToEdit.id;
      // Prepare payload according to API spec (PATCH only sends changed fields)
      const payload = {
        employee_code: draftEmployee.employee_code?.trim(),
        name: draftEmployee.name?.trim(),
        email: draftEmployee.email?.trim(),
        manager_id: Number(draftEmployee.manager_id),
        department: Number(draftEmployee.department),
        location_id: Number(draftEmployee.location_id),
      };

      const res = await apiClient.patch(`/api/employees/${id}`, payload);
      toast.success("Employee updated successfully!");
      setDraftEmployee({});
      setError("");
      if (onEditCancel) {
        onEditCancel();
      }
      onUpdate();
    } catch (error) {
      console.error("Error updating employee:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update employee";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${employee.name}?`)) return;
    try {
      await apiClient.delete(`/api/employees/${employee.id}`);
      toast.success("Employee deleted successfully!");
      onUpdate();
    } catch (error) {
      console.error("Error deleting employee:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete";
      toast.error(errorMsg);
    }
  };

  const getDepartmentName = (deptId) => {
    if (!deptId) return "N/A";
    const dept = departments.find(
      (d) => d.id === deptId || d.department_id === deptId
    );
    return dept?.name || "N/A";
  };

  const getLocationName = (locId) => {
    if (!locId) return "N/A";
    const loc = locations.find(
      (l) => l.id === locId || l.location_id === locId
    );
    return loc?.name || "N/A";
  };

  const getManagerName = (mgrId) => {
    if (!mgrId) return "N/A";
    // First check in managers list (department heads)
    const mgr = managers.find((m) => m.id === mgrId || m.employee_id === mgrId);
    if (mgr) {
      return mgr.name || mgr.employee_name || "N/A";
    }
    // Fallback: check in departments for department_head
    const dept = departments.find((d) => {
      if (d.department_head) {
        if (typeof d.department_head === "object") {
          return (
            d.department_head.id === mgrId ||
            d.department_head.employee_id === mgrId
          );
        }
        return d.department_head === mgrId;
      }
      return d.department_head_id === mgrId;
    });
    if (dept?.department_head) {
      if (typeof dept.department_head === "object") {
        return (
          dept.department_head.name ||
          dept.department_head.employee_name ||
          "N/A"
        );
      }
    }
    return "N/A";
  };

  return (
    <Card>
      <CardContent>
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`edit-code-${employee.id}`} className="mb-1">
                Employee Code *
              </Label>
              <Input
                id={`edit-code-${employee.id}`}
                value={draftEmployee.employee_code || ""}
                onChange={(e) =>
                  setDraftEmployee({
                    ...draftEmployee,
                    employee_code: e.target.value,
                  })
                }
                placeholder="Enter employee code"
                required
              />
            </div>
            <div>
              <Label htmlFor={`edit-name-${employee.id}`} className="mb-1">
                Name *
              </Label>
              <Input
                id={`edit-name-${employee.id}`}
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
              <Label htmlFor={`edit-email-${employee.id}`} className="mb-1">
                Email *
              </Label>
              <Input
                id={`edit-email-${employee.id}`}
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
              <Label htmlFor={`edit-dept-${employee.id}`} className="mb-1">
                Department *
              </Label>
              <Select
                value={
                  draftEmployee.department
                    ? String(draftEmployee.department)
                    : ""
                }
                onValueChange={(value) =>
                  setDraftEmployee({
                    ...draftEmployee,
                    department: value,
                  })
                }
                required
              >
                <SelectTrigger id={`edit-dept-${employee.id}`}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept.id || dept.department_id}
                      value={String(dept.id || dept.department_id)}
                    >
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`edit-loc-${employee.id}`} className="mb-1">
                Location *
              </Label>
              <Select
                value={
                  draftEmployee.location_id
                    ? String(draftEmployee.location_id)
                    : ""
                }
                onValueChange={(value) =>
                  setDraftEmployee({
                    ...draftEmployee,
                    location_id: value,
                  })
                }
                required
              >
                <SelectTrigger id={`edit-loc-${employee.id}`}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
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
            <div>
              <Label htmlFor={`edit-mgr-${employee.id}`} className="mb-1">
                Manager *
              </Label>
              <Select
                value={
                  draftEmployee.manager_id
                    ? String(draftEmployee.manager_id)
                    : ""
                }
                onValueChange={(value) =>
                  setDraftEmployee({
                    ...draftEmployee,
                    manager_id: value,
                  })
                }
                required
              >
                <SelectTrigger id={`edit-mgr-${employee.id}`}>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((mgr) => (
                    <SelectItem
                      key={mgr.id || mgr.employee_id}
                      value={String(mgr.id || mgr.employee_id)}
                    >
                      {mgr.name || mgr.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-4 md:col-span-2">
              <Button
                size="sm"
                onClick={() => handleSaveEdit(employee)}
                disabled={
                  !draftEmployee.employee_code ||
                  !draftEmployee.name ||
                  !draftEmployee.email ||
                  !draftEmployee.department ||
                  !draftEmployee.location_id ||
                  !draftEmployee.manager_id
                }
              >
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{employee?.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Employee Code: {employee?.employee_code}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Email: {employee?.email}
              </p>
              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                <span>Dept: {getDepartmentName(employee?.department_id)}</span>
                <span>Location: {getLocationName(employee?.location_id)}</span>
                <span>
                  Manager:{" "}
                  {getManagerName(
                    employee?.manager_id || employee?.manager?.id
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleEdit(employee)}
                disabled={isAnyEditing}
                variant="outline"
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(employee)}
                disabled={isAnyEditing}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;

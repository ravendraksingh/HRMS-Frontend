"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/app/services/internalApiClient";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/auth/AuthContext";
import { UsersRound, Plus, X } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import EmployeeCard from "@/components/employees/EmployeeCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const EmployeesPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState({});

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await externalApiClient.get("/employees");
      setEmployees(res.data.employees);
    } catch (e) {
      console.error("Error fetching employees:", e);
      setError("Error fetching employees");
      toast.error("Failed to load employees");
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const departmentsData = res.data.departments;
      setDepartments(departmentsData);
    } catch (e) {
      console.error("Failed to load departments", e);
    }
  }, []);

  // Extract department heads from departments to use as managers
  useEffect(() => {
    if (departments.length === 0) return;

    const departmentHeads = [];
    departments.forEach((dept) => {
      if (dept.department_head) {
        // department_head can be an object or just an ID
        if (typeof dept.department_head === "object") {
          // If it's an object, use it directly
          const head = dept.department_head;
          departmentHeads.push({
            id: head.id || head.employee_id,
            employee_id: head.employee_id || head.id,
            name: head.name || head.employee_name,
            employee_name: head.employee_name || head.name,
            employee_code: head.employee_code,
          });
        } else {
          // If department_head is an ID, try to find the employee
          const headId = dept.department_head;
          const employee = employees.find(
            (e) => e.id === headId || e.employee_id === headId
          );
          if (employee) {
            departmentHeads.push({
              id: employee.id || employee.employee_id,
              employee_id: employee.employee_id || employee.id,
              name: employee.name || employee.employee_name,
              employee_name: employee.employee_name || employee.name,
              employee_code: employee.employee_code,
            });
          } else {
            departmentHeads.push({
              id: headId,
              employee_id: headId,
              name: `Manager ${headId}`,
              employee_name: `Manager ${headId}`,
            });
          }
        }
      } else if (dept.department_head_id) {
        // Fallback to department_head_id if department_head doesn't exist
        const headId = dept.department_head_id;
        const employee = employees.find(
          (e) => e.id === headId || e.employee_id === headId
        );
        if (employee) {
          departmentHeads.push({
            id: employee.id || employee.employee_id,
            employee_id: employee.employee_id || employee.id,
            name: employee.name || employee.employee_name,
            employee_name: employee.employee_name || employee.name,
            employee_code: employee.employee_code,
          });
        } else {
          departmentHeads.push({
            id: headId,
            employee_id: headId,
            name: `Manager ${headId}`,
            employee_name: `Manager ${headId}`,
          });
        }
      }
    });

    // Remove duplicates based on ID or employee_id
    const uniqueHeads = departmentHeads.filter(
      (head, index, self) =>
        index ===
        self.findIndex((h) => {
          const headId = head.id || head.employee_id;
          const hId = h.id || h.employee_id;
          return headId && hId && headId === hId;
        })
    );

    setManagers(uniqueHeads);
  }, [departments, employees]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await externalApiClient.get("/locations");
      setLocations(res.data.locations);
    } catch (e) {
      console.error("Failed to load locations", e);
    }
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      fetchEmployees();
      fetchDepartments();
      fetchLocations();
    }
  }, []);

  const handleChildUpdate = async () => {
    await fetchEmployees();
  };

  const handleAddNew = () => {
    setAdding(true);
    setEditingId(null);
    setError("");
  };

  const handleEditStart = (employeeId) => {
    setEditingId(employeeId);
    setAdding(false);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleCancelNew = () => {
    setAdding(false);
    setError("");
  };

  const validateNewEmployee = () => {
    if (
      !draftEmployee.employee_code ||
      !draftEmployee.name ||
      !draftEmployee.email ||
      !draftEmployee.department ||
      !draftEmployee.location_id ||
      !draftEmployee.manager_id
    ) {
      return false;
    }
    return true;
  };

  const handleSaveNew = async () => {
    try {
      if (!validateNewEmployee()) {
        toast.error("Please fill in all required fields");
        return;
      }
      const res = await apiClient.post("/api/employees", draftEmployee);
      toast.success("Employee created successfully!");
      setAdding(false);
      setError("");
      setDraftEmployee({});
      await fetchEmployees();
    } catch (error) {
      console.error("Error creating employee:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create employee";
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
      // Use employee.id or employee_code as identifier (API supports both)
      const identifier = employeeToDelete.id || employeeToDelete.employee_code;
      await apiClient.delete(`/api/employees/${identifier}`);
      setEmployees((prev) =>
        prev.filter(
          (e) =>
            e.id !== employeeToDelete.id &&
            e.employee_code !== employeeToDelete.employee_code
        )
      );
      toast.success("Employee deleted successfully!");
    } catch (error) {
      console.error("Error deleting employee:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete employee";
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
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle>Add New Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1">Employee Code *</Label>
                    <Input
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
                    <Label className="mb-1">Department *</Label>
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
                      <SelectTrigger>
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
                    <Label className="mb-1">Location *</Label>
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
                      <SelectTrigger>
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
                    <Label className="mb-1">Manager *</Label>
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
                      <SelectTrigger>
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
                      onClick={handleSaveNew}
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
            employees &&
            Array.isArray(employees) &&
            employees.length > 0 &&
            employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                departments={departments}
                locations={locations}
                managers={managers}
                onUpdate={handleChildUpdate}
                editing={editingId === employee.id}
                onEditStart={handleEditStart}
                onEditCancel={handleEditCancel}
                isAnyEditing={editingId !== null}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesPage;

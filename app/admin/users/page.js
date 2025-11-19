"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthContext";
import { UserPlus } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    employee_id: "",
    is_active: 1,
    role_ids: [],
  });
  const [draftUser, setDraftUser] = useState({});

  useEffect(() => {
    if (user?.user_id) {
      fetchUsers();
      fetchRoles();
      fetchEmployees();
    }
  }, [user?.user_id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/users");
      let users = res.data.users;
      setUsers(users);
      setError("");
    } catch (e) {
      console.error("Error fetching users:", e);
      setError("Error fetching users");
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await externalApiClient.get("/roles");
      setRoles(res.data.roles);
    } catch (e) {
      console.error("Failed to load roles", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await externalApiClient.get("/admin/all-employees");
      setEmployees(res.data.employees);
    } catch (e) {
      console.error("Failed to load employees", e);
      setEmployees([]); // Ensure it's always an array even on error
    }
  };

  const handleAddNew = () => {
    setAdding(true);
    // Find default user role and include it by default
    const defaultUserRole = roles.find(
      (r) =>
        r.code?.toUpperCase() === "USER" || r.name?.toLowerCase() === "user"
    );

    setNewUser({
      username: "",
      password: "",
      employee_id: "",
      is_active: 1,
      role_ids: defaultUserRole ? [defaultUserRole.id] : [],
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    // Find default user role and include it by default
    const defaultUserRole = roles.find(
      (r) =>
        r.code?.toUpperCase() === "USER" || r.name?.toLowerCase() === "user"
    );

    setNewUser({
      username: "",
      password: "",
      employee_id: "",
      is_active: 1,
      role_ids: defaultUserRole ? [defaultUserRole.id] : [],
    });
    setError("");
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: name === "is_active" ? parseInt(value) : value,
    }));
  };

  const handleRoleToggle = (roleId) => {
    setNewUser((prev) => {
      const roleIds = prev.role_ids || [];
      const newRoleIds = roleIds.includes(roleId)
        ? roleIds.filter((id) => id !== roleId)
        : [...roleIds, roleId];
      return { ...prev, role_ids: newRoleIds };
    });
  };

  const handleSaveNew = async () => {
    if (!newUser.username || !newUser.password || !newUser.employee_id) {
      setError("Username, password, and employee are required");
      toast.error("Username, password, and employee are required");
      return;
    }

    // Validate that at least one role is selected
    if (!newUser.role_ids || newUser.role_ids.length === 0) {
      setError("At least one role is required");
      toast.error("Please select at least one role");
      return;
    }

    try {
      // Find the default "user" role (code: "USER" or name: "User")
      const defaultUserRole = roles.find(
        (r) =>
          r.code?.toUpperCase() === "USER" || r.name?.toLowerCase() === "user"
      );

      // Ensure default user role is included in role_ids
      let roleIds = [...(newUser.role_ids || [])];
      if (defaultUserRole && !roleIds.includes(defaultUserRole.id)) {
        roleIds.push(defaultUserRole.id);
      }

      const res = await externalApiClient.post("/users", {
        ...newUser,
        role_ids: roleIds,
        organization_id: user?.org_id || user?.organization_id,
      });
      toast.success("User created successfully!");
      handleCancelNew();
      setError("");
      fetchUsers();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || "Failed to create user";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setDraftUser({ ...user });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftUser({});
    setError("");
  };

  const handleSaveEdit = async (userToEdit) => {
    try {
      const res = await externalApiClient.patch(
        `/users/${userToEdit.id}`,
        draftUser
      );
      toast.success("User updated successfully!");
      handleCancelEdit();
      setError("");
      // Refresh users list to get updated data from server
      await fetchUsers();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || "Failed to update user";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (userToDelete) => {
    if (
      !confirm(`Are you sure you want to delete user ${userToDelete.username}?`)
    )
      return;
    try {
      await externalApiClient.delete(`/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success("User deleted successfully!");
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || "Failed to delete user";
      toast.error(errorMsg);
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      console.log("Assigning role:", { userId, roleId });
      const res = await externalApiClient.post(`/users/${userId}/roles`, {
        role_id: roleId,
      });
      console.log("Assign role response:", res.data);
      toast.success("Role assigned successfully!");
      // Refresh users list to get updated roles
      await fetchUsers();
    } catch (error) {
      console.error("Error assigning role:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to assign role";
      toast.error(errorMsg);
    }
  };

  const handleRemoveRole = async (userId, roleIdentifier) => {
    if (!confirm("Are you sure you want to remove this role?")) return;
    try {
      // roleIdentifier could be a role_code (e.g., "HR_MANAGER"), role_id, or role id
      // We need to find the actual role ID from the roles array
      let actualRoleId = roleIdentifier;

      // Check if it's a valid numeric ID
      const numericId = Number(roleIdentifier);
      const isNumericId =
        !isNaN(numericId) && Number.isInteger(numericId) && numericId > 0;

      if (!isNumericId) {
        // It's likely a role code, try to find the role by code
        const identifierStr = String(roleIdentifier).toUpperCase();
        const foundRole = roles.find((r) => {
          const rCode = r.code?.toUpperCase();
          const rId = String(r.id);
          // Match by code or by id as string
          return rCode === identifierStr || rId === identifierStr;
        });
        if (foundRole && foundRole.id) {
          actualRoleId = foundRole.id;
        } else {
          // If not found, log and try using the identifier as-is (might work if backend accepts codes)
          console.warn(
            "Could not find role ID for identifier:",
            roleIdentifier,
            "Available roles:",
            roles
          );
          actualRoleId = roleIdentifier;
        }
      }

      console.log("Removing role:", { userId, roleIdentifier, actualRoleId });
      await externalApiClient.delete(`/users/${userId}/roles/${actualRoleId}`);
      toast.success("Role removed successfully!");
      await fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to remove role";
      toast.error(errorMsg);
    }
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return "N/A";
    // Ensure employees is an array before calling find
    if (!Array.isArray(employees) || employees.length === 0) {
      return `Employee ${employeeId}`;
    }
    // Convert employeeId to both string and number for comparison
    const employeeIdStr = String(employeeId);
    const employeeIdNum = Number(employeeId);

    const employee = employees.find(
      (e) =>
        String(e.id) === employeeIdStr ||
        Number(e.id) === employeeIdNum ||
        String(e.employee_id) === employeeIdStr ||
        Number(e.employee_id) === employeeIdNum ||
        String(e.employee_code) === employeeIdStr
    );

    if (employee) {
      const name = employee.name || employee.employee_name;
      // Show employee_code instead of employee_id for display purposes
      const code = employee.employee_code || employee.code;
      return name
        ? `${name}${code ? ` (${code})` : ""}`
        : `Employee ${employeeId}`;
    }

    return `Employee ${employeeId}`;
  };

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold mb-3">User Management</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard maxWidth="1000px" />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1000px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">User List</h2>
          {!adding && (
            <Button onClick={handleAddNew} disabled={editingId !== null}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          )}
        </div>

        {adding && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username" className="mb-1">
                    Username *
                  </Label>
                  <Input
                    type="text"
                    name="username"
                    id="username"
                    value={newUser.username}
                    onChange={handleNewUserChange}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="mb-1">
                    Password *
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    id="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="employee_id" className="mb-1">
                    Employee *
                  </Label>
                  <Select
                    value={newUser.employee_id || ""}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, employee_id: value })
                    }
                  >
                    <SelectTrigger id="employee_id" className="w-full">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem
                          key={emp.id || emp.employee_id}
                          value={String(emp.id || emp.employee_id)}
                        >
                          {emp.name || emp.employee_name}
                          {emp.employee_code || emp.code
                            ? ` (${emp.employee_code || emp.code})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="is_active" className="mb-1">
                    Status
                  </Label>
                  <Select
                    value={String(newUser.is_active)}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, is_active: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="is_active" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="mb-1">
                    Roles <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={newUser.role_ids?.includes(role.id)}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                        />
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {role.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {error && error.includes("role") && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                  {(!newUser.role_ids || newUser.role_ids.length === 0) && (
                    <p className="text-sm text-gray-500 mt-1">
                      Please select at least one role
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSaveNew}
                  disabled={
                    !newUser.username ||
                    !newUser.password ||
                    !newUser.employee_id ||
                    !newUser.role_ids ||
                    newUser.role_ids.length === 0
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

        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No users found. Click "Add New User" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users &&
              Array.isArray(users) &&
              users.map((userItem) => (
                <Card key={userItem.id}>
                  <CardContent className="p-6">
                    {editingId === userItem.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor={`edit-username-${userItem.id}`}
                            className="mb-1"
                          >
                            Username
                          </Label>
                          <Input
                            id={`edit-username-${userItem.id}`}
                            value={draftUser.username || ""}
                            onChange={(e) =>
                              setDraftUser({
                                ...draftUser,
                                username: e.target.value,
                              })
                            }
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`edit-status-${userItem.id}`}
                            className="mb-1"
                          >
                            Status
                          </Label>
                          <Select
                            value={String(draftUser.is_active ?? 1)}
                            onValueChange={(value) =>
                              setDraftUser({
                                ...draftUser,
                                is_active: parseInt(value),
                              })
                            }
                          >
                            <SelectTrigger
                              id={`edit-status-${userItem.id}`}
                              className="w-full"
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Active</SelectItem>
                              <SelectItem value="0">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 mt-4 md:col-span-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(userItem)}
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
                              {userItem.username}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Employee: {getEmployeeName(userItem.employee_id)}
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {userItem.roles &&
                              Array.isArray(userItem.roles) &&
                              userItem.roles.length > 0 ? (
                                userItem.roles.map((role, index) => {
                                  // Handle new format: role_name and role_code
                                  // Also support old format: name, code, id for backward compatibility
                                  const roleName =
                                    role.role_name || role.name || role.code;
                                  const roleCode = role.role_code || role.code;
                                  const roleId = role.id || role.role_id;

                                  return (
                                    <Badge
                                      key={
                                        roleCode ||
                                        roleId ||
                                        role.code ||
                                        `role-${userItem.id}-${index}`
                                      }
                                      variant="secondary"
                                      className="text-sm"
                                    >
                                      {roleName || roleCode || "Unknown Role"}
                                      <button
                                        onClick={() =>
                                          handleRemoveRole(
                                            userItem.id,
                                            roleCode || roleId || role.code
                                          )
                                        }
                                        className="ml-2 text-xs hover:text-red-600 font-bold"
                                        title="Remove role"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  );
                                })
                              ) : (
                                <span className="text-sm text-gray-400">
                                  No roles assigned
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              Status:{" "}
                              <Badge
                                variant={
                                  userItem.is_active === 1 ||
                                  userItem.is_active === true
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  userItem.is_active === 1 ||
                                  userItem.is_active === true
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : ""
                                }
                              >
                                {userItem.is_active === 1 ||
                                userItem.is_active === true
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(userItem)}
                              disabled={adding}
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(userItem)}
                              disabled={adding}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-sm font-semibold mb-2 block">
                            Assign Role:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {roles
                              .filter((role) => {
                                if (
                                  !Array.isArray(userItem.roles) ||
                                  userItem.roles.length === 0
                                ) {
                                  return true; // No roles assigned, show all
                                }
                                // Check if role is already assigned
                                // Handle new format (role_name, role_code) and old format (name, code, id)
                                return !userItem.roles.some((ur) => {
                                  const urCode = ur.role_code || ur.code;
                                  const urId = ur.id || ur.role_id;
                                  const roleCode = role.code;
                                  const roleId = role.id;

                                  // Match by code (primary method for new format)
                                  if (urCode && roleCode) {
                                    if (
                                      String(urCode).toUpperCase() ===
                                      String(roleCode).toUpperCase()
                                    ) {
                                      return true;
                                    }
                                  }
                                  // Match by ID (for backward compatibility)
                                  if (urId && roleId) {
                                    if (
                                      String(urId) === String(roleId) ||
                                      Number(urId) === Number(roleId)
                                    ) {
                                      return true;
                                    }
                                  }
                                  // Cross-match: ur.role_code with role.id or ur.code with role.code
                                  if (
                                    urCode &&
                                    roleId &&
                                    String(urCode).toUpperCase() ===
                                      String(roleId).toUpperCase()
                                  ) {
                                    return true;
                                  }
                                  if (
                                    urId &&
                                    roleCode &&
                                    String(urId) === String(roleCode)
                                  ) {
                                    return true;
                                  }
                                  return false;
                                });
                              })
                              .map((role) => (
                                <Button
                                  key={role.id || role.code}
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleAssignRole(userItem.id, role.id)
                                  }
                                >
                                  + {role.name || role.code}
                                </Button>
                              ))}
                            {roles.filter((role) => {
                              if (
                                !Array.isArray(userItem.roles) ||
                                userItem.roles.length === 0
                              ) {
                                return true;
                              }
                              return !userItem.roles.some((ur) => {
                                const urCode = ur.role_code || ur.code;
                                const urId = ur.id || ur.role_id;
                                const roleCode = role.code;
                                const roleId = role.id;

                                if (urCode && roleCode) {
                                  if (
                                    String(urCode).toUpperCase() ===
                                    String(roleCode).toUpperCase()
                                  ) {
                                    return true;
                                  }
                                }
                                if (urId && roleId) {
                                  if (
                                    String(urId) === String(roleId) ||
                                    Number(urId) === Number(roleId)
                                  ) {
                                    return true;
                                  }
                                }
                                if (
                                  urCode &&
                                  roleId &&
                                  String(urCode).toUpperCase() ===
                                    String(roleId).toUpperCase()
                                ) {
                                  return true;
                                }
                                if (
                                  urId &&
                                  roleCode &&
                                  String(urId) === String(roleCode)
                                ) {
                                  return true;
                                }
                                return false;
                              });
                            }).length === 0 && (
                              <span className="text-sm text-gray-400">
                                All available roles assigned
                              </span>
                            )}
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

export default UsersPage;

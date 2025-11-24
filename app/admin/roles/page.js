"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/app/services/internalApiClient";
import { Badge } from "@/components/ui/badge";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { externalApiClient } from "@/app/services/externalApiClient";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/components/common/AuthContext";
import { getErrorMessage } from "@/lib/emsUtil";

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newRole, setNewRole] = useState({
    name: "",
    code: "",
    description: "",
    is_active: "Y",
    permissions: {},
  });
  const [draftRole, setDraftRole] = useState({});
  const [viewingUsersId, setViewingUsersId] = useState(null);
  const { user } = useAuth();
  console.log("user in RolesPage", user);

  useEffect(() => {
    if (user?.empid) {
      fetchRoles();
      fetchUsers();
    }
  }, [user?.empid]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await externalApiClient.get("/roles");
      const rolesData = res.data?.roles || [];
      setRoles(rolesData);
      setError("");
    } catch (e) {
      console.error("Error fetching roles:", e);
      console.error("Error details:", {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
      });
      const errorMessage = getErrorMessage(e, "Failed to load roles");
      setError(errorMessage);
      toast.error(errorMessage);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await externalApiClient.get("/users");
      // Handle wrapped response format: { users: [...] } or direct array
      const usersData =
        res.data?.users || (Array.isArray(res.data) ? res.data : []);
      setUsers(usersData);
    } catch (e) {
      console.error("Failed to load users", e);
      // Don't show toast for users fetch failure - it's not critical
      setUsers([]);
    }
  };

  const fetchRoleUsers = async (roleId) => {
    try {
      const res = await externalApiClient.get(`/roles/${roleId}/users`);
      let usersData = [];
      if (Array.isArray(res.data)) {
        usersData = res.data;
      } else if (res.data?.users && Array.isArray(res.data.users)) {
        usersData = res.data.users;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        usersData = res.data.data;
      }
      return usersData;
    } catch (e) {
      console.error("Failed to load role users", e);
      return [];
    }
  };

  const handleAddNew = () => {
    setAdding(true);
    setNewRole({
      name: "",
      code: "",
      description: "",
      is_active: "Y",
      permissions: {},
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewRole({
      name: "",
      code: "",
      description: "",
      is_active: "Y",
      permissions: {},
    });
    setError("");
  };

  const handleNewRoleChange = (e) => {
    const { name, value } = e.target;
    setNewRole((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionToggle = (permission) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  const handleSaveNew = async () => {
    if (
      !newRole.name ||
      !newRole.code ||
      !newRole.name.trim() ||
      !newRole.code.trim()
    ) {
      setError("Name and code are required");
      toast.error("Name and code are required");
      return;
    }
    try {
      // Exclude organization_id and org_id from the payload
      const { organization_id, org_id, ...roleData } = newRole;
      const cleanRoleData = {
        name: newRole.name.trim(),
        code: newRole.code.trim(),
        description: roleData.description || "",
        is_active: roleData.is_active ?? "Y",
        permissions: roleData.permissions || {},
      };
      const res = await apiClient.post("/api/roles", cleanRoleData);
      console.log("Add role response:", res.data);
      toast.success("Role created successfully!");
      handleCancelNew();
      setError("");
      await fetchRoles();
    } catch (error) {
      console.error("Error creating role:", error);
      const errorMsg = getErrorMessage(error, "Failed to create role");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (role) => {
    const roleIdentifier = role.id || role.roleid;
    setEditingId(String(roleIdentifier));
    setDraftRole({ ...role });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftRole({});
    setError("");
  };

  const handleSaveEdit = async (role) => {
    try {
      // Exclude organization_id and org_id from the payload
      const { organization_id, org_id, ...roleData } = draftRole;
      const cleanRoleData = {
        name: roleData.name || "",
        code: roleData.code || "",
        description: roleData.description || "",
        is_active: roleData.is_active ?? "Y",
        permissions: roleData.permissions || {},
      };
      const roleIdentifier = role.id || role.roleid;
      const res = await apiClient.patch(
        `/api/roles/${roleIdentifier}`,
        cleanRoleData
      );
      console.log("Update role response:", res.data);
      toast.success("Role updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      const errorMsg = getErrorMessage(error, "Failed to update role");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (role) => {
    if (!confirm(`Are you sure you want to delete role ${role.name}?`)) return;
    try {
      const roleIdentifier = role.id || role.roleid;
      await apiClient.delete(`/api/roles/${roleIdentifier}`);
      toast.success("Role deleted successfully!");
      await fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      const errorMsg = getErrorMessage(error, "Failed to delete role");
      toast.error(errorMsg);
    }
  };

  const handleViewUsers = async (roleId) => {
    console.log("Viewing users for role:", roleId);
    if (viewingUsersId === roleId) {
      setViewingUsersId(null);
    } else {
      setViewingUsersId(roleId);
    }
  };

  const commonPermissions = [
    "can_view_reports",
    "can_approve_attendance",
    "can_approve_leaves",
    "can_manage_employees",
    "can_manage_settings",
  ];

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold mb-3">Roles Management</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1000px] mx-auto">
        <div className="flex justify-between mb-3">
          {!adding && (
            <Button
              onClick={handleAddNew}
              size="sm"
              disabled={editingId !== null}
            >
              Add New Role
            </Button>
          )}
        </div>

        {adding && (
          <div className="border rounded p-4 mb-4 bg-gray-50">
            <h3 className="font-semibold mb-3">Create New Role</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1" htmlFor="name">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter role name"
                  value={newRole?.name}
                  onChange={handleNewRoleChange}
                />
              </div>
              <div>
                <Label className="mb-1" htmlFor="code">
                  Code *
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={newRole.code}
                  onChange={handleNewRoleChange}
                  placeholder="CUSTOM_ROLE"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1" htmlFor="description">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter role description"
                  value={newRole.description}
                  onChange={handleNewRoleChange}
                  className="w-full p-2 border rounded min-h-[90px]"
                  rows={3}
                />
              </div>
              <div>
                <Label className="mb-1" htmlFor="is_active">
                  Status
                </Label>
                <Select
                  value={newRole.is_active || "Y"}
                  onValueChange={(value) =>
                    setNewRole((prev) => ({
                      ...prev,
                      is_active: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Active</SelectItem>
                    <SelectItem value="N">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {commonPermissions.map((permission) => (
                    <Label
                      key={permission}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={newRole.permissions[permission] || false}
                        onChange={() => handlePermissionToggle(permission)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {permission
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </Label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={handleSaveNew} size="sm">
                Save
              </Button>
              <Button onClick={handleCancelNew} size="sm" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div>Loading roles...</div>
        ) : !Array.isArray(roles) || roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No roles found. Click "Add New Role" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => {
              const roleIdentifier = role.id || role.roleid;
              const roleIdString = String(roleIdentifier);
              return (
                <div key={roleIdString} className="border rounded p-4 bg-white">
                  {editingId === roleIdString ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={draftRole.name || ""}
                          onChange={(e) =>
                            setDraftRole({ ...draftRole, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Code</Label>
                        <Input
                          value={draftRole.code || ""}
                          onChange={(e) =>
                            setDraftRole({ ...draftRole, code: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <textarea
                          value={draftRole.description || ""}
                          onChange={(e) =>
                            setDraftRole({
                              ...draftRole,
                              description: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <select
                          value={draftRole.is_active ?? "Y"}
                          onChange={(e) =>
                            setDraftRole({
                              ...draftRole,
                              is_active: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded"
                        >
                          <option value="Y">Active</option>
                          <option value="N">Inactive</option>
                        </select>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => handleSaveEdit(role)}>
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
                        <div>
                          <h3 className="font-semibold text-lg">{role.name}</h3>
                          <p className="text-sm text-gray-600">
                            Code: {role.code}
                          </p>
                          {role.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {role.description}
                            </p>
                          )}
                          {role.permissions &&
                            Object.keys(role.permissions).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(role.permissions)
                                  .filter(([_, value]) => value)
                                  .map(([key]) => (
                                    <Badge key={key} variant="outline">
                                      {key.replace(/_/g, " ")}
                                    </Badge>
                                  ))}
                              </div>
                            )}
                          <p className="text-sm text-gray-600 mt-2">
                            Status:{" "}
                            <span
                              className={
                                role.is_active === "Y" || role.is_active === "y"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {role.is_active === "Y" || role.is_active === "y"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUsers(roleIdentifier)}
                          >
                            {viewingUsersId === roleIdentifier
                              ? "Hide"
                              : "View"}{" "}
                            Users
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEdit(role)}
                            disabled={adding}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(role)}
                            disabled={adding}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      {viewingUsersId === roleIdentifier && (
                        <RoleUsersList roleId={roleIdentifier} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Component to display users with a specific role
const RoleUsersList = ({ roleId }) => {
  const [roleUsers, setRoleUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoleUsers();
  }, [roleId]);

  const fetchRoleUsers = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get(`/roles/${roleId}/users`);
      // Handle wrapped response format: { users: [...] } or direct array
      let usersData = [];
      if (Array.isArray(res.data)) {
        usersData = res.data;
      } else if (res.data?.users && Array.isArray(res.data.users)) {
        usersData = res.data.users;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        usersData = res.data.data;
      }
      setRoleUsers(usersData);
    } catch (e) {
      console.error("Failed to load role users", e);
      setRoleUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="mt-3 text-sm text-gray-500">Loading users...</div>;
  }

  if (roleUsers.length === 0) {
    return (
      <div className="mt-3 text-sm text-gray-500">
        No users assigned to this role
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <h4 className="font-semibold text-sm mb-2">Users with this role:</h4>
      <div className="space-y-2">
        {roleUsers.map((user) => (
          <div key={user.id} className="text-sm text-gray-600">
            • {user.employee_name} {`[${user.username}]`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesPage;

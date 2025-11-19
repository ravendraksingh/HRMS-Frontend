"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/app/services/internalApiClient";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthContext";
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

const RolesPage = () => {
  const { user } = useAuth();
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
    is_active: 1,
    permissions: {},
  });
  const [draftRole, setDraftRole] = useState({});
  const [viewingUsersId, setViewingUsersId] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      fetchRoles();
      fetchUsers();
    }
  }, [user?.user_id]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/roles");
      console.log("Roles API response:", res.data);
      setRoles(res.data.roles);
    } catch (e) {
      console.error("Error fetching roles:", e);
      setError("Error fetching roles");
      toast.error("Failed to load roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await externalApiClient.get("/users");
      setUsers(res.data.users);
    } catch (e) {
      console.error("Failed to load users", e);
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
      is_active: 1,
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
      is_active: 1,
      permissions: {},
    });
    setError("");
  };

  const handleNewRoleChange = (e) => {
    const { name, value } = e.target;
    setNewRole((prev) => ({
      ...prev,
      [name]: name === "is_active" ? parseInt(value) : value,
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
      const res = await apiClient.post("/api/roles", {
        ...newRole,
        name: newRole.name.trim(),
        code: newRole.code.trim(),
      });
      console.log("Add role response:", res.data);
      toast.success("Role created successfully!");
      handleCancelNew();
      setError("");
      await fetchRoles();
    } catch (error) {
      console.error("Error creating role:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create role";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (role) => {
    setEditingId(role.id);
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
      const res = await apiClient.patch(`/api/roles/${role.id}`, draftRole);
      console.log("Update role response:", res.data);
      toast.success("Role updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update role";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (role) => {
    if (!confirm(`Are you sure you want to delete role ${role.name}?`)) return;
    try {
      await apiClient.delete(`/api/roles/${role.id}`);
      toast.success("Role deleted successfully!");
      await fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete role";
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
                  onValueChange={(value) =>
                    handleNewRoleChange({
                      target: { name: "is_active", value: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={1}>Active</SelectItem>
                    <SelectItem value={0}>Inactive</SelectItem>
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
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="border rounded p-4 bg-white">
                {editingId === role.id ? (
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
                        value={draftRole.is_active ?? 1}
                        onChange={(e) =>
                          setDraftRole({
                            ...draftRole,
                            is_active: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2 border rounded"
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
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
                              role.is_active === 1
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {role.is_active === 1 ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewUsers(role.id)}
                        >
                          {viewingUsersId === role.id ? "Hide" : "View"} Users
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
                    {viewingUsersId === role.id && (
                      <RoleUsersList roleId={role.id} />
                    )}
                  </div>
                )}
              </div>
            ))}
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
      setRoleUsers(res.data.users);
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

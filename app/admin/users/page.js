"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserPlus } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { useAuth } from "@/components/common/AuthContext";
import { getErrorMessage } from "@/lib/emsUtil";
import SearchEmployee from "@/components/common/SearchEmployee";

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    empid: "",
    is_active: "Y",
  });
  const [draftUser, setDraftUser] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchRoles();
    } else {
      // If no user, stop loading to prevent infinite loading state
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/users");
      const usersData = res.data?.users;
      setUsers(usersData);
      setError("");
    } catch (e) {
      console.error("Error fetching users:", e);
      const errorMessage = getErrorMessage(e, "Failed to load users");
      setError(errorMessage);
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await externalApiClient.get("/roles");
      const rolesData = res.data?.roles;
      setRoles(rolesData);
    } catch (e) {
      console.error("Failed to load roles", e);
      const errorMessage = getErrorMessage(e, "Failed to load roles");
      setError(errorMessage);
      toast.error(errorMessage);
      setRoles([]);
    }
  };

  const handleAddNew = () => {
    setAdding(true);
    setNewUser({
      username: "",
      password: "",
      empid: "",
      is_active: "Y",
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewUser({
      username: "",
      password: "",
      empid: "",
      is_active: "Y",
    });
    setError("");
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveNew = async () => {
    if (!newUser.username || !newUser.password || !newUser.empid) {
      setError("Username, password, and Employee ID are required");
      toast.error("Username, password, and Employee ID are required");
      return;
    }

    try {
      const res = await externalApiClient.post("/users", newUser);
      toast.success("User created successfully!");
      handleCancelNew();
      setError("");
      fetchUsers();
    } catch (error) {
      const errorMsg = getErrorMessage(error, "Failed to create user");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.username);
    setDraftUser({ ...user });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftUser({});
    setError("");
  };

  const handleSaveEdit = async (username) => {
    try {
      const res = await externalApiClient.patch(
        `/users/${username}`,
        draftUser
      );
      toast.success("User updated successfully!");
      handleCancelEdit();
      setError("");
      // Refresh users list to get updated data from server
      await fetchUsers();
    } catch (error) {
      const errorMsg = getErrorMessage(error, "Failed to update user");
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
      await externalApiClient.delete(`/users/${userToDelete.username}`);
      setUsers((prev) =>
        prev.filter((u) => u.username !== userToDelete.username)
      );
      toast.success("User deleted successfully!");
    } catch (error) {
      const errorMsg = getErrorMessage(error, "Failed to delete user");
      toast.error(errorMsg);
    }
  };

  const handleAssignRole = async (username, roleId) => {
    // Find the role to check if it's ADMIN or CXO
    const role = roles.find((r) => r.roleid === roleId);
    if (role) {
      const isAdmin = role.roleid === "ADMIN";
      const isCxo = role.roleid === "CXO";

      if (isAdmin || isCxo) {
        toast.error(`${role.name} role cannot be assigned`);
        return;
      }
    }

    try {
      const res = await externalApiClient.post(`/users/${username}/roles`, {
        roleid: roleId,
        assignedBy: user.empid,
      });
      toast.success("Role assigned successfully!");
      // Refresh users list to get updated roles
      await fetchUsers();
    } catch (error) {
      const errorMsg = getErrorMessage(error, "Failed to assign role");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRemoveRole = async (username, roleIdentifier) => {
    if (!confirm("Are you sure you want to remove this role?")) return;
    try {
      // roleIdentifier could be a roleid, role_id, or role id
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
          // If not found, try using the identifier as-is (might work if backend accepts codes)
          actualRoleId = roleIdentifier;
        }
      }

      await externalApiClient.delete(
        `/users/${username}/roles/${actualRoleId}`
      );
      toast.success("Role removed successfully!");
      await fetchUsers();
    } catch (error) {
      const errorMsg = getErrorMessage(error, "Failed to remove role");
      setError(errorMsg);
      toast.error(errorMsg);
    }
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
          <Card key="add-user-form" className="mb-4">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-username" className="mb-1">
                    Username *
                  </Label>
                  <Input
                    type="text"
                    name="username"
                    id="new-username"
                    value={newUser.username || ""}
                    onChange={handleNewUserChange}
                    placeholder="Enter username"
                    autoComplete="off"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-password" className="mb-1">
                    Password *
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    id="new-password"
                    value={newUser.password || ""}
                    onChange={handleNewUserChange}
                    placeholder="Enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <SearchEmployee
                    onSelect={(empid, employee) => {
                      setNewUser({ ...newUser, empid: empid || "" });
                    }}
                    label="Employee ID *"
                    placeholder="Search employee by ID or name..."
                    showLabel={true}
                  />
                </div>
                <div>
                  <Label htmlFor="is_active" className="mb-1">
                    Status
                  </Label>
                  <Select
                    value={newUser.is_active}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, is_active: value })
                    }
                  >
                    <SelectTrigger id="is_active" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Active</SelectItem>
                      <SelectItem value="N">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSaveNew}
                  disabled={
                    !newUser.username || !newUser.password || !newUser.empid
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
              users.map((userItem, index) => (
                <Card key={userItem.username || `user-${index}`}>
                  <CardContent className="p-6">
                    {editingId === userItem.username ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor={`edit-username-${userItem.username}`}
                            className="mb-1"
                          >
                            Username
                          </Label>
                          <Input
                            id={`edit-username-${userItem.username}`}
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
                            htmlFor={`edit-status-${userItem.username}`}
                            className="mb-1"
                          >
                            Status
                          </Label>
                          <Select
                            value={draftUser.is_active ?? "Y"}
                            onValueChange={(value) =>
                              setDraftUser({
                                ...draftUser,
                                is_active: value,
                              })
                            }
                          >
                            <SelectTrigger
                              id={`edit-status-${userItem.username}`}
                              className="w-full"
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">Active</SelectItem>
                              <SelectItem value="N">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 mt-4 md:col-span-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(userItem.username)}
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
                              Username: {userItem.username}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Employee ID: {userItem.empid} Name:{" "}
                              {userItem.employee_name}
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {userItem.roles &&
                              Array.isArray(userItem.roles) &&
                              userItem.roles.length > 0 ? (
                                userItem.roles.map((role, index) => {
                                  const roleName = role.role_name;
                                  const roleId = role.roleid;

                                  return (
                                    <Badge
                                      key={roleId}
                                      variant="secondary"
                                      className="text-sm"
                                    >
                                      {roleName || roleId || "Unknown Role"}
                                      <button
                                        onClick={() =>
                                          handleRemoveRole(
                                            userItem.username,
                                            roleId
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
                                  userItem.is_active === "Y" ||
                                  userItem.is_active === "y"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  userItem.is_active === "Y" ||
                                  userItem.is_active === "y"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : ""
                                }
                              >
                                {userItem.is_active === "Y" ||
                                userItem.is_active === "y"
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(userItem)}
                              disabled={adding || editingId !== null}
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(userItem)}
                              disabled={adding || editingId !== null}
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
                                // Only show active roles
                                const isActive =
                                  role.is_active === "Y" ||
                                  role.is_active === "y";
                                if (!isActive) {
                                  return false; // Exclude inactive roles
                                }

                                // Always filter out ADMIN and CXO roles - they should never appear
                                const roleId = role.roleid?.toUpperCase() || "";
                                const isAdmin = roleId === "ADMIN";
                                const isCxo = roleId === "CXO";
                                if (isAdmin || isCxo) {
                                  return false; // Always exclude ADMIN and CXO
                                }

                                // If user has no roles assigned, show all active roles (except ADMIN/CXO)
                                if (
                                  !Array.isArray(userItem.roles) ||
                                  userItem.roles.length === 0
                                ) {
                                  return true;
                                }

                                // Only show roles that are NOT already assigned to this user
                                const isAlreadyAssigned = userItem.roles.some(
                                  (ur) => {
                                    return ur.roleid === role.roleid;
                                  }
                                );

                                // Return false if already assigned (so it's filtered out)
                                return !isAlreadyAssigned;
                              })
                              .map((role) => {
                                const roleId = role.roleid;
                                const isAdmin = roleId === "ADMIN";
                                const isCxo = roleId === "CXO";
                                const isDisabled = isAdmin || isCxo;

                                return (
                                  <Button
                                    key={role.roleid}
                                    size="sm"
                                    variant="outline"
                                    disabled={isDisabled}
                                    onClick={() =>
                                      handleAssignRole(
                                        userItem.username,
                                        role.roleid
                                      )
                                    }
                                  >
                                    + {role.name}
                                  </Button>
                                );
                              })}
                            {roles.filter((role) => {
                              if (
                                !Array.isArray(userItem.roles) ||
                                userItem.roles.length === 0
                              ) {
                                return true;
                              }
                              return !userItem.roles.some((ur) => {
                                return ur.roleid === role.roleid;
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

export default ManageUsersPage;

"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { CalendarOff, Plus, X, Edit, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getErrorMessage } from "@/lib/emsUtil";

const ManageLeaveTypesPage = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newLeaveType, setNewLeaveType] = useState({
    leavetype_id: "",
    name: "",
    description: "",
    max_leaves_per_year: "",
    carry_forward: "N",
    max_carry_forward: 0,
    requires_approval: "Y",
    requires_medical_certificate: "N",
    is_active: "Y",
  });
  const [draftLeaveType, setDraftLeaveType] = useState({});

  const fetchLeaveTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/leave-types");
      const typesData = res.data?.leave_types;
      setLeaveTypes(Array.isArray(typesData) ? typesData : []);
      setError("");
    } catch (e) {
      console.error("Error fetching leave types:", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Error fetching leave types";
      setError(errorMessage);
      toast.error(`Failed to load leave types: ${errorMessage}`);
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const handleAddNew = () => {
    setAdding(true);
    setNewLeaveType({
      leavetype_id: "",
      name: "",
      description: "",
      max_leaves_per_year: "",
      carry_forward: "N",
      max_carry_forward: 0,
      requires_approval: "Y",
      requires_medical_certificate: "N",
      is_active: "Y",
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewLeaveType({
      leavetype_id: "",
      name: "",
      description: "",
      max_leaves_per_year: "",
      carry_forward: "N",
      max_carry_forward: 0,
      requires_approval: "Y",
      requires_medical_certificate: "N",
      is_active: "Y",
    });
    setError("");
  };

  const handleNewLeaveTypeChange = (e) => {
    const { name, value, type } = e.target;
    setNewLeaveType((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : parseInt(value)
          : name === "leavetype_id"
          ? value.toUpperCase()
          : value,
    }));
  };

  const handleSaveNew = async () => {
    if (!newLeaveType.leavetype_id || !newLeaveType.leavetype_id.trim()) {
      setError("Leave Type ID is required");
      toast.error("Leave Type ID is required");
      return;
    }
    if (newLeaveType.leavetype_id.trim().length > 3) {
      setError("Leave Type ID must be 3 characters or less");
      toast.error("Leave Type ID must be 3 characters or less");
      return;
    }
    if (!newLeaveType.name || !newLeaveType.name.trim()) {
      setError("Name is required");
      toast.error("Name is required");
      return;
    }
    try {
      const payload = {
        leavetype_id: newLeaveType.leavetype_id.trim().toUpperCase(),
        name: newLeaveType.name.trim(),
        description: newLeaveType.description?.trim() || "",
        max_leaves_per_year: newLeaveType.max_leaves_per_year
          ? parseInt(newLeaveType.max_leaves_per_year)
          : 0,
        carry_forward: newLeaveType.carry_forward || "N",
        max_carry_forward: newLeaveType.max_carry_forward
          ? parseInt(newLeaveType.max_carry_forward)
          : 0,
        requires_approval: newLeaveType.requires_approval || "Y",
        requires_medical_certificate:
          newLeaveType.requires_medical_certificate || "N",
        is_active: newLeaveType.is_active || "Y",
      };
      const res = await externalApiClient.post("/leave-types", payload);
      console.log("Add leave type response:", res.data);
      toast.success("Leave type added successfully!");
      handleCancelNew();
      setError("");
      await fetchLeaveTypes();
    } catch (error) {
      console.error("Error adding leave type:", error);
      const errorMsg = getErrorMessage(error, "Failed to add leave type");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (leaveType) => {
    setEditingId(leaveType.leavetype_id);
    setAdding(false);
    setDraftLeaveType({
      leavetype_id: leaveType.leavetype_id || "",
      name: leaveType.name || "",
      description: leaveType.description || "",
      max_leaves_per_year: leaveType.max_leaves_per_year || "",
      carry_forward: leaveType.carry_forward || "N",
      max_carry_forward: leaveType.max_carry_forward || 0,
      requires_approval: leaveType.requires_approval || "Y",
      requires_medical_certificate:
        leaveType.requires_medical_certificate || "N",
      is_active: leaveType.is_active || "Y",
    });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftLeaveType({});
    setError("");
  };

  const handleDraftLeaveTypeChange = (e) => {
    const { name, value, type } = e.target;
    setDraftLeaveType((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : parseInt(value)
          : name === "leavetype_id"
          ? value.toUpperCase()
          : value,
    }));
  };

  const handleSaveEdit = async (leaveType) => {
    if (!draftLeaveType.leavetype_id || !draftLeaveType.leavetype_id.trim()) {
      setError("Leave Type ID is required");
      toast.error("Leave Type ID is required");
      return;
    }
    if (draftLeaveType.leavetype_id.trim().length > 3) {
      setError("Leave Type ID must be 3 characters or less");
      toast.error("Leave Type ID must be 3 characters or less");
      return;
    }
    if (!draftLeaveType.name || !draftLeaveType.name.trim()) {
      setError("Name is required");
      toast.error("Name is required");
      return;
    }
    try {
      const payload = {
        leavetype_id: draftLeaveType.leavetype_id.trim().toUpperCase(),
        name: draftLeaveType.name.trim(),
        description: draftLeaveType.description?.trim() || "",
        max_leaves_per_year: draftLeaveType.max_leaves_per_year
          ? parseInt(draftLeaveType.max_leaves_per_year)
          : 0,
        carry_forward: draftLeaveType.carry_forward || "N",
        max_carry_forward: draftLeaveType.max_carry_forward
          ? parseInt(draftLeaveType.max_carry_forward)
          : 0,
        requires_approval: draftLeaveType.requires_approval || "Y",
        requires_medical_certificate:
          draftLeaveType.requires_medical_certificate || "N",
        is_active: draftLeaveType.is_active || "Y",
      };
      const id = leaveType.leavetype_id;
      const res = await externalApiClient.patch(`/leave-types/${id}`, payload);
      console.log("Update leave type response:", res.data);
      toast.success("Leave type updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchLeaveTypes();
    } catch (error) {
      console.error("Error updating leave type:", error);
      const errorMsg = getErrorMessage(error, "Failed to update leave type");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (leaveType) => {
    if (
      !confirm(
        `Are you sure you want to delete "${
          leaveType.name || leaveType.leavetype_id
        }"?`
      )
    )
      return;
    try {
      const id = leaveType.leavetype_id;
      await externalApiClient.delete(`/leave-types/${id}`);
      toast.success("Leave type deleted successfully!");
      await fetchLeaveTypes();
    } catch (error) {
      console.error("Error deleting leave type:", error);
      const errorMsg = getErrorMessage(error, "Failed to delete leave type");
      toast.error(errorMsg);
    }
  };

  return (
    <div className="px-5 max-w-[1000px] mx-auto">
      <div className="my-6">
        <h1 className="text-3xl font-bold mb-2">Manage Leave Types</h1>
        <p className="text-gray-600">
          Create and manage different types of leave available to employees
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Add New Leave Type */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Leave Types
            </CardTitle>
            {!adding && (
              <Button onClick={handleAddNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Leave Type
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {adding && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Add New Leave Type</h3>
                <Button variant="ghost" size="sm" onClick={handleCancelNew}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_leavetype_id" className="mb-1">
                    Leave Type ID * (Max 3 characters)
                  </Label>
                  <Input
                    id="new_leavetype_id"
                    name="leavetype_id"
                    value={newLeaveType.leavetype_id}
                    onChange={handleNewLeaveTypeChange}
                    placeholder="e.g., CL, SL"
                    maxLength={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new_name" className="mb-1">
                    Name *
                  </Label>
                  <Input
                    id="new_name"
                    name="name"
                    value={newLeaveType.name}
                    onChange={handleNewLeaveTypeChange}
                    placeholder="e.g., Casual Leave"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="new_description" className="mb-1">
                    Description
                  </Label>
                  <Textarea
                    id="new_description"
                    name="description"
                    value={newLeaveType.description}
                    onChange={handleNewLeaveTypeChange}
                    placeholder="Enter description for this leave type..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="new_max_leaves_per_year" className="mb-1">
                    Max Leaves Per Year *
                  </Label>
                  <Input
                    id="new_max_leaves_per_year"
                    name="max_leaves_per_year"
                    type="number"
                    min="0"
                    value={newLeaveType.max_leaves_per_year}
                    onChange={handleNewLeaveTypeChange}
                    placeholder="Maximum leaves allowed per year"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new_max_carry_forward" className="mb-1">
                    Max Carry Forward
                  </Label>
                  <Input
                    id="new_max_carry_forward"
                    name="max_carry_forward"
                    type="number"
                    min="0"
                    value={newLeaveType.max_carry_forward}
                    onChange={handleNewLeaveTypeChange}
                    placeholder="Maximum leaves that can be carried forward"
                  />
                </div>
                <div>
                  <Label htmlFor="new_is_active" className="mb-1">
                    Status
                  </Label>
                  <Select
                    value={newLeaveType.is_active === "Y" ? "Y" : "N"}
                    onValueChange={(value) =>
                      setNewLeaveType((prev) => ({
                        ...prev,
                        is_active: value,
                      }))
                    }
                  >
                    <SelectTrigger id="new_is_active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Active</SelectItem>
                      <SelectItem value="N">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_requires_approval" className="mb-1">
                    Requires Approval
                  </Label>
                  <Select
                    value={newLeaveType.requires_approval || "Y"}
                    onValueChange={(value) =>
                      setNewLeaveType((prev) => ({
                        ...prev,
                        requires_approval: value,
                      }))
                    }
                  >
                    <SelectTrigger id="new_requires_approval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Yes</SelectItem>
                      <SelectItem value="N">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="new_carry_forward"
                      name="carry_forward"
                      checked={newLeaveType.carry_forward === "Y"}
                      onChange={(e) =>
                        setNewLeaveType((prev) => ({
                          ...prev,
                          carry_forward: e.target.checked ? "Y" : "N",
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="new_carry_forward"
                      className="cursor-pointer"
                    >
                      Allow carry forward to next year
                    </Label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="new_requires_medical_certificate"
                      name="requires_medical_certificate"
                      checked={
                        newLeaveType.requires_medical_certificate === "Y"
                      }
                      onChange={(e) =>
                        setNewLeaveType((prev) => ({
                          ...prev,
                          requires_medical_certificate: e.target.checked
                            ? "Y"
                            : "N",
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="new_requires_medical_certificate"
                      className="cursor-pointer"
                    >
                      Requires medical certificate
                    </Label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveNew} size="sm">
                  Save
                </Button>
                <Button onClick={handleCancelNew} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Leave Types List */}
          {loading ? (
            <div className="text-center py-8">
              <Spinner />
              <p className="text-gray-500 mt-2">Loading leave types...</p>
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No leave types found</p>
              <p className="text-sm mt-2">
                Click "Add Leave Type" to create your first leave type
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveTypes.map((leaveType) => (
                <Card key={leaveType.leavetype_id}>
                  <CardContent className="p-4">
                    {editingId === leaveType.leavetype_id ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold">Edit Leave Type</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit_leavetype_id" className="mb-1">
                              Leave Type ID * (Max 3 characters)
                            </Label>
                            <Input
                              id="edit_leavetype_id"
                              name="leavetype_id"
                              value={draftLeaveType.leavetype_id}
                              onChange={handleDraftLeaveTypeChange}
                              maxLength={3}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_name" className="mb-1">
                              Name *
                            </Label>
                            <Input
                              id="edit_name"
                              name="name"
                              value={draftLeaveType.name}
                              onChange={handleDraftLeaveTypeChange}
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="edit_description" className="mb-1">
                              Description
                            </Label>
                            <Textarea
                              id="edit_description"
                              name="description"
                              value={draftLeaveType.description}
                              onChange={handleDraftLeaveTypeChange}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="edit_max_leaves_per_year"
                              className="mb-1"
                            >
                              Max Leaves Per Year *
                            </Label>
                            <Input
                              id="edit_max_leaves_per_year"
                              name="max_leaves_per_year"
                              type="number"
                              min="0"
                              value={draftLeaveType.max_leaves_per_year}
                              onChange={handleDraftLeaveTypeChange}
                              required
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="edit_max_carry_forward"
                              className="mb-1"
                            >
                              Max Carry Forward
                            </Label>
                            <Input
                              id="edit_max_carry_forward"
                              name="max_carry_forward"
                              type="number"
                              min="0"
                              value={draftLeaveType.max_carry_forward}
                              onChange={handleDraftLeaveTypeChange}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_is_active" className="mb-1">
                              Status
                            </Label>
                            <Select
                              value={
                                draftLeaveType.is_active === "Y" ? "Y" : "N"
                              }
                              onValueChange={(value) =>
                                setDraftLeaveType((prev) => ({
                                  ...prev,
                                  is_active: value,
                                }))
                              }
                            >
                              <SelectTrigger id="edit_is_active">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Y">Active</SelectItem>
                                <SelectItem value="N">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label
                              htmlFor="edit_requires_approval"
                              className="mb-1"
                            >
                              Requires Approval
                            </Label>
                            <Select
                              value={draftLeaveType.requires_approval || "Y"}
                              onValueChange={(value) =>
                                setDraftLeaveType((prev) => ({
                                  ...prev,
                                  requires_approval: value,
                                }))
                              }
                            >
                              <SelectTrigger id="edit_requires_approval">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Y">Yes</SelectItem>
                                <SelectItem value="N">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="edit_carry_forward"
                                name="carry_forward"
                                checked={draftLeaveType.carry_forward === "Y"}
                                onChange={(e) =>
                                  setDraftLeaveType((prev) => ({
                                    ...prev,
                                    carry_forward: e.target.checked ? "Y" : "N",
                                  }))
                                }
                                className="rounded border-gray-300"
                              />
                              <Label
                                htmlFor="edit_carry_forward"
                                className="cursor-pointer"
                              >
                                Allow carry forward to next year
                              </Label>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="edit_requires_medical_certificate"
                                name="requires_medical_certificate"
                                checked={
                                  draftLeaveType.requires_medical_certificate ===
                                  "Y"
                                }
                                onChange={(e) =>
                                  setDraftLeaveType((prev) => ({
                                    ...prev,
                                    requires_medical_certificate: e.target
                                      .checked
                                      ? "Y"
                                      : "N",
                                  }))
                                }
                                className="rounded border-gray-300"
                              />
                              <Label
                                htmlFor="edit_requires_medical_certificate"
                                className="cursor-pointer"
                              >
                                Requires medical certificate
                              </Label>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleSaveEdit(leaveType)}
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {leaveType.name || leaveType.leavetype_id}
                              </h3>
                              <Badge
                                variant={
                                  leaveType.is_active === "N"
                                    ? "secondary"
                                    : "default"
                                }
                                className={
                                  leaveType.is_active === "N"
                                    ? "bg-gray-500"
                                    : "bg-green-500"
                                }
                              >
                                {leaveType.is_active === "N"
                                  ? "Inactive"
                                  : "Active"}
                              </Badge>
                              {leaveType.carry_forward === "Y" && (
                                <Badge variant="outline">Carry Forward</Badge>
                              )}
                              {leaveType.requires_approval === "Y" && (
                                <Badge variant="outline">
                                  Requires Approval
                                </Badge>
                              )}
                              {leaveType.requires_medical_certificate ===
                                "Y" && (
                                <Badge variant="outline">
                                  Medical Certificate
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-4 text-sm text-gray-600 mb-2 flex-wrap">
                              <span>
                                <span className="font-medium">ID:</span>{" "}
                                {leaveType.leavetype_id}
                              </span>
                              {leaveType.max_leaves_per_year && (
                                <span>
                                  <span className="font-medium">
                                    Max Leaves/Year:
                                  </span>{" "}
                                  {leaveType.max_leaves_per_year}
                                </span>
                              )}
                              {leaveType.carry_forward === "Y" &&
                                leaveType.max_carry_forward > 0 && (
                                  <span>
                                    <span className="font-medium">
                                      Max Carry Forward:
                                    </span>{" "}
                                    {leaveType.max_carry_forward}
                                  </span>
                                )}
                            </div>
                            {leaveType.description && (
                              <p className="text-sm text-gray-600">
                                {leaveType.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(leaveType)}
                              disabled={adding}
                              variant="outline"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(leaveType)}
                              disabled={adding}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageLeaveTypesPage;

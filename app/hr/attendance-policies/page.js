"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Shield } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { getErrorMessage } from "@/lib/emsUtil";

const AttendancePoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    grace_in_minutes: 0,
    late_threshold_minutes: 0,
  });
  const [draftPolicy, setDraftPolicy] = useState({});

  useEffect(() => {
    if (user?.user_id) {
      fetchPolicies();
    }
  }, [user?.user_id]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/attendance/policies");
      setPolicies(res.data.policies);
      setError("");
    } catch (e) {
      console.error("Error fetching policies:", e);
      setError("Error fetching policies");
      toast.error("Failed to load policies");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setAdding(true);
    setNewPolicy({
      name: "",
      grace_in_minutes: 0,
      late_threshold_minutes: 0,
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewPolicy({
      name: "",
      grace_in_minutes: 0,
      late_threshold_minutes: 0,
    });
    setError("");
  };

  const handleNewPolicyChange = (e) => {
    const { name, value } = e.target;
    setNewPolicy((prev) => ({
      ...prev,
      [name]: name === "name" ? value : parseInt(value) || 0,
    }));
  };

  const handleSaveNew = async () => {
    if (!newPolicy.name || !newPolicy.name.trim()) {
      setError("Name is required");
      toast.error("Name is required");
      return;
    }
    try {
      const res = await externalApiClient.post("/attendance/policies", {
        ...newPolicy,
        name: newPolicy.name.trim(),
      });
      console.log("Add policy response:", res.data);
      toast.success("Policy added successfully!");
      handleCancelNew();
      setError("");
      await fetchPolicies();
    } catch (error) {
      console.error("Error adding policy:", error);
      const errorMsg = getErrorMessage(error, "Failed to add policy");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (policy) => {
    setEditingId(policy.id);
    setDraftPolicy({ ...policy });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftPolicy({});
    setError("");
  };

  const handleSaveEdit = async (policy) => {
    try {
      const res = await externalApiClient.patch(`/attendance/policies/${policy.id}`, {
        ...draftPolicy,
        name: draftPolicy.name?.trim() || draftPolicy.name,
      });
      console.log("Update policy response:", res.data);
      toast.success("Policy updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchPolicies();
    } catch (error) {
      console.error("Error updating policy:", error);
      const errorMsg = getErrorMessage(error, "Failed to update policy");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold mb-3">Attendance Policies</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1200px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Policy List</h2>
          {!adding && (
            <Button onClick={handleAddNew} disabled={editingId !== null}>
              <Shield className="h-4 w-4 mr-2" />
              Add New Policy
            </Button>
          )}
        </div>

        {adding && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="mb-1">Name *</Label>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    value={newPolicy.name}
                    onChange={handleNewPolicyChange}
                    placeholder="Enter policy name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grace_in_minutes" className="mb-1">Grace Period (minutes)</Label>
                  <Input
                    type="number"
                    name="grace_in_minutes"
                    id="grace_in_minutes"
                    value={newPolicy.grace_in_minutes}
                    onChange={handleNewPolicyChange}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="late_threshold_minutes" className="mb-1">Late Threshold (minutes)</Label>
                  <Input
                    type="number"
                    name="late_threshold_minutes"
                    id="late_threshold_minutes"
                    value={newPolicy.late_threshold_minutes}
                    onChange={handleNewPolicyChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveNew}>Save</Button>
                <Button onClick={handleCancelNew} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">Loading policies...</CardContent>
          </Card>
        ) : policies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No policies found. Click "Add New Policy" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-6">
                  {editingId === policy.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1">Name *</Label>
                        <Input
                          value={draftPolicy.name || ""}
                          onChange={(e) =>
                            setDraftPolicy({ ...draftPolicy, name: e.target.value })
                          }
                          placeholder="Enter policy name"
                          required
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Grace Period (minutes)</Label>
                        <Input
                          type="number"
                          value={draftPolicy.grace_in_minutes || 0}
                          onChange={(e) =>
                            setDraftPolicy({
                              ...draftPolicy,
                              grace_in_minutes: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Late Threshold (minutes)</Label>
                        <Input
                          type="number"
                          value={draftPolicy.late_threshold_minutes || 0}
                          onChange={(e) =>
                            setDraftPolicy({
                              ...draftPolicy,
                              late_threshold_minutes: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={() => handleSaveEdit(policy)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{policy.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Grace Period: {policy.grace_in_minutes || 0} minutes
                          </p>
                          <p className="text-sm text-gray-600">
                            Late Threshold: {policy.late_threshold_minutes || 0} minutes
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(policy)}
                            disabled={adding}
                            variant="outline"
                          >
                            Edit
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
      </div>
    </div>
  );
};

export default AttendancePoliciesPage;

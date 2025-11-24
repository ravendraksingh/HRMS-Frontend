"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Briefcase,
  Calendar,
  Building,
  Award,
  TrendingUp,
  User,
  ArrowRight,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

export default function JobHistoryManagement({ employeeId }) {
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    change_type: "PROMOTION",
    previous_job_title: "",
    new_job_title: "",
    previous_department_id: "",
    new_department_id: "",
    previous_manager_id: "",
    new_manager_id: "",
    effective_date: "",
    reason: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (employeeId) {
      fetchJobHistory();
      fetchDepartments();
    }
  }, [employeeId]);

  const fetchDepartments = async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const deptData = res.data?.departments || res.data || [];
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchJobHistory = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get(
        `/employees/${employeeId}/job-history`
      );
      const historyData = res.data?.job_history || res.data || [];
      const sortedHistory = Array.isArray(historyData)
        ? [...historyData].sort((a, b) => {
            const dateA = new Date(a.effective_date || 0);
            const dateB = new Date(b.effective_date || 0);
            return dateB - dateA;
          })
        : [];
      setJobHistory(sortedHistory);
    } catch (error) {
      console.error("Error fetching job history:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load job history";
      toast.error(errorMessage);
      setJobHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      change_type: "PROMOTION",
      previous_job_title: "",
      new_job_title: "",
      previous_department_id: "",
      new_department_id: "",
      previous_manager_id: "",
      new_manager_id: "",
      effective_date: "",
      reason: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (historyItem) => {
    setEditingId(historyItem.id);
    setFormData({
      change_type: historyItem.change_type || "PROMOTION",
      previous_job_title: historyItem.previous_job_title || "",
      new_job_title: historyItem.new_job_title || "",
      previous_department_id: historyItem.previous_department_id || "",
      new_department_id: historyItem.new_department_id || "",
      previous_manager_id: historyItem.previous_manager_id || "",
      new_manager_id: historyItem.new_manager_id || "",
      effective_date: historyItem.effective_date
        ? historyItem.effective_date.split("T")[0]
        : "",
      reason: historyItem.reason || "",
      notes: historyItem.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this job history entry?")) {
      return;
    }

    try {
      await externalApiClient.delete(`/employees/${employeeId}/job-history/${id}`);
      toast.success("Job history entry deleted successfully");
      fetchJobHistory();
    } catch (error) {
      console.error("Error deleting job history:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to delete job history entry";
      toast.error(errorMessage);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...formData };
      if (editingId) {
        await externalApiClient.put(
          `/employees/${employeeId}/job-history/${editingId}`,
          payload
        );
        toast.success("Job history updated successfully!");
      } else {
        await externalApiClient.post(
          `/employees/${employeeId}/job-history`,
          payload
        );
        toast.success("Job history added successfully!");
      }
      setDialogOpen(false);
      setEditingId(null);
      fetchJobHistory();
    } catch (error) {
      console.error("Error saving job history:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save job history";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getChangeTypeBadge = (changeType) => {
    const typeMap = {
      PROMOTION: {
        label: "Promotion",
        className: "bg-blue-500 hover:bg-blue-600 text-white",
      },
      TRANSFER: {
        label: "Transfer",
        className: "bg-purple-500 hover:bg-purple-600 text-white",
      },
      DEMOTION: {
        label: "Demotion",
        variant: "destructive",
      },
      LATERAL: {
        label: "Lateral Move",
        variant: "outline",
      },
      RESIGNATION: {
        label: "Resignation",
        variant: "destructive",
      },
      TERMINATION: {
        label: "Termination",
        variant: "destructive",
      },
    };
    const config = typeMap[changeType] || {
      label: changeType,
      variant: "secondary",
    };
    if (config.className) {
      return <Badge className={config.className}>{config.label}</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Job Change
        </Button>
      </div>

      {jobHistory.length > 0 ? (
        <div className="space-y-4">
          {jobHistory.map((change) => (
            <Card key={change.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getChangeTypeBadge(change.change_type)}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Effective:{" "}
                        {change.effective_date
                          ? formatDateDisplay(change.effective_date)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(change)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(change.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Previous Position */}
                  <div className="space-y-3 border-r-0 md:border-r pr-0 md:pr-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">
                      Previous Position
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Job Title</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">
                            {change.previous_job_title || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Department</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          <p>
                            {change.previous_department_name ||
                              change.previous_department_id ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Manager</label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <p>
                            {change.previous_manager_name || "N/A"}
                            {change.previous_manager_empid && (
                              <span className="text-gray-500 text-sm ml-1">
                                ({change.previous_manager_empid})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Position */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">
                      New Position
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Job Title</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="h-4 w-4 text-blue-500" />
                          <p className="font-medium text-blue-600">
                            {change.new_job_title || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Department</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4 text-blue-500" />
                          <p className="text-blue-600">
                            {change.new_department_name ||
                              change.new_department_id ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Manager</label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-blue-500" />
                          <p className="text-blue-600">
                            {change.new_manager_name || "N/A"}
                            {change.new_manager_empid && (
                              <span className="text-gray-500 text-sm ml-1">
                                ({change.new_manager_empid})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {(change.reason || change.notes) && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {change.reason && (
                      <div>
                        <label className="text-xs text-gray-500">Reason</label>
                        <p className="text-sm mt-1">{change.reason}</p>
                      </div>
                    )}
                    {change.notes && (
                      <div>
                        <label className="text-xs text-gray-500">Notes</label>
                        <p className="text-sm mt-1">{change.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No job history available</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Job History" : "Add Job History Entry"}
            </DialogTitle>
            <DialogDescription>
              Record a job change, promotion, transfer, or other employment
              change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Change Type *</Label>
              <Select
                value={formData.change_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, change_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROMOTION">Promotion</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="DEMOTION">Demotion</SelectItem>
                  <SelectItem value="LATERAL">Lateral Move</SelectItem>
                  <SelectItem value="RESIGNATION">Resignation</SelectItem>
                  <SelectItem value="TERMINATION">Termination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Previous Job Title</Label>
                <Input
                  value={formData.previous_job_title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previous_job_title: e.target.value,
                    })
                  }
                  placeholder="Previous job title"
                />
              </div>
              <div>
                <Label>New Job Title *</Label>
                <Input
                  value={formData.new_job_title}
                  onChange={(e) =>
                    setFormData({ ...formData, new_job_title: e.target.value })
                  }
                  placeholder="New job title"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Previous Department</Label>
                <Select
                  value={formData.previous_department_id}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      previous_department_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.id || dept.department_id}
                        value={dept.id || dept.department_id}
                      >
                        {dept.name || dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>New Department</Label>
                <Select
                  value={formData.new_department_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, new_department_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.id || dept.department_id}
                        value={dept.id || dept.department_id}
                      >
                        {dept.name || dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Previous Manager ID</Label>
                <Input
                  value={formData.previous_manager_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previous_manager_id: e.target.value,
                    })
                  }
                  placeholder="Manager employee ID"
                />
              </div>
              <div>
                <Label>New Manager ID</Label>
                <Input
                  value={formData.new_manager_id}
                  onChange={(e) =>
                    setFormData({ ...formData, new_manager_id: e.target.value })
                  }
                  placeholder="Manager employee ID"
                />
              </div>
            </div>

            <div>
              <Label>Effective Date *</Label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) =>
                  setFormData({ ...formData, effective_date: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Reason for this change"
                rows={3}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingId(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.new_job_title || !formData.effective_date}>
              {saving ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Saving...
                </>
              ) : editingId ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


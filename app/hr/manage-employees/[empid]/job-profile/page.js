"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Briefcase,
  Calendar,
  Building,
  User,
  Mail,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Save,
  Edit,
  X,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import JobHistoryManagement from "./components/JobHistoryManagement";

const ManageJobProfilePage = () => {
  const params = useParams();
  const empid = params?.empid;
  const { user } = useAuth();
  const [jobInfo, setJobInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [formData, setFormData] = useState({});

  // Layout handles authentication, so we can assume user is authenticated and has access
  useEffect(() => {
    if (empid && user) {
      setHasAccess(true);
      checkAccessAndFetch();
    }
  }, [empid, user]);

  const checkAccessAndFetch = async () => {
    // Layout handles role checking, so we can proceed directly
    fetchJobProfile();
  };

  const fetchJobProfile = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get(
        `/employees/${empid}/job-information`
      );
      const jobData = res.data || {};
      setJobInfo(jobData);
      setFormData(jobData);
    } catch (error) {
      console.error("Error fetching job profile:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load job profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await externalApiClient.put(`/employees/${empid}/job-information`, formData);
      toast.success("Job profile updated successfully!");
      setEditing(false);
      await fetchJobProfile();
    } catch (error) {
      console.error("Error updating job profile:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to update job profile";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(jobInfo || {});
    setEditing(false);
  };

  const getEmploymentTypeBadge = (type) => {
    const typeMap = {
      FULL_TIME: { label: "Full Time", variant: "default" },
      PART_TIME: { label: "Part Time", variant: "secondary" },
      CONTRACT: { label: "Contract", variant: "outline" },
      INTERN: { label: "Intern", variant: "outline" },
    };
    const config = typeMap[type] || { label: type, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEmploymentStatusBadge = (status) => {
    if (status === "ACTIVE") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        {status || "Unknown"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={32} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Job Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Current Job Information
            </CardTitle>
            {!editing ? (
              <Button onClick={() => setEditing(true)} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" disabled={saving}>
                  {saving ? (
                    <>
                      <Spinner size={16} className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {jobInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label>Employee Name</Label>
                  {editing ? (
                    <Input
                      value={formData.employee_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, employee_name: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="text-base font-medium">
                        {jobInfo.employee_name || "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Employee ID</Label>
                  <p className="text-base mt-1">{jobInfo.empid || "N/A"}</p>
                </div>

                <div>
                  <Label>Email</Label>
                  {editing ? (
                    <Input
                      type="email"
                      value={formData.employee_email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, employee_email: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-base">{jobInfo.employee_email || "N/A"}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Job Title</Label>
                  {editing ? (
                    <Input
                      value={formData.job_title || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, job_title: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Award className="h-4 w-4 text-gray-400" />
                      <p className="text-base font-medium">
                        {jobInfo.job_title || "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Department</Label>
                  {editing ? (
                    <Input
                      value={formData.department_name || formData.department_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department_name: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p className="text-base">
                        {jobInfo.department_name || jobInfo.department_id || "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Manager</Label>
                  {editing ? (
                    <Input
                      value={formData.manager_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, manager_name: e.target.value })
                      }
                      placeholder="Manager name"
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="text-base">
                        {jobInfo.manager_name || "N/A"}
                        {jobInfo.manager_empid && (
                          <span className="text-gray-500 ml-2">
                            ({jobInfo.manager_empid})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <div>
                  <Label>Employment Type</Label>
                  {editing ? (
                    <Select
                      value={formData.employment_type || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, employment_type: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERN">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      {getEmploymentTypeBadge(jobInfo.employment_type)}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Employment Status</Label>
                  {editing ? (
                    <Select
                      value={formData.employment_status || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, employment_status: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                        <SelectItem value="RESIGNED">Resigned</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      {getEmploymentStatusBadge(jobInfo.employment_status)}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Date of Joining</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={
                        formData.date_of_joining
                          ? formData.date_of_joining.split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, date_of_joining: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-base">
                        {jobInfo.date_of_joining
                          ? formatDateDisplay(jobInfo.date_of_joining)
                          : "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Confirmation Date</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={
                        formData.confirmation_date
                          ? formData.confirmation_date.split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmation_date: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="h-4 w-4 text-gray-400" />
                      <p className="text-base">
                        {jobInfo.confirmation_date
                          ? formatDateDisplay(jobInfo.confirmation_date)
                          : "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Probation Information */}
                {jobInfo.probation_start_date && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">
                      Probation Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Probation Period</Label>
                        {editing ? (
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <Input
                              type="date"
                              value={
                                formData.probation_start_date
                                  ? formData.probation_start_date.split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  probation_start_date: e.target.value,
                                })
                              }
                              placeholder="Start Date"
                            />
                            <Input
                              type="date"
                              value={
                                formData.probation_end_date
                                  ? formData.probation_end_date.split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  probation_end_date: e.target.value,
                                })
                              }
                              placeholder="End Date"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="text-sm">
                              {jobInfo.probation_start_date
                                ? formatDateDisplay(jobInfo.probation_start_date)
                                : "N/A"}{" "}
                              -{" "}
                              {jobInfo.probation_end_date
                                ? formatDateDisplay(jobInfo.probation_end_date)
                                : "N/A"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="border-t pt-4 mt-4 space-y-3">
                  {editing && (
                    <>
                      <div>
                        <Label>Grade</Label>
                        <Input
                          value={formData.grade || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, grade: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Level</Label>
                        <Input
                          value={formData.level || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, level: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Shift Name</Label>
                        <Input
                          value={formData.shift_name || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, shift_name: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Cost Center</Label>
                        <Input
                          value={formData.cost_center || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, cost_center: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Employee Category</Label>
                        <Input
                          value={formData.employee_category || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employee_category: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                  {!editing && (
                    <>
                      {jobInfo.grade && (
                        <div>
                          <Label>Grade</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <p className="text-base">{jobInfo.grade}</p>
                          </div>
                        </div>
                      )}
                      {jobInfo.level && (
                        <div>
                          <Label>Level</Label>
                          <p className="text-base mt-1">{jobInfo.level}</p>
                        </div>
                      )}
                      {jobInfo.shift_name && (
                        <div>
                          <Label>Shift</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <p className="text-base">{jobInfo.shift_name}</p>
                          </div>
                        </div>
                      )}
                      {jobInfo.cost_center && (
                        <div>
                          <Label>Cost Center</Label>
                          <p className="text-base mt-1">{jobInfo.cost_center}</p>
                        </div>
                      )}
                      {jobInfo.employee_category && (
                        <div>
                          <Label>Employee Category</Label>
                          <p className="text-base mt-1">
                            {jobInfo.employee_category}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No job information available</p>
          )}
        </CardContent>
      </Card>

      {/* Job History Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Job History Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JobHistoryManagement employeeId={empid} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageJobProfilePage;


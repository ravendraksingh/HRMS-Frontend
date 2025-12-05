"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
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
  MapPin,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import JobHistoryTab from "./components/JobHistoryTab";

const JobProfilePage = () => {
  const { user } = useAuth();
  const [jobInfo, setJobInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.empid) {
      fetchJobProfile();
    }
  }, [user?.empid]);

  const fetchJobProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const employeeId = user?.empid;

      if (!employeeId) {
        toast.error("Employee ID not found. Please contact support.");
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(
        `/employees/${employeeId}/job-information`
      );
      const jobData = res.data || {};
      setJobInfo(jobData);
    } catch (error) {
      console.error("Error fetching job profile:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load job profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
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

  const getProbationStatusBadge = (status) => {
    if (status === "COMPLETED") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          Completed
        </Badge>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
          In Progress
        </Badge>
      );
    }
    return <Badge variant="secondary">{status || "N/A"}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  if (error && !jobInfo) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Error Loading Job Profile</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job Profile</h1>
        <p className="text-gray-600">
          View your current job information and employment history
        </p>
      </div>

      {/* Current Job Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Current Job Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Employee Name
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-base font-medium">
                      {jobInfo.employee_name || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Employee ID
                  </label>
                  <p className="text-base mt-1">{jobInfo.empid || "N/A"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-base">{jobInfo.employee_email || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Job Title
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Award className="h-4 w-4 text-gray-400" />
                    <p className="text-base font-medium">
                      {jobInfo.job_title || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Department
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-gray-400" />
                    <p className="text-base">
                      {jobInfo.department_name || jobInfo.department_id || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Manager
                  </label>
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
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Employment Type
                  </label>
                  <div className="mt-1">
                    {getEmploymentTypeBadge(jobInfo.employment_type)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Employment Status
                  </label>
                  <div className="mt-1">
                    {getEmploymentStatusBadge(jobInfo.employment_status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date of Joining
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-base">
                      {jobInfo.date_of_joining
                        ? formatDateDisplay(jobInfo.date_of_joining)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Confirmation Date
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    <p className="text-base">
                      {jobInfo.confirmation_date
                        ? formatDateDisplay(jobInfo.confirmation_date)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Probation Information */}
                {jobInfo.probation_start_date && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">
                      Probation Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Probation Status
                        </label>
                        <div className="mt-1">
                          {getProbationStatusBadge(jobInfo.probation_status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Probation Period
                        </label>
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
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="border-t pt-4 mt-4 space-y-3">
                  {jobInfo.grade && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Grade
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <p className="text-base">{jobInfo.grade}</p>
                      </div>
                    </div>
                  )}

                  {jobInfo.level && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Level
                      </label>
                      <p className="text-base mt-1">{jobInfo.level}</p>
                    </div>
                  )}

                  {jobInfo.shift_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Shift
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-base">{jobInfo.shift_name}</p>
                      </div>
                    </div>
                  )}

                  {jobInfo.cost_center && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Cost Center
                      </label>
                      <p className="text-base mt-1">{jobInfo.cost_center}</p>
                    </div>
                  )}

                  {jobInfo.employee_category && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Employee Category
                      </label>
                      <p className="text-base mt-1">
                        {jobInfo.employee_category}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No job information available</p>
          )}
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Job History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JobHistoryTab employeeId={user?.empid} />
        </CardContent>
      </Card>
    </div>
  );
};

export default JobProfilePage;


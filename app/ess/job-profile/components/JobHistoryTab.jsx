"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
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
} from "lucide-react";

export default function JobHistoryTab({ employeeId }) {
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchJobHistory();
    }
  }, [employeeId]);

  const fetchJobHistory = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get(
        `/employees/${employeeId}/job-history`
      );
      const historyData = res.data?.job_history || res.data || [];
      // Sort by effective_date descending (newest first)
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

  const getChangeTypeBadge = (changeType) => {
    const typeMap = {
      PROMOTION: {
        label: "Promotion",
        variant: "default",
        className: "bg-blue-500 hover:bg-blue-600 text-white",
      },
      TRANSFER: {
        label: "Transfer",
        variant: "secondary",
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

  if (jobHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No job history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobHistory.map((change, index) => (
        <Card key={change.id || index} className="hover:shadow-md transition-shadow">
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
              {change.approved_at && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approved</span>
                </div>
              )}
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

            {/* Additional Information */}
            {(change.reason || change.notes || change.approved_by_name) && (
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
                {change.approved_by_name && (
                  <div>
                    <label className="text-xs text-gray-500">Approved By</label>
                    <p className="text-sm mt-1">
                      {change.approved_by_name}
                      {change.approved_by_empid && (
                        <span className="text-gray-500 ml-1">
                          ({change.approved_by_empid})
                        </span>
                      )}
                      {change.approved_at && (
                        <span className="text-gray-500 ml-2">
                          on {formatDateDisplay(change.approved_at)}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


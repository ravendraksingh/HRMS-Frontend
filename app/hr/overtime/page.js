"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Clock } from "lucide-react";
import { getErrorMessage } from "@/lib/emsUtil";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { useAuth } from "@/components/common/AuthContext";

const OvertimePage = () => {
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
  });

  const { user } = useAuth();

  useEffect(() => {
    if (user?.empid) {
      fetchOvertime();
    }
  }, [user?.empid]);

  useEffect(() => {
    if (user?.empid && (filters.from || filters.to)) {
      fetchOvertime();
    }
  }, [filters.from, filters.to, user?.empid]);

  const fetchOvertime = async () => {
    try {
      setLoading(true);
      let url = "/overtime?";
      if (filters.from) url += `from=${filters.from}&`;
      if (filters.to) url += `to=${filters.to}&`;
      url = url.replace(/&$/, "");

      const res = await externalApiClient.get(url);
      setOvertimeRequests(res.data.overtime);
      setError("");
    } catch (e) {
      console.error("Error fetching overtime requests:", e);
      setError("Error fetching overtime requests");
      toast.error("Failed to load overtime requests");
      setOvertimeRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (overtimeId) => {
    try {
      const res = await externalApiClient.post(
        `/overtime/${overtimeId}/approve`,
        {
          approved_by: user?.empid,
        }
      );
      console.log("Approve overtime response:", res.data);
      toast.success("Overtime request approved!");
      await fetchOvertime();
    } catch (error) {
      console.error("Error approving overtime:", error);
      const errorMsg = getErrorMessage(error, "Failed to approve overtime request");
      toast.error(errorMsg);
    }
  };

  const handleReject = async (overtimeId) => {
    try {
      const res = await externalApiClient.post(
        `/overtime/${overtimeId}/reject`,
        {
          approved_by: user?.empid,
        }
      );
      console.log("Reject overtime response:", res.data);
      toast.success("Overtime request rejected!");
      await fetchOvertime();
    } catch (error) {
      console.error("Error rejecting overtime:", error);
      const errorMsg = getErrorMessage(error, "Failed to reject overtime request");
      toast.error(errorMsg);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return (
      <Badge variant={statusMap[status] || "outline"}>
        {status?.toUpperCase() || "UNKNOWN"}
      </Badge>
    );
  };

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold mb-3">
        Overtime Management
      </h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1000px] mx-auto">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="from" className="mb-1">
                  From Date
                </Label>
                <Input
                  type="date"
                  id="from"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters({ ...filters, from: e.target.value })
                  }
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="to" className="mb-1">
                  To Date
                </Label>
                <Input
                  type="date"
                  id="to"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters({ ...filters, to: e.target.value })
                  }
                />
              </div>
              <Button onClick={fetchOvertime}>
                <Clock className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              Loading overtime requests...
            </CardContent>
          </Card>
        ) : overtimeRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No overtime requests found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {overtimeRequests.map((ot) => (
              <Card key={ot.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        Employee ID: {ot.employee_id}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Date: {formatDateDisplay(ot.work_date)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Minutes: {ot.minutes} (
                        {Math.round(((ot.minutes || 0) / 60) * 10) / 10} hours)
                      </p>
                      {ot.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reason: {ot.reason}
                        </p>
                      )}
                      <div className="mt-2">{getStatusBadge(ot.status)}</div>
                    </div>
                    {ot.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(ot.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(ot.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OvertimePage;

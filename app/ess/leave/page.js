"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/common/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { CalendarOff, Plus, X, Clock } from "lucide-react";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { getErrorMessage } from "@/lib/emsUtil";

const LeavePage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false);
  const [newLeave, setNewLeave] = useState({
    start_date: "",
    end_date: "",
    leave_type: "",
    reason: "",
  });
  const [filters, setFilters] = useState({
    from: "",
    to: "",
  });

  const { user } = useAuth();

  // Fetch leave types on component mount
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    if (user?.empid) {
      fetchLeaves();
    }
  }, [user?.empid, filters]);

  const fetchLeaveTypes = async () => {
    try {
      setLoadingLeaveTypes(true);
      const res = await externalApiClient.get("/leave-types/available");
      const typesData = res.data?.available_leave_types || [];

      console.log("available_leave_types:", typesData);

      if (Array.isArray(typesData) && typesData.length > 0) {
        const activeTypes = typesData.filter((type) => type.is_active === "Y");
        setLeaveTypes(activeTypes);
        if (!newLeave.leave_type && activeTypes.length > 0) {
          setNewLeave((prev) => ({
            ...prev,
            leave_type: activeTypes[0].leavetype_id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
      toast.error("Failed to load leave types, using default options");
    } finally {
      setLoadingLeaveTypes(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const employeeId = user?.empid;
      if (!employeeId) {
        toast.error("Employee ID not found");
        return;
      }
      let url = `/leaves?empid=${employeeId}`;
      if (filters.from) url += `&from=${filters.from}`;
      if (filters.to) url += `&to=${filters.to}`;
      const res = await externalApiClient.get(url);
      const leavesData = res.data?.leaves || [];
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async () => {
    if (!newLeave.start_date || !newLeave.end_date) {
      toast.error("Please select start and end dates");
      return;
    }
    if (new Date(newLeave.start_date) > new Date(newLeave.end_date)) {
      toast.error("End date must be after start date");
      return;
    }
    if (!newLeave.leave_type) {
      toast.error("Please select a leave type");
      return;
    }
    const employeeId = user?.empid;
    if (!employeeId) {
      toast.error("Employee ID not found");
      return;
    }
    try {
      const payload = {
        empid: employeeId,
        leavetype_id: newLeave.leave_type,
        start_date: newLeave.start_date,
        end_date: newLeave.end_date,
        reason: newLeave.reason || "",
      };
      await externalApiClient.post("/leaves", payload);
      toast.success("Leave request submitted successfully!");
      setAdding(false);
      setNewLeave({
        start_date: "",
        end_date: "",
        leave_type: leaveTypes.length > 0 ? leaveTypes[0].leavetype_id : "",
        reason: "",
      });
      await fetchLeaves();
    } catch (error) {
      const errorMsg = getErrorMessage(error, "Failed to submit leave request");
      toast.error(errorMsg);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    try {
      // Try PATCH to update status to cancelled, or DELETE endpoint
      // Based on API, we might need to use PATCH with status update
      await externalApiClient.patch(`/leaves/${leaveId}`, {
        status: "CANCELLED",
      });
      toast.success("Leave request cancelled!");
      await fetchLeaves();
    } catch (error) {
      // If PATCH doesn't work, try DELETE
      try {
        await externalApiClient.delete(`/leaves/${leaveId}`);
        toast.success("Leave request cancelled!");
        await fetchLeaves();
      } catch (deleteError) {
        const errorMsg = getErrorMessage(
          deleteError,
          "Failed to cancel leave request"
        );
        toast.error(errorMsg);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === "APPROVED")
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          Approved
        </Badge>
      );
    if (statusUpper === "REJECTED")
      return <Badge variant="destructive">Rejected</Badge>;
    if (statusUpper === "CANCELLED")
      return <Badge variant="secondary">Cancelled</Badge>;
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        Pending
      </Badge>
    );
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="container mx-auto max-w-[1000px] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Leave Management</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Request and manage your leave applications
        </p>
      </div>

      {/* Filters and Add Button */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
            {!adding && (
              <Button onClick={() => setAdding(true)} size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Request Leave
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <Label htmlFor="from" className="mb-1 text-sm">
                From Date
              </Label>
              <Input
                type="date"
                id="from"
                value={filters.from}
                onChange={(e) =>
                  setFilters({ ...filters, from: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="to" className="mb-1 text-sm">
                To Date
              </Label>
              <Input
                type="date"
                id="to"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="flex items-end sm:items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ from: "", to: "" })}
                size="sm"
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Leave Form */}
      {adding && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">Request Leave</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setNewLeave({
                    start_date: "",
                    end_date: "",
                    leave_type:
                      leaveTypes.length > 0 ? leaveTypes[0].leavetype_id : "",
                    reason: "",
                  });
                }}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="mb-1">
                  Start Date *
                </Label>
                <Input
                  type="date"
                  name="start_date"
                  id="start_date"
                  value={newLeave.start_date}
                  onChange={(e) =>
                    setNewLeave({ ...newLeave, start_date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="mb-1">
                  End Date *
                </Label>
                <Input
                  type="date"
                  name="end_date"
                  id="end_date"
                  value={newLeave.end_date}
                  onChange={(e) =>
                    setNewLeave({ ...newLeave, end_date: e.target.value })
                  }
                  min={
                    newLeave.start_date ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
              {newLeave.start_date && newLeave.end_date && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Total Days:{" "}
                      {calculateDays(newLeave.start_date, newLeave.end_date)}{" "}
                      day(s)
                    </span>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="leave_type" className="mb-1">
                  Leave Type
                </Label>
                <Select
                  value={newLeave.leave_type}
                  onValueChange={(value) =>
                    setNewLeave({ ...newLeave, leave_type: value })
                  }
                  disabled={loadingLeaveTypes}
                >
                  <SelectTrigger id="leave_type">
                    <SelectValue
                      placeholder={
                        loadingLeaveTypes
                          ? "Loading types..."
                          : "Select leave type"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.length > 0 ? (
                      leaveTypes.map((type) => {
                        const leavetypeId = type.leavetype_id;
                        const name = type.name || leavetypeId;

                        return (
                          <SelectItem key={leavetypeId} value={leavetypeId}>
                            {name}
                          </SelectItem>
                        );
                      })
                    ) : (
                      // Fallback message if no types loaded
                      <SelectItem value="" disabled>
                        No leave types available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="reason" className="mb-1">
                  Reason
                </Label>
                <Textarea
                  name="reason"
                  id="reason"
                  value={newLeave.reason}
                  onChange={(e) =>
                    setNewLeave({ ...newLeave, reason: e.target.value })
                  }
                  placeholder="Enter reason for leave..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                onClick={handleAddLeave}
                disabled={!newLeave.start_date || !newLeave.end_date}
                size="sm"
                className="w-full sm:w-auto"
              >
                Submit Request
              </Button>
              <Button
                onClick={() => {
                  setAdding(false);
                  setNewLeave({
                    start_date: "",
                    end_date: "",
                    leave_type:
                      leaveTypes.length > 0 ? leaveTypes[0].leavetype_id : "",
                    reason: "",
                  });
                }}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading leaves...
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leave requests found
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <Card key={leave.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg break-words">
                            {formatDateDisplay(
                              leave.start_date || leave.from_date
                            )}{" "}
                            -{" "}
                            {formatDateDisplay(leave.end_date || leave.to_date)}
                          </h3>
                          <div className="flex-shrink-0">
                            {getStatusBadge(leave.status)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:gap-4 gap-2 text-sm text-gray-600 mb-2">
                          <span className="break-words">
                            <span className="font-medium">Type:</span>{" "}
                            {leave.leave_type_name ||
                              leave.leavetype_name ||
                              leave.leavetype_id ||
                              leave.leave_type ||
                              "N/A"}
                          </span>
                          <span>
                            <span className="font-medium">Days:</span>{" "}
                            {leave.total_days ||
                              leave.days ||
                              calculateDays(
                                leave.start_date || leave.from_date,
                                leave.end_date || leave.to_date
                              )}
                          </span>
                        </div>
                        {leave.reason && (
                          <p className="text-sm text-gray-600 break-words">
                            <span className="font-medium">Reason:</span>{" "}
                            {leave.reason}
                          </p>
                        )}
                      </div>
                      {(leave.status?.toUpperCase() === "PENDING" ||
                        leave.status?.toLowerCase() === "pending") && (
                        <div className="flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCancelLeave(leave.id || leave.leave_id)
                            }
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
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

export default LeavePage;

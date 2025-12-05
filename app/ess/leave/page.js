"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import {
  CalendarOff,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  List,
  Grid,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDateDisplay, getTodayDate, getCurrentYear } from "@/lib/dateTimeUtil";
import { getFYStartDate, getFYEndDate } from "@/lib/organizationUtil";
import { getErrorMessage } from "@/lib/emsUtil";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SelectLeaveType from "@/components/common/SelectLeaveType";

const LeavePage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [leaveSummary, setLeaveSummary] = useState({
    total: 0,
    used: 0,
    pending: 0,
    remaining: 0,
  });
  const [newLeave, setNewLeave] = useState({
    start_date: getTodayDate(),
    end_date: getTodayDate(),
    leave_type: "",
    reason: "",
  });
  const [filters, setFilters] = useState({
    from: "",
    to: "",
  });
  const [viewType, setViewType] = useState("list"); // 'list' or 'grid'
  const startDateInputRef = useRef(null);

  const { user } = useAuth();

  // Focus start_date input when adding is true
  useEffect(() => {
    if (adding && startDateInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        startDateInputRef.current?.focus();
      }, 100);
    }
  }, [adding]);

  const fetchLeaveSummary = useCallback(async () => {
    try {
      const employeeId = user?.empid;
      if (!employeeId) return;

      const currentYear = getCurrentYear();
      const res = await externalApiClient.get(
        `/employees/${employeeId}/leaves/summary/yearly?year=${currentYear}`
      );
      const summaryData = res.data || {};
      const totals = summaryData.totals || {};

      console.log("totals", totals);
      // Handle pending which might be an object with {total_days, leave_count}
      let pendingValue = 0;
      if (totals.pending) {
        if (typeof totals.pending === "object" && totals.pending !== null) {
          pendingValue = totals.pending.total_days ?? 0;
        } else if (typeof totals.pending === "number") {
          pendingValue = totals.pending;
        }
      }

      setLeaveSummary({
        total: totals.earned || totals.current_balance || 0,
        used: totals.used || 0,
        pending: pendingValue,
        remaining: totals.current_balance || 0,
      });
    } catch (error) {
      console.error("Error fetching leave summary:", error);
      // Don't show error toast for optional data
    }
  }, [user?.empid]);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const employeeId = user?.empid;
      if (!employeeId) {
        toast.error("Employee ID not found");
        return;
      }
      let url = `/employees/${employeeId}/leaves`;
      if (filters.from && filters.to)
        url += `?start_date=${filters.from}&end_date=${filters.to}`;
      else url += `?start_date=${getFYStartDate()}&end_date=${getFYEndDate()}`;
      const res = await externalApiClient.get(url);
      const leavesData = res.data?.leaves || [];
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  }, [user?.empid, filters]);

  useEffect(() => {
    if (user?.empid) {
      fetchLeaves();
      fetchLeaveSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.empid, filters]);

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
      await externalApiClient.post(`/employees/${employeeId}/leaves`, payload);
      toast.success("Leave request submitted successfully!");
      setAdding(false);
      setNewLeave({
        start_date: getTodayDate(),
        end_date: getTodayDate(),
        leave_type: "",
        reason: "",
      });
      await fetchLeaves();
      await fetchLeaveSummary();
    } catch (error) {
      const errorMsg = getErrorMessage(error, "Failed to submit leave request");
      toast.error(errorMsg);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    const employeeId = user?.empid;
    if (!employeeId) {
      toast.error("Employee ID not found");
      return;
    }
    try {
      // Try PATCH to update status to cancelled, or DELETE endpoint
      // Based on API, we might need to use PATCH with status update
      await externalApiClient.patch(
        `/employees/${employeeId}/leaves/${leaveId}`,
        {
          status: "cancelled",
        }
      );
      toast.success("Leave request cancelled!");
      await fetchLeaves();
      await fetchLeaveSummary();
    } catch (error) {
      // If PATCH doesn't work, try DELETE
      try {
        await externalApiClient.delete(
          `/employees/${employeeId}/leaves/${leaveId}`
        );
        toast.success("Leave request cancelled!");
        await fetchLeaves();
        await fetchLeaveSummary();
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
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Leave Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Request and manage your leave applications
        </p>
      </div>

      {/* Leave Summary Cards */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Leave Summary</h2>
        <Button
          asChild
          variant="default"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/ess/leave/leave-balance">
            View Detailed Balance
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Total Leaves
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{leaveSummary.total}</p>
                <p className="text-xs text-gray-500 mt-1">Available this FY</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 ml-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Used Leaves
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-orange-600">
                  {leaveSummary.used}
                </p>
                <p className="text-xs text-gray-500 mt-1">Approved leaves</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 ml-4">
                <CheckCircle2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Pending Leaves
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-yellow-600">
                  {leaveSummary.pending}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 ml-4">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Remaining Leaves
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-green-600">
                  {leaveSummary.remaining}
                </p>
                <p className="text-xs text-gray-500 mt-1">Balance available</p>
                {leaveSummary.total > 0 && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (leaveSummary.remaining / leaveSummary.total) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <CalendarOff className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Leave Form */}
      {adding && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">
                Request Leave
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setNewLeave({
                    start_date: getTodayDate(),
                    end_date: getTodayDate(),
                    leave_type: "",
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
                  ref={startDateInputRef}
                  type="date"
                  name="start_date"
                  id="start_date"
                  value={newLeave.start_date}
                  onChange={(e) =>
                    setNewLeave({ ...newLeave, start_date: e.target.value })
                  }
                  min={getTodayDate()}
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
                  min={newLeave.start_date || getTodayDate()}
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
              <SelectLeaveType
                value={newLeave.leave_type}
                onValueChange={(value) =>
                  setNewLeave({ ...newLeave, leave_type: value })
                }
                label="Leave Type"
                onlyActive={true}
                endpoint="/leave-types/available"
                id="leave_type"
              />
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
                    start_date: getTodayDate(),
                    end_date: getTodayDate(),
                    leave_type: "",
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

      {/* Leave List Table/Grid */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              My Leave Requests
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Request Leave Button */}
              {!adding && (
                <Button
                  onClick={() => setAdding(true)}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              )}
              {/* View Toggle - Hidden on mobile, show on desktop */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant={viewType === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewType("list")}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewType === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewType("grid")}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 pb-6 border-b">
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
                  onChange={(e) =>
                    setFilters({ ...filters, to: e.target.value })
                  }
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
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading leaves...
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leave requests found
            </div>
          ) : (
            <>
              {/* List View - Hidden on mobile, show on desktop when selected */}
              {viewType === "list" && (
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => (
                        <TableRow key={leave.id || leave.leave_id}>
                          <TableCell className="font-medium">
                            {formatDateDisplay(
                              leave.start_date || leave.from_date
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDateDisplay(leave.end_date || leave.to_date)}
                          </TableCell>
                          <TableCell>
                            {leave.leave_type_name ||
                              leave.leavetype_name ||
                              leave.leavetype_id ||
                              leave.leave_type ||
                              "N/A"}
                          </TableCell>
                          <TableCell>
                            {leave.total_days ||
                              leave.days ||
                              calculateDays(
                                leave.start_date || leave.from_date,
                                leave.end_date || leave.to_date
                              )}
                          </TableCell>
                          <TableCell>{getStatusBadge(leave.status)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {leave.reason || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {(leave.status?.toUpperCase() === "PENDING" ||
                              leave.status?.toLowerCase() === "pending") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleCancelLeave(leave.id || leave.leave_id)
                                }
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Grid View - Always show on mobile, show on desktop when selected */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${
                  viewType === "list" ? "md:hidden" : ""
                }`}
              >
                {leaves.map((leave) => (
                  <Card
                    key={leave.id || leave.leave_id}
                    className="border-l-4 border-l-blue-500"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base">
                              {formatDateDisplay(leave.start_date)} -{" "}
                              {formatDateDisplay(
                                leave.end_date || leave.to_date
                              )}
                            </h3>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(leave.status)}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Type:</span>{" "}
                            {leave.leave_type_name ||
                              leave.leavetype_name ||
                              leave.leavetype_id ||
                              leave.leave_type ||
                              "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Days:</span>{" "}
                            {leave.total_days ||
                              leave.days ||
                              calculateDays(
                                leave.start_date || leave.from_date,
                                leave.end_date || leave.to_date
                              )}
                          </div>
                          {leave.reason && (
                            <div>
                              <span className="font-medium">Reason:</span>{" "}
                              <p className="mt-1 text-gray-700 break-words">
                                {leave.reason}
                              </p>
                            </div>
                          )}
                        </div>
                        {(leave.status?.toUpperCase() === "PENDING" ||
                          leave.status?.toLowerCase() === "pending") && (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleCancelLeave(leave.id || leave.leave_id)
                              }
                              className="w-full"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeavePage;

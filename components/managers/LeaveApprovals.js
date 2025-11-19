"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Filter,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function LeaveApprovals({ teamMembers, managerId }) {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
  const [approvalComment, setApprovalComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: "pending",
    employee: "all",
    leaveType: "all",
  });

  useEffect(() => {
    if (teamMembers && teamMembers.length > 0 && managerId) {
      fetchLeaves();
    }
  }, [teamMembers, managerId, filters.status, filters.leaveType]);

  useEffect(() => {
    filterLeaves();
  }, [leaves, filters]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      let url;
      const params = new URLSearchParams();

      // Use manager-specific endpoint for pending leaves, or general endpoint with manager_id for others
      if (filters.status === "pending") {
        url = `/managers/${managerId}/leaves/pending`;
        // Add leave type filter if needed
        if (filters.leaveType !== "all") {
          params.append("leave_type", filters.leaveType);
        }
      } else {
        // Use general leaves endpoint with manager_id parameter
        url = "/leaves";
        params.append("manager_id", managerId);
        if (filters.status !== "all") {
          params.append("status", filters.status);
        }
        if (filters.leaveType !== "all") {
          params.append("leave_type", filters.leaveType);
        }
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await externalApiClient.get(url);
      const leavesData = res.data?.leaves || res.data || [];
      
      // Ensure it's an array and sort by created date (newest first)
      const teamLeaves = Array.isArray(leavesData) ? leavesData : [];
      teamLeaves.sort((a, b) => {
        const dateA = new Date(a.created_at || a.start_date || 0);
        const dateB = new Date(b.created_at || b.start_date || 0);
        return dateB - dateA;
      });

      setLeaves(teamLeaves);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (l) => l.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.employee !== "all") {
      filtered = filtered.filter(
        (l) => (l.employee_id || l.id) === filters.employee
      );
    }

    if (filters.leaveType !== "all") {
      filtered = filtered.filter(
        (l) =>
          (l.leave_type || l.type)?.toLowerCase() ===
          filters.leaveType.toLowerCase()
      );
    }

    setFilteredLeaves(filtered);
  };

  const handleApproveReject = (leave, action) => {
    setSelectedLeave(leave);
    setApprovalAction(action);
    setApprovalComment("");
    setApprovalDialogOpen(true);
  };

  const submitApproval = async () => {
    if (!selectedLeave) return;

    try {
      setProcessing(true);
      const leaveId = selectedLeave.id || selectedLeave.leave_id;

      const payload = {
        status: approvalAction === "approve" ? "approved" : "rejected",
        approver_remarks: approvalComment || null,
      };

      await externalApiClient.patch(`/leaves/${leaveId}`, payload);

      toast.success(
        `Leave request ${approvalAction === "approve" ? "approved" : "rejected"} successfully`
      );
      setApprovalDialogOpen(false);
      setSelectedLeave(null);
      setApprovalComment("");
      await fetchLeaves();
    } catch (error) {
      console.error("Error updating leave:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        `Failed to ${approvalAction} leave request`;
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "approved") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          Approved
        </Badge>
      );
    }
    if (statusLower === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (statusLower === "cancelled") {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        Pending
      </Badge>
    );
  };

  const getEmployeeName = (employeeId) => {
    const member = teamMembers.find(
      (m) => (m.employee_id || m.id) === employeeId
    );
    return member?.employee_name || member?.name || employeeId;
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const pendingCount = leaves.filter(
    (l) => l.status?.toLowerCase() === "pending"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-orange-600">
                {pendingCount}
              </p>
              <div className="p-3 rounded-full bg-orange-100">
                <CalendarOff className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">
                {leaves.filter((l) => l.status?.toLowerCase() === "approved")
                  .length}
              </p>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-red-600">
                {leaves.filter((l) => l.status?.toLowerCase() === "rejected")
                  .length}
              </p>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{leaves.length}</p>
              <div className="p-3 rounded-full bg-blue-100">
                <CalendarOff className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button onClick={fetchLeaves} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={filters.employee}
                onValueChange={(value) =>
                  setFilters({ ...filters, employee: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem
                      key={member.employee_id || member.id}
                      value={String(member.employee_id || member.id)}
                    >
                      {member.employee_name || member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select
                value={filters.leaveType}
                onValueChange={(value) =>
                  setFilters({ ...filters, leaveType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Requests</CardTitle>
            <Badge variant="secondary">
              {filteredLeaves.length} request(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : filteredLeaves.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((leave, index) => {
                    const isPending = leave.status?.toLowerCase() === "pending";
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {getEmployeeName(leave.employee_id || leave.id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {leave.leave_type || leave.type || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateDisplay(
                            leave.start_date || leave.from_date
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateDisplay(leave.end_date || leave.to_date)}
                        </TableCell>
                        <TableCell>
                          {leave.days ||
                            calculateDays(
                              leave.start_date || leave.from_date,
                              leave.end_date || leave.to_date
                            )}
                        </TableCell>
                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {leave.reason || "-"}
                        </TableCell>
                        <TableCell>
                          {isPending ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() =>
                                  handleApproveReject(leave, "approve")
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() =>
                                  handleApproveReject(leave, "reject")
                                }
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {leave.approver_remarks || "-"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarOff className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No leave requests found for the selected criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve"
                ? "Approve Leave Request"
                : "Reject Leave Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedLeave && (
                <>
                  <p className="font-medium mt-2">
                    {getEmployeeName(
                      selectedLeave.employee_id || selectedLeave.id
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateDisplay(
                      selectedLeave.start_date || selectedLeave.from_date
                    )}{" "}
                    -{" "}
                    {formatDateDisplay(
                      selectedLeave.end_date || selectedLeave.to_date
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLeave.leave_type || selectedLeave.type} •{" "}
                    {selectedLeave.days ||
                      calculateDays(
                        selectedLeave.start_date || selectedLeave.from_date,
                        selectedLeave.end_date || selectedLeave.to_date
                      )}{" "}
                    day(s)
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {approvalAction === "approve"
                  ? "Approval Comments (Optional)"
                  : "Rejection Reason (Required)"}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  approvalAction === "approve"
                    ? "Add any comments..."
                    : "Please provide a reason for rejection..."
                }
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={4}
              />
            </div>
            {selectedLeave?.reason && (
              <div className="space-y-2">
                <Label>Employee's Reason</Label>
                <p className="text-sm p-3 bg-muted rounded">
                  {selectedLeave.reason}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialogOpen(false);
                setSelectedLeave(null);
                setApprovalComment("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={
                processing ||
                (approvalAction === "reject" && !approvalComment.trim())
              }
              variant={approvalAction === "approve" ? "default" : "destructive"}
            >
              {processing
                ? "Processing..."
                : approvalAction === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


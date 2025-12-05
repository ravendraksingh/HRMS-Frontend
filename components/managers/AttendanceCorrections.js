"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Clock, CheckCircle2, XCircle, RefreshCw, Filter } from "lucide-react";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { formatTime24Hour } from "@/lib/dateTimeUtil";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";

export default function AttendanceCorrections({ teamMembers, managerId }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [corrections, setCorrections] = useState([]);
  const [filteredCorrections, setFilteredCorrections] = useState([]);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
  const [approvalComment, setApprovalComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedCorrections, setSelectedCorrections] = useState([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState(null); // 'approve' or 'reject'
  const [bulkComment, setBulkComment] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: "pending",
    employee: "all",
  });

  //   console.log("teamMembers", teamMembers);
  //   console.log("managerId", managerId);

  useEffect(() => {
    if (teamMembers && teamMembers.length > 0 && managerId) {
      fetchCorrections();
    }
  }, [teamMembers, managerId, filters.status]);

  useEffect(() => {
    filterCorrections();
  }, [corrections, filters]);

  useEffect(() => {
    // Clear selections when filters change
    setSelectedCorrections([]);
  }, [filters]);

  const fetchCorrections = async () => {
    try {
      setLoading(true);
      let correctionRequests = [];

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== "all") {
        queryParams.append("status", filters.status);
      }

      const queryString = queryParams.toString();
      const endpoint = `/managers/${managerId}/employees/attendance/corrections${
        queryString ? `?${queryString}` : ""
      }`;

      try {
        // Try manager-specific endpoint for regularization requests (if it exists)
        const managerRes = await externalApiClient.get(endpoint);
        const managerData = managerRes.data?.corrections || [];
        if (Array.isArray(managerData) && managerData.length > 0) {
          correctionRequests = managerData.map((item) => ({
            id: item.id,
            attendance_record_id: item.attendance_record_id,
            empid: item.empid,
            correction_date: item.correction_date,
            requested_check_in: item.requested_check_in,
            requested_check_out: item.requested_check_out,
            comment: item.reason || "",
            status: item.status || "pending",
            requested_by: item.empid,
            applied_at: item.applied_at,
          }));
        }
      } catch (managerError) {}
      console.log("correctionRequests", correctionRequests);
      // Sort by applied_at desc, then correction_date desc, then empid asc
      correctionRequests.sort((a, b) => {
        // First sort by applied_at (desc)
        const appliedAtA = new Date(a.applied_at || 0);
        const appliedAtB = new Date(b.applied_at || 0);
        if (appliedAtB.getTime() !== appliedAtA.getTime()) {
          return appliedAtB - appliedAtA;
        }

        // Then by correction_date (desc)
        const correctionDateA = new Date(a.correction_date || 0);
        const correctionDateB = new Date(b.correction_date || 0);
        if (correctionDateB.getTime() !== correctionDateA.getTime()) {
          return correctionDateB - correctionDateA;
        }

        // Finally by empid (asc)
        const empidA = a.empid || "";
        const empidB = b.empid || "";
        return empidA.localeCompare(empidB);
      });

      setCorrections(correctionRequests);
    } catch (error) {
      console.error("Error fetching attendance corrections:", error);
      toast.error("Failed to load attendance correction requests");
      setCorrections([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCorrections = () => {
    let filtered = [...corrections];
    console.log("filteredCorrections before", filtered);

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (c) => c.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.employee !== "all") {
      const employeeId =
        typeof filters.employee === "object"
          ? filters.employee?.empid
          : filters.employee;
      filtered = filtered.filter((c) => c.empid === employeeId);
    }

    // Maintain sort order: applied_at desc, then correction_date desc, then empid asc
    filtered.sort((a, b) => {
      // First sort by applied_at (desc)
      const appliedAtA = new Date(a.applied_at || 0);
      const appliedAtB = new Date(b.applied_at || 0);
      if (appliedAtB.getTime() !== appliedAtA.getTime()) {
        return appliedAtB - appliedAtA;
      }

      // Then by correction_date (desc)
      const correctionDateA = new Date(a.correction_date || 0);
      const correctionDateB = new Date(b.correction_date || 0);
      if (correctionDateB.getTime() !== correctionDateA.getTime()) {
        return correctionDateB - correctionDateA;
      }

      // Finally by empid (asc)
      const empidA = a.empid || "";
      const empidB = b.empid || "";
      return empidA.localeCompare(empidB);
    });

    console.log("filteredCorrections", filtered);

    setFilteredCorrections(filtered);
  };

  const handleApproveReject = (correction, action) => {
    setSelectedCorrection(correction);
    setApprovalAction(action);
    setApprovalComment("");
    setApprovalDialogOpen(true);
  };

  const handleSelectCorrection = (correctionId) => {
    setSelectedCorrections((prev) => {
      if (prev.includes(correctionId)) {
        return prev.filter((id) => id !== correctionId);
      } else {
        return [...prev, correctionId];
      }
    });
  };

  const handleSelectAll = () => {
    const pendingCorrections = filteredCorrections.filter(
      (c) => c.status?.toLowerCase() === "pending"
    );
    if (selectedCorrections.length === pendingCorrections.length) {
      setSelectedCorrections([]);
    } else {
      setSelectedCorrections(pendingCorrections.map((c) => c.id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedCorrections.length === 0) {
      toast.error("Please select at least one correction request");
      return;
    }
    setBulkAction(action);
    setBulkComment("");
    setBulkActionDialogOpen(true);
  };

  const submitBulkApproval = async () => {
    if (selectedCorrections.length === 0) return;

    try {
      setBulkProcessing(true);
      const approvedBy = managerId || user?.empid;

      if (!approvedBy) {
        toast.error("Unable to identify approver. Please try again.");
        return;
      }

      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Process each selected correction
      for (const correctionId of selectedCorrections) {
        try {
          const endpoint =
            bulkAction === "approve"
              ? `/attendance/corrections/${correctionId}/approve`
              : `/attendance/corrections/${correctionId}/reject`;

          const payload = {
            approved_by: approvedBy,
          };

          if (bulkAction === "approve") {
            if (bulkComment && bulkComment.trim()) {
              payload.remarks = bulkComment.trim();
            }
          } else {
            payload.rejection_reason =
              bulkComment.trim() || "No reason provided";
          }

          const response = await externalApiClient.post(endpoint, payload);

          if (response && response.status >= 200 && response.status < 300) {
            successCount++;
          } else {
            throw new Error("API call did not return success status");
          }
        } catch (error) {
          failCount++;
          const errorMsg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            `Failed to ${bulkAction} correction`;
          errors.push(`Correction ${correctionId}: ${errorMsg}`);
        }
      }

      // Close dialog
      setBulkActionDialogOpen(false);
      setSelectedCorrections([]);
      setBulkComment("");

      // Show results
      if (successCount > 0) {
        toast.success(
          `${successCount} correction(s) ${
            bulkAction === "approve" ? "approved" : "rejected"
          } successfully`
        );
      }
      if (failCount > 0) {
        toast.error(
          `Failed to ${bulkAction} ${failCount} correction(s). Check console for details.`
        );
        console.error("Bulk action errors:", errors);
      }

      // Refresh the list
      await fetchCorrections();

      // If filter is set to "pending" and we just processed all, switch to "all"
      if (filters.status === "pending") {
        setFilters({ ...filters, status: "all" });
      }
    } catch (error) {
      console.error("Error in bulk approval/rejection:", error);
      toast.error(`Failed to ${bulkAction} corrections`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const submitApproval = async () => {
    if (!selectedCorrection) return;

    try {
      setProcessing(true);
      // Use the correction ID, not attendance record ID
      const correctionId = selectedCorrection.id;

      if (!correctionId) {
        toast.error("Correction ID not found. Please try again.");
        return;
      }

      // Get the approver ID
      const approvedBy = managerId || user?.empid;

      if (!approvedBy) {
        toast.error("Unable to identify approver. Please try again.");
        return;
      }

      // Approve or reject the correction request
      let response;
      let endpoint;
      let payload;

      try {
        endpoint =
          approvalAction === "approve"
            ? `/attendance/corrections/${correctionId}/approve`
            : `/attendance/corrections/${correctionId}/reject`;

        payload = {
          approved_by: approvedBy,
        };
        // Use different field names based on action
        if (approvalAction === "approve") {
          // For approval, send remarks if provided
          if (approvalComment && approvalComment.trim()) {
            payload.remarks = approvalComment.trim();
          }
        } else {
          // For rejection, use rejection_reason field (required)
          payload = {
            ...payload,
            rejection_reason: approvalComment.trim() || "No reason provided",
          };
        }

        console.log("Submitting approval/rejection:", {
          endpoint,
          payload,
          correctionId,
          approvalAction,
        });
        response = await externalApiClient.post(endpoint, payload);
      } catch (error) {
        throw error;
      }

      // Verify the response indicates success
      if (!response || response.status < 200 || response.status >= 300) {
        throw new Error("API call did not return success status");
      }

      // Verify the response indicates success
      if (response && response.status >= 200 && response.status < 300) {
        // Close dialog on success
        setApprovalDialogOpen(false);
        setSelectedCorrection(null);
        setApprovalComment("");

        toast.success(
          `Attendance correction ${
            approvalAction === "approve" ? "approved" : "rejected"
          } successfully`
        );

        // Refresh the list
        await fetchCorrections();

        // If filter is set to "pending" and we just approved/rejected, switch to "all" to show the updated record
        if (filters.status === "pending") {
          setFilters({ ...filters, status: "all" });
        }
      } else {
        throw new Error("API call did not return success status");
      }
    } catch (error) {
      console.error("Error updating attendance correction:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        `Failed to ${approvalAction} attendance correction`;
      toast.error(errorMsg);

      // Keep dialog open on error so user can retry
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
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        Pending
      </Badge>
    );
  };

  const getEmployeeName = (employeeId) => {
    const member = teamMembers.find((m) => m.empid === employeeId);
    return member?.name;
  };

  const pendingCount = corrections.filter(
    (c) => c.status?.toLowerCase() === "pending"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{corrections.length}</p>
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
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
                {
                  corrections.filter(
                    (c) => c.status?.toLowerCase() === "approved"
                  ).length
                }
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
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-orange-600">
                {pendingCount}
              </p>
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
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
                {
                  corrections.filter(
                    (c) => c.status?.toLowerCase() === "rejected"
                  ).length
                }
              </p>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
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
            <Button onClick={fetchCorrections} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem key={member?.empid} value={member}>
                      {`${member?.name} [${member?.empid}]`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correction Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Correction Requests</CardTitle>
            <div className="flex items-center gap-4">
              {selectedCorrections.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedCorrections.length} selected
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => handleBulkAction("approve")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleBulkAction("reject")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Selected
                  </Button>
                </div>
              )}
              <Badge variant="secondary">
                {filteredCorrections.length} request(s)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : filteredCorrections.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      {filteredCorrections.filter(
                        (c) => c.status?.toLowerCase() === "pending"
                      ).length > 0 && (
                        <Checkbox
                          checked={
                            selectedCorrections.length > 0 &&
                            selectedCorrections.length ===
                              filteredCorrections.filter(
                                (c) => c.status?.toLowerCase() === "pending"
                              ).length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all pending corrections"
                        />
                      )}
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Applied At</TableHead>
                    <TableHead>Correction Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCorrections.map((correction, index) => {
                    const isPending =
                      correction.status?.toLowerCase() === "pending";
                    const isSelected = selectedCorrections.includes(
                      correction.id
                    );
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {isPending && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleSelectCorrection(correction.id)
                              }
                              aria-label={`Select correction for ${getEmployeeName(
                                correction.empid
                              )}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getEmployeeName(correction.empid)}
                        </TableCell>
                        <TableCell>
                          {correction.applied_at
                            ? formatDateDisplay(correction.applied_at)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {formatDateDisplay(correction.correction_date)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatTime24Hour(correction.requested_check_in)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatTime24Hour(correction.requested_check_out)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {correction.comment || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(correction.status)}
                        </TableCell>
                        <TableCell>
                          {isPending ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() =>
                                  handleApproveReject(correction, "approve")
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
                                  handleApproveReject(correction, "reject")
                                }
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {correction.approver_remarks || "-"}
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
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                No attendance correction requests found for the selected
                criteria.
              </p>
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
                ? "Approve Attendance Correction"
                : "Reject Attendance Correction"}
            </DialogTitle>
            <DialogDescription>
              {selectedCorrection && (
                <span className="flex flex-col gap-1">
                  <span className="font-medium mt-2">
                    {getEmployeeName(selectedCorrection.empid)}
                    {` [${selectedCorrection.empid}]`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Date:{" "}
                    {formatDateDisplay(selectedCorrection.correction_date)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Requested:{" "}
                    {formatTime24Hour(selectedCorrection.requested_check_in)} -{" "}
                    {formatTime24Hour(selectedCorrection.requested_check_out)}
                  </span>
                  {selectedCorrection.comment && (
                    <span className="text-sm text-muted-foreground mt-1">
                      Reason: {selectedCorrection.comment}
                    </span>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approvalComment">
                {approvalAction === "approve"
                  ? "Approval Comments (Optional)"
                  : "Rejection Reason (Required)"}
              </Label>
              <Textarea
                id="approvalComment"
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialogOpen(false);
                setSelectedCorrection(null);
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

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onOpenChange={setBulkActionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "approve"
                ? `Approve ${selectedCorrections.length} Attendance Correction(s)`
                : `Reject ${selectedCorrections.length} Attendance Correction(s)`}
            </DialogTitle>
            <DialogDescription>
              You are about to {bulkAction} {selectedCorrections.length}{" "}
              attendance correction request(s). This action will be applied to
              all selected requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkComment">
                {bulkAction === "approve"
                  ? "Approval Comments (Optional)"
                  : "Rejection Reason (Required)"}
              </Label>
              <Textarea
                id="bulkComment"
                placeholder={
                  bulkAction === "approve"
                    ? "Add any comments for all selected corrections..."
                    : "Please provide a reason for rejection (applies to all selected corrections)..."
                }
                value={bulkComment}
                onChange={(e) => setBulkComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkActionDialogOpen(false);
                setBulkComment("");
              }}
              disabled={bulkProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={submitBulkApproval}
              disabled={
                bulkProcessing ||
                (bulkAction === "reject" && !bulkComment.trim())
              }
              variant={bulkAction === "approve" ? "default" : "destructive"}
            >
              {bulkProcessing
                ? "Processing..."
                : bulkAction === "approve"
                ? `Approve ${selectedCorrections.length} Request(s)`
                : `Reject ${selectedCorrections.length} Request(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

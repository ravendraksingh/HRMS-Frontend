"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/components/auth/AuthContext";
import { CalendarOff, Plus, X, Clock } from "lucide-react";
import { formatDateDisplay } from "@/lib/formatDateDisplay";

const LeavePage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLeave, setNewLeave] = useState({
    start_date: "",
    end_date: "",
    leave_type: "casual",
    reason: "",
  });
  const [filters, setFilters] = useState({
    from: "",
    to: "",
  });

  useEffect(() => {
    if (user?.employee_id) {
      fetchLeaves();
    }
  }, [user?.employee_id, filters]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const employeeId = user?.employee_id;
      if (!employeeId) {
        toast.error("Employee ID not found");
        return;
      }
      let url = `/leaves?employee_id=${employeeId}`;
      if (filters.from) url += `&from=${filters.from}`;
      if (filters.to) url += `&to=${filters.to}`;

      const res = await externalApiClient.get(url);
      setLeaves(res.data.leaves);
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
    const employeeId = user?.employee_id;
    if (!employeeId) {
      toast.error("Employee ID not found");
      return;
    }
    try {
      await externalApiClient.post("/leaves", {
        ...newLeave,
        employee_id: employeeId,
      });
      toast.success("Leave request submitted successfully!");
      setAdding(false);
      setNewLeave({
        start_date: "",
        end_date: "",
        leave_type: "casual",
        reason: "",
      });
      await fetchLeaves();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to submit leave request";
      toast.error(errorMsg);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    try {
      await externalApiClient.post(`/leaves/${leaveId}/cancel`);
      toast.success("Leave request cancelled!");
      await fetchLeaves();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to cancel leave request";
      toast.error(errorMsg);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "approved" || statusLower === "approved")
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          Approved
        </Badge>
      );
    if (statusLower === "rejected" || statusLower === "rejected")
      return <Badge variant="destructive">Rejected</Badge>;
    if (statusLower === "cancelled" || statusLower === "cancelled")
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
    <div className="container mx-auto max-w-[1000px] p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Leave Management</h1>
        <p className="text-gray-600">
          Request and manage your leave applications
        </p>
      </div>

      {/* Filters and Add Button */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filters</CardTitle>
            {!adding && (
              <Button onClick={() => setAdding(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Request Leave
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
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
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ from: "", to: "" })}
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Leave Form */}
      {adding && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Request Leave</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setNewLeave({
                    start_date: "",
                    end_date: "",
                    leave_type: "casual",
                    reason: "",
                  });
                }}
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
                >
                  <SelectTrigger id="leave_type">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="paid">Paid Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
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
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAddLeave}
                disabled={!newLeave.start_date || !newLeave.end_date}
                size="sm"
              >
                Submit Request
              </Button>
              <Button
                onClick={() => {
                  setAdding(false);
                  setNewLeave({
                    start_date: "",
                    end_date: "",
                    leave_type: "casual",
                    reason: "",
                  });
                }}
                size="sm"
                variant="outline"
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
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {formatDateDisplay(
                              leave.start_date || leave.from_date
                            )}{" "}
                            -{" "}
                            {formatDateDisplay(leave.end_date || leave.to_date)}
                          </h3>
                          {getStatusBadge(leave.status)}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 mb-2">
                          <span>
                            <span className="font-medium">Type:</span>{" "}
                            {(leave.leave_type || leave.type || "N/A")
                              .charAt(0)
                              .toUpperCase() +
                              (leave.leave_type || leave.type || "N/A").slice(
                                1
                              )}
                          </span>
                          <span>
                            <span className="font-medium">Days:</span>{" "}
                            {leave.days ||
                              calculateDays(
                                leave.start_date || leave.from_date,
                                leave.end_date || leave.to_date
                              )}
                          </span>
                        </div>
                        {leave.reason && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Reason:</span>{" "}
                            {leave.reason}
                          </p>
                        )}
                      </div>
                      {leave.status?.toLowerCase() === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelLeave(leave.id)}
                        >
                          Cancel
                        </Button>
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

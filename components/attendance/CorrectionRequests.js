"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function CorrectionRequests({ employeeId }) {
  const [loading, setLoading] = useState(true);
  const [corrections, setCorrections] = useState([]);

  const fetchCorrections = async () => {
    try {
      setLoading(true);

      // Fetch correction requests using the corrections API endpoint
      // This endpoint automatically returns corrections for the authenticated employee
      const res = await externalApiClient.get(
        `/attendance/corrections?empid=${employeeId}`
      );
      const correctionRequests = res.data.requests;

      console.log("Parsed correction requests:", correctionRequests);

      // Map the response to match the component's expected format
      const mappedCorrections = correctionRequests.map((request) => {
        return {
          id: request.id,
          attendance_id: request.attendance_record_id,
          correction_date: request.correction_date,
          requested_check_in: request.requested_check_in,
          requested_check_out: request.requested_check_out,
          status: request.status,
          reason: request.reason,
          applied_at: request.applied_at,
          approver_remarks: request.remarks || request.rejection_reason || "",
          approved_by: request.approved_by,
          approved_at: request.approved_at,
        };
      });

      // Sort by created date (newest first)
      mappedCorrections.sort((a, b) => {
        const dateA = new Date(a.created_at || a.correction_date || 0);
        const dateB = new Date(b.created_at || b.correction_date || 0);
        return dateB - dateA;
      });
      console.log("mappedCorrections", mappedCorrections);
      setCorrections(mappedCorrections);
    } catch (error) {
      console.error("Error fetching correction requests:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load correction requests";
      toast.error(errorMessage);
      setCorrections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === "APPROVED") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (statusUpper === "REJECTED") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    if (statusUpper === "CANCELLED") {
      return (
        <Badge variant="secondary">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Correction Requests
          </CardTitle>
          <Badge variant="secondary">{corrections.length} request(s)</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : corrections.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Applied At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corrections.map((correction, index) => (
                  <TableRow key={correction.id || index}>
                    <TableCell>
                      {formatDateDisplay(correction.correction_date)}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {formatTime(correction.requested_check_in)}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {formatTime(correction.requested_check_out)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {correction.reason || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(correction.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {correction.approver_remarks || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {correction.applied_at
                        ? formatDateDisplay(correction.applied_at)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No correction requests found.</p>
            <p className="text-sm mt-2">
              Click "Request Correction" to submit a new request.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/common/AuthContext";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import { ArrowLeft, CalendarOff, RefreshCw, List, Grid } from "lucide-react";
import Link from "next/link";
import { getCurrentYear } from "@/lib/dateTimeUtil";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LeaveBalancePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const currentYear = getCurrentYear();
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState("list"); // 'list' or 'grid'

  useEffect(() => {
    if (user?.empid) {
      fetchLeaveBalance();
    }
  }, [user?.empid]);

  const fetchLeaveBalance = async (isRefresh = false) => {
    const employeeId = user?.empid;
    if (!employeeId) {
      toast.error("Employee ID not found");
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const url = `/employees/${employeeId}/leaves/summary/yearly?year=${currentYear}`;
      const res = await externalApiClient.get(url);
      const responseData = res.data || {};

      // Extract summary_by_type from the response
      const balances = responseData.summary_by_type || [];

      setSummaryData(responseData);
      setLeaveBalances(Array.isArray(balances) ? balances : []);
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load leave balance";
      toast.error(errorMessage);
      setLeaveBalances([]);
      setSummaryData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchLeaveBalance(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Spinner size={32} />
          <p className="text-gray-600">Loading leave balance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/ess/leave">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leave Management
            </Link>
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            variant="outline"
            size="sm"
          >
            {refreshing ? (
              <>
                <Spinner size={16} className="mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Leave Balance</h1>
      </div>

      {/* Summary Totals Card */}
      {summaryData?.totals && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Overall Summary - {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Opening Balance</p>
                <p className="text-2xl font-bold">
                  {summaryData.totals.opening_balance || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  +{summaryData.totals.earned || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Used</p>
                <p className="text-2xl font-bold text-red-600">
                  -{summaryData.totals.used || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summaryData.totals.current_balance || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Approved</p>
                <Badge variant="default">
                  {summaryData.totals.approved?.total_days || 0} days
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <Badge variant="secondary">
                  {summaryData.totals.pending?.total_days || 0} days
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rejected</p>
                <Badge variant="destructive">
                  {summaryData.totals.rejected?.total_days || 0} days
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Cancelled</p>
                <Badge variant="outline">
                  {summaryData.totals.cancelled?.total_days || 0} days
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Balance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Leave Balance by Type
            </CardTitle>
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
        </CardHeader>
        <CardContent>
          {leaveBalances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leave balance data available for the selected year
            </div>
          ) : (
            <>
              {/* Card Layout for Mobile and Grid View on Desktop */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${
                  viewType === "list" ? "md:hidden" : ""
                }`}
              >
                {leaveBalances.map((balance, index) => {
                  const leaveTypeName =
                    balance.leave_type_name || `Leave Type ${index + 1}`;
                  const openingBalance = balance.opening_balance || 0;
                  const earnedLeaves = balance.earned || 0;
                  const usedLeaves = balance.used || 0;
                  const currentBalance = balance.current_balance || 0;
                  const carryForwardBalance = balance.carry_forward || 0;
                  const maxLeaves = balance.max_leaves_per_year || 0;
                  const approved = balance.approved?.total_days || 0;
                  const pending = balance.pending?.total_days || 0;
                  const rejected = balance.rejected?.total_days || 0;
                  const cancelled = balance.cancelled?.total_days || 0;

                  return (
                    <Card
                      key={balance.leavetype_id || index}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">
                            {leaveTypeName}
                          </h3>
                          {maxLeaves > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Max: {maxLeaves}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Opening Balance
                            </span>
                            <span className="font-medium">
                              {openingBalance.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Earned Leaves
                            </span>
                            <span className="font-medium text-green-600">
                              +{earnedLeaves.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Used Leaves
                            </span>
                            <span className="font-medium text-red-600">
                              -{usedLeaves.toFixed(1)}
                            </span>
                          </div>
                          <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-700">
                                Current Balance
                              </span>
                              <span className="text-lg font-bold">
                                {currentBalance.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-gray-600">
                              Carry Forward Balance
                            </span>
                            <span className="font-medium">
                              {carryForwardBalance.toFixed(1)}
                            </span>
                          </div>
                          {(approved > 0 ||
                            pending > 0 ||
                            rejected > 0 ||
                            cancelled > 0) && (
                            <div className="border-t pt-3 mt-3 space-y-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase">
                                Status Breakdown
                              </p>
                              {approved > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">
                                    Approved
                                  </span>
                                  <Badge variant="default" className="text-xs">
                                    {approved} days
                                  </Badge>
                                </div>
                              )}
                              {pending > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">
                                    Pending
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {pending} days
                                  </Badge>
                                </div>
                              )}
                              {rejected > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">
                                    Rejected
                                  </span>
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {rejected} days
                                  </Badge>
                                </div>
                              )}
                              {cancelled > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">
                                    Cancelled
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {cancelled} days
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Table Layout for Desktop - List View */}
              {viewType === "list" && (
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead className="text-right">Max/Year</TableHead>
                        <TableHead className="text-right">
                          Opening Balance
                        </TableHead>
                        <TableHead className="text-right">Earned</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">
                          Current Balance
                        </TableHead>
                        <TableHead className="text-right">
                          Carry Forward
                        </TableHead>
                        <TableHead className="text-right">Approved</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveBalances.map((balance, index) => {
                        const leaveTypeName =
                          balance.leave_type_name || `Leave Type ${index + 1}`;
                        const openingBalance = balance.opening_balance || 0;
                        const earnedLeaves = balance.earned || 0;
                        const usedLeaves = balance.used || 0;
                        const currentBalance = balance.current_balance || 0;
                        const carryForwardBalance = balance.carry_forward || 0;
                        const maxLeaves = balance.max_leaves_per_year || 0;
                        const approved = balance.approved?.total_days || 0;
                        const pending = balance.pending?.total_days || 0;

                        return (
                          <TableRow key={balance.leavetype_id || index}>
                            <TableCell className="font-medium">
                              {leaveTypeName}
                            </TableCell>
                            <TableCell className="text-right text-gray-500">
                              {maxLeaves > 0 ? maxLeaves : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {openingBalance.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              +{earnedLeaves.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              -{usedLeaves.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {currentBalance.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right">
                              {carryForwardBalance.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right">
                              {approved > 0 ? (
                                <Badge variant="default" className="text-xs">
                                  {approved}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {pending > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  {pending}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Totals Row */}
                      {leaveBalances.length > 0 &&
                        (() => {
                          const totals = leaveBalances.reduce(
                            (acc, balance) => {
                              acc.openingBalance +=
                                balance.opening_balance || 0;
                              acc.earned += balance.earned || 0;
                              acc.used += balance.used || 0;
                              acc.currentBalance +=
                                balance.current_balance || 0;
                              acc.carryForward += balance.carry_forward || 0;
                              acc.approved += balance.approved?.total_days || 0;
                              acc.pending += balance.pending?.total_days || 0;
                              return acc;
                            },
                            {
                              openingBalance: 0,
                              earned: 0,
                              used: 0,
                              currentBalance: 0,
                              carryForward: 0,
                              approved: 0,
                              pending: 0,
                            }
                          );

                          return (
                            <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                              <TableCell className="font-bold">Total</TableCell>
                              <TableCell className="text-right text-gray-500">
                                -
                              </TableCell>
                              <TableCell className="text-right">
                                {totals.openingBalance.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right text-green-600">
                                +{totals.earned.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                -{totals.used.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-blue-600">
                                {totals.currentBalance.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right">
                                {totals.carryForward.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="default" className="text-xs">
                                  {totals.approved}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary" className="text-xs">
                                  {totals.pending}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveBalancePage;

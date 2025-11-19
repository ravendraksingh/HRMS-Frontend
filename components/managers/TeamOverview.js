"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import {
  UsersRound,
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function TeamOverview({ teamMembers, managerId }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    pendingLeaveRequests: 0,
    attendanceRate: 0,
    recentActivity: [],
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);

  useEffect(() => {
    if (teamMembers && teamMembers.length > 0 && managerId) {
      fetchOverviewData();
    }
  }, [teamMembers, managerId]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // Use manager dashboard endpoint which provides comprehensive overview
      try {
        const dashboardRes = await externalApiClient.get(
          `/managers/${managerId}/dashboard?date=${today}`
        );
        const dashboardData = dashboardRes.data || {};

        // Extract data from dashboard response
        setStats((prev) => ({
          ...prev,
          totalMembers: dashboardData.team_count || teamMembers.length,
          presentToday: dashboardData.present_today || dashboardData.present_count || 0,
          absentToday: dashboardData.absent_today || dashboardData.absent_count || 0,
          onLeaveToday: dashboardData.on_leave_today || dashboardData.on_leave_count || 0,
          pendingLeaveRequests: dashboardData.pending_leaves || dashboardData.pending_leave_count || 0,
          attendanceRate: dashboardData.attendance_rate || dashboardData.attendance_rate_30_days || 0,
        }));

        // Fetch pending leaves for activity feed
        let pendingLeavesData = [];
        try {
          const leavesRes = await externalApiClient.get(
            `/managers/${managerId}/leaves/pending`
          );
          pendingLeavesData = leavesRes.data?.leaves || leavesRes.data || [];
          pendingLeavesData = Array.isArray(pendingLeavesData) ? pendingLeavesData : [];
          setPendingLeaves(pendingLeavesData.slice(0, 5));
        } catch (error) {
          console.error("Error fetching pending leaves:", error);
        }

        // Build recent activity feed from dashboard data
        const activities = [];
        
        // Add upcoming birthdays/anniversaries if available
        if (dashboardData.upcoming_birthdays) {
          dashboardData.upcoming_birthdays.slice(0, 2).forEach((item) => {
            activities.push({
              type: "birthday",
              message: `${item.name || item.employee_name} has a birthday coming up`,
              time: item.birthday || item.date,
              icon: UsersRound,
              color: "text-blue-600",
            });
          });
        }

        // Add recent pending leaves
        if (pendingLeavesData.length > 0) {
          pendingLeavesData.slice(0, 3).forEach((leave) => {
            const member = teamMembers.find(
              (m) => (m.employee_id || m.id) === (leave.employee_id || leave.id)
            );
            if (member) {
              activities.push({
                type: "leave",
                message: `${member.employee_name || member.name} requested leave`,
                time: leave.created_at || leave.start_date,
                icon: CalendarOff,
                color: "text-orange-600",
              });
            }
          });
        }

        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        setStats((prev) => ({
          ...prev,
          recentActivity: activities.slice(0, 5),
        }));
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        // Fallback to manual calculation if dashboard endpoint fails
        setStats((prev) => ({
          ...prev,
          totalMembers: teamMembers.length,
        }));
        toast.error("Failed to load team overview");
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
      toast.error("Failed to load team overview");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Direct reports
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <UsersRound className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.presentToday}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.onLeaveToday > 0 && `${stats.onLeaveToday} on leave`}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absent Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.absentToday}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Not checked in
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pendingLeaveRequests}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting approval
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Last 30 days
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Label className="text-sm">Present</Label>
                </div>
                <span className="font-semibold">{stats.presentToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarOff className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm">On Leave</Label>
                </div>
                <span className="font-semibold">{stats.onLeaveToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <Label className="text-sm">Absent</Label>
                </div>
                <span className="font-semibold">{stats.absentToday}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Pending Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2 border rounded"
                    >
                      <Icon className={`h-5 w-5 ${activity.color} mt-0.5`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length > 0 ? (
              <div className="space-y-3">
                {pendingLeaves.map((leave, index) => {
                  const member = teamMembers.find(
                    (m) =>
                      (m.employee_id || m.id) === (leave.employee_id || leave.id)
                  );
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {member?.employee_name || member?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateDisplay(leave.start_date || leave.from_date)}{" "}
                          - {formatDateDisplay(leave.end_date || leave.to_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leave.leave_type || leave.type} • {leave.days || 1} day(s)
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending leave requests
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


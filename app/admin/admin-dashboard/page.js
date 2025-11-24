"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Building,
  MapPin,
  ShieldUser,
  Settings,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  ArrowRight,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalDepartments: 0,
    totalLocations: 0,
    totalRoles: 0,
    activeUsers: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaveRequests: 0,
    upcomingHolidays: [],
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const today = new Date().toISOString().split("T")[0];
      const currentYear = new Date().getFullYear();

      // Fetch total employees/users
      try {
        const employeesRes = await externalApiClient.get("/employees");
        const employeesData =
          employeesRes.data?.employees || employeesRes.data || [];
        const employeesArray = Array.isArray(employeesData)
          ? employeesData
          : [];
        const activeEmployees = employeesArray.filter(
          (e) => e.is_active === "Y" || e.is_active === true || e.status === "active"
        ).length;

        setStats((prev) => ({
          ...prev,
          totalEmployees: employeesArray.length,
          totalUsers: employeesArray.length,
          activeUsers: activeEmployees,
        }));
      } catch (e) {
        console.error("Error fetching employees:", e);
      }

      // Fetch departments count
      try {
        const deptRes = await externalApiClient.get("/departments");
        const deptData = deptRes.data?.departments || deptRes.data || [];
        setStats((prev) => ({
          ...prev,
          totalDepartments: Array.isArray(deptData) ? deptData.length : 0,
        }));
      } catch (e) {
        console.error("Error fetching departments:", e);
      }

      // Fetch locations count
      try {
        const locationsRes = await externalApiClient.get("/locations");
        const locationsData =
          locationsRes.data?.locations || locationsRes.data || [];
        setStats((prev) => ({
          ...prev,
          totalLocations: Array.isArray(locationsData)
            ? locationsData.length
            : 0,
        }));
      } catch (e) {
        console.error("Error fetching locations:", e);
      }

      // Fetch roles count
      try {
        const rolesRes = await externalApiClient.get("/roles");
        const rolesData = rolesRes.data?.roles || rolesRes.data || [];
        setStats((prev) => ({
          ...prev,
          totalRoles: Array.isArray(rolesData) ? rolesData.length : 0,
        }));
      } catch (e) {
        console.error("Error fetching roles:", e);
      }

      // Fetch today's attendance summary
      try {
        const attendanceRes = await externalApiClient.get(
          `/attendance?attendance_date=${today}`
        );
        const attendanceData =
          attendanceRes.data?.attendance || attendanceRes.data || [];
        const attendanceArray = Array.isArray(attendanceData)
          ? attendanceData
          : [];

        const presentCount = attendanceArray.filter(
          (a) => a.status === "PRESENT" || a.check_in_time
        ).length;
        const absentCount = attendanceArray.filter(
          (a) => a.status === "ABSENT"
        ).length;

        setStats((prev) => ({
          ...prev,
          presentToday: presentCount,
          absentToday: absentCount,
        }));
      } catch (e) {
        console.error("Error fetching attendance:", e);
      }

      // Fetch pending leave requests
      try {
        const leavesRes = await externalApiClient.get("/leaves");
        const leavesData = leavesRes.data?.leaves || leavesRes.data || [];
        const pendingLeaves = Array.isArray(leavesData)
          ? leavesData.filter(
              (l) => (l.status || "").toLowerCase() === "pending"
            )
          : [];
        setStats((prev) => ({
          ...prev,
          pendingLeaveRequests: pendingLeaves.length,
        }));
      } catch (e) {
        console.error("Error fetching leaves:", e);
      }

      // Fetch upcoming holidays
      try {
        const holidaysRes = await externalApiClient.get(
          `/holidays?year=${currentYear}`
        );
        const holidaysData = holidaysRes.data?.holidays || [];
        const upcoming = Array.isArray(holidaysData)
          ? holidaysData
              .filter((h) => {
                const holidayDate = new Date(h.holiday_date || h.date);
                return holidayDate >= new Date();
              })
              .sort((a, b) => {
                const dateA = new Date(a.holiday_date || a.date);
                const dateB = new Date(b.holiday_date || b.date);
                return dateA - dateB;
              })
              .slice(0, 5)
          : [];
        setStats((prev) => ({
          ...prev,
          upcomingHolidays: upcoming,
        }));
      } catch (e) {
        console.error("Error fetching holidays:", e);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load dashboard data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Spinner size={32} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.employee_name || user?.name || "Admin"}!
          </p>
        </div>
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

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeUsers} active
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 ml-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.totalDepartments}</p>
                <p className="text-xs text-gray-500 mt-1">Active departments</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 ml-4">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.totalLocations}</p>
                <p className="text-xs text-gray-500 mt-1">Office locations</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.totalRoles}</p>
                <p className="text-xs text-gray-500 mt-1">System roles</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 ml-4">
                <ShieldUser className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-green-600">
                  {stats.presentToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">Employees present</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Absent Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-red-600">
                  {stats.absentToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">Employees absent</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 ml-4">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pendingLeaveRequests}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 ml-4">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-gray-500 mt-1">All systems operational</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/admin/departments">
                <Building className="mr-2 h-4 w-4" />
                Manage Departments
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/admin/locations">
                <MapPin className="mr-2 h-4 w-4" />
                Manage Locations
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/admin/roles">
                <ShieldUser className="mr-2 h-4 w-4" />
                Manage Roles
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Link href="/admin/setting">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Total Employees</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalEmployees} registered
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{stats.totalEmployees}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Building className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Departments</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalDepartments} active
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{stats.totalDepartments}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Locations</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalLocations} offices
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{stats.totalLocations}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <ShieldUser className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Roles</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalRoles} defined
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{stats.totalRoles}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Holidays</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/manage-holidays">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.upcomingHolidays.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingHolidays.map((holiday, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {holiday.name || holiday.holiday_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateDisplay(
                          holiday.holiday_date || holiday.date
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={holiday.is_optional ? "secondary" : "default"}
                    >
                      {holiday.type || "Company"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No upcoming holidays
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


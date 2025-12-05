"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Building,
  Building2,
  MapPin,
  ShieldUser,
  Settings,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { getErrorMessage } from "@/lib/emsUtil";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAuth } from "@/components/common/AuthContext";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      users: {
        total: 0,
        active: 0,
        logged_in_24h: 0,
      },
      departments: {
        total: 0,
      },
      locations: {
        total: 0,
      },
    },
    system_health: {
      status: "unknown",
      database: {
        connected: false,
      },
      server: {
        uptime: "",
        environment: "",
      },
    },
    hourly_logged_in_users: [],
    generated_at: null,
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

      const res = await externalApiClient.get("/admin/dashboard");
      const data = res.data || {};

      setDashboardData({
        summary: data.summary || {
          users: { total: 0, active: 0, logged_in_24h: 0 },
          departments: { total: 0 },
          locations: { total: 0 },
        },
        system_health: data.system_health || {
          status: "unknown",
          database: { connected: false },
          server: { uptime: "", environment: "" },
        },
        hourly_logged_in_users: data.hourly_logged_in_users || [],
        generated_at: data.generated_at || null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load dashboard data"
      );
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
                <p className="text-2xl font-bold">
                  {dashboardData.summary.users.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardData.summary.users.active} active
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
              Logged In (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold">
                  {dashboardData.summary.users.logged_in_24h}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
              </div>
              <div className="p-3 rounded-full bg-cyan-100 ml-4">
                <Users className="h-6 w-6 text-cyan-600" />
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
                <p className="text-2xl font-bold">
                  {dashboardData.summary.departments.total}
                </p>
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
                <p className="text-2xl font-bold">
                  {dashboardData.summary.locations.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">Office locations</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 ml-4">
                <MapPin className="h-6 w-6 text-green-600" />
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
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p
                  className={`text-2xl font-bold ${
                    dashboardData.system_health.status === "ok"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {dashboardData.system_health.status === "ok"
                    ? "Active"
                    : dashboardData.system_health.status}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardData.system_health.database?.connected
                    ? "Database connected"
                    : "Database disconnected"}
                </p>
              </div>
              <div
                className={`p-3 rounded-full ml-4 ${
                  dashboardData.system_health.status === "ok"
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                <CheckCircle2
                  className={`h-6 w-6 ${
                    dashboardData.system_health.status === "ok"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                />
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
            <Button
              asChild
              className="w-full justify-start whitespace-normal text-left"
              size="lg"
            >
              <Link href="/admin/users" className="flex items-center w-full">
                <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="break-words">Manage Users</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start whitespace-normal text-left"
              size="lg"
            >
              <Link
                href="/admin/organization"
                className="flex items-center w-full"
              >
                <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="break-words">Manage Organization</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start whitespace-normal text-left"
              size="lg"
            >
              <Link
                href="/admin/departments"
                className="flex items-center w-full"
              >
                <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="break-words">Manage Departments</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start whitespace-normal text-left"
              size="lg"
            >
              <Link
                href="/admin/locations"
                className="flex items-center w-full"
              >
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="break-words">Manage Locations</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start whitespace-normal text-left"
              size="lg"
            >
              <Link href="/admin/roles" className="flex items-center w-full">
                <ShieldUser className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="break-words">Manage Roles</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start whitespace-normal text-left"
              size="lg"
            >
              <Link href="/admin/setting" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="break-words">System Settings</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.system_health.server?.uptime && (
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Server Uptime</p>
                      <p className="text-sm text-gray-500">
                        {dashboardData.system_health.server.uptime}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {dashboardData.system_health.server?.environment && (
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-100">
                      <Settings className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Environment</p>
                      <p className="text-sm text-gray-500">
                        {dashboardData.system_health.server.environment}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

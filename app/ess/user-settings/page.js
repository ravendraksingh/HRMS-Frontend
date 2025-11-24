"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldUser,
  User,
  Mail,
  Building,
  Key,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";

const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  const { user } = useAuth();
  console.log("user in ProfilePage", user);

  useEffect(() => {
    async function fetchUserProfileDetails() {
      // Fetch user profile from API

      try {
        setLoading(true);
        setError("");

        // Fetch from API using the generic profile endpoint
        let profileEndpoint = `/users/${user?.empid}/profile`;

        // Try to get employee ID from token or session if available
        // For now, use generic endpoint
        console.log("Fetching profile from:", profileEndpoint);
        const res = await externalApiClient.get(profileEndpoint);
        const data = res.data?.user || res.data;

        if (data) {
          console.log("Profile data fetched:", data);
          setUserProfile(data);
        } else {
          setError("No profile data available");
        }
      } catch (err) {
        console.error("Could not fetch user profile", err);
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Could not fetch user profile"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfileDetails();
  }, []);

  const getAllPermissions = () => {
    const profileData = userProfile;
    if (!profileData?.roles || !Array.isArray(profileData.roles)) {
      return [];
    }
    const permissionsSet = new Set();
    profileData.roles.forEach((role) => {
      if (role?.permissions && typeof role.permissions === "object") {
        Object.keys(role.permissions).forEach((key) => {
          if (role.permissions[key]) {
            permissionsSet.add(key);
          }
        });
      }
    });
    return Array.from(permissionsSet);
  };

  const formatPermissionName = (permission) => {
    return permission
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="px-5">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="px-5">
        <div className="text-center py-8">
          <p className="text-gray-600">No profile data available</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const displayUser = userProfile;

  if (!displayUser) {
    return (
      <div className="px-5">
        <div className="text-center py-8">
          <p className="text-gray-600">No user data available</p>
        </div>
      </div>
    );
  }

  const allPermissions = getAllPermissions();
  const profileData = userProfile;

  return (
    <div className="container mx-auto max-w-[1000px] p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">
          View your account details and permissions
        </p>
      </div>
      {/* User Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-semibold">
                  {profileData?.username || "N/A"}
                </p>
              </div>
            </div>
            {(profileData?.employee_name || user?.employee_name) && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Employee Name</p>
                  <p className="font-semibold">
                    {profileData?.employee_name || user?.employee_name}
                  </p>
                </div>
              </div>
            )}
            {(profileData?.employee_email || user?.employee_email) && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Employee Email</p>
                  <p className="font-semibold">
                    {profileData?.employee_email || user?.employee_email}
                  </p>
                </div>
              </div>
            )}
            {(profileData?.empid ||
              user?.empid ||
              profileData?.employee_code ||
              user?.employee_code) && (
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-semibold">
                    {profileData?.empid ||
                      user?.empid ||
                      profileData?.employee_code ||
                      user?.employee_code ||
                      "N/A"}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center gap-2">
                  {profileData?.is_active === "Y" ||
                  profileData?.is_active === "y" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        Active
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-600">
                        Inactive
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {(profileData?.organization_code || user?.organization_code) && (
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Organization Code</p>
                  <p className="font-semibold">
                    {profileData?.organization_code || user?.organization_code}
                  </p>
                </div>
              </div>
            )}
            {(profileData?.organization_name || user?.organization_name) && (
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Organization Name</p>
                  <p className="font-semibold">
                    {profileData?.organization_name || user?.organization_name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roles Card */}
      <Card className="mb-[50px]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <ShieldUser className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                {profileData?.roles && profileData.roles.length > 0
                  ? `You have ${profileData.roles.length} role(s) assigned`
                  : "No roles assigned"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!profileData?.roles || profileData.roles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No roles assigned to your account
            </p>
          ) : (
            <div className="space-y-4">
              {(profileData?.roles || []).map((role) => (
                <div
                  key={role?.roleid || role?.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {role.role_name || role.name}
                      </h3>
                      {role.roleid && (
                        <p className="text-sm text-gray-500">
                          ID: {role.roleid}
                        </p>
                      )}
                      {role.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {role.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="default"
                      className="bg-green-600 text-white"
                    >
                      Active
                    </Badge>
                  </div>
                  {role.permissions &&
                    Object.keys(role.permissions).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Permissions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(role.permissions)
                            .filter(([_, value]) => value)
                            .map(([key]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {formatPermissionName(key)}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Permissions Summary Card */}
      {allPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Key className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>All Permissions</CardTitle>
                <CardDescription>
                  Combined permissions from all your roles
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allPermissions.map((permission) => (
                <Badge key={permission} variant="default" className="text-sm">
                  {formatPermissionName(permission)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;

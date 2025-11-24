"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import PersonalTab from "@/app/ess/personal-details/components/PersonalTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const ManageEmployeePage = () => {
  const params = useParams();
  const empid = params?.empid;
  const { user } = useAuth();
  const [personalDetails, setPersonalDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (empid && user) {
      checkAccessAndFetch();
    }
  }, [empid, user]);

  const checkAccessAndFetch = async () => {
    // Check if user has HR Manager or Admin role
    const userRoles = user?.roles || [];
    const isHrManager = userRoles.some(
      (role) =>
        (typeof role === "string" && role.toLowerCase() === "hrmanager") ||
        (typeof role === "object" &&
          (role.roleid?.toLowerCase() === "hrmanager" ||
            role.code?.toLowerCase() === "hrmanager"))
    );
    const isAdmin = userRoles.some(
      (role) =>
        (typeof role === "string" && role.toLowerCase() === "admin") ||
        (typeof role === "object" &&
          (role.roleid?.toLowerCase() === "admin" ||
            role.code?.toLowerCase() === "admin"))
    );

    if (!isHrManager && !isAdmin) {
      toast.error("Access denied. HR Manager or Admin role required.");
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(true);
    fetchPersonalDetails();
  };

  const fetchPersonalDetails = async () => {
    try {
      setLoading(true);
      if (!empid) {
        toast.error("Employee ID not found");
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(`/employees/${empid}/personal`);
      const personalData = res.data || {};
      setPersonalDetails(personalData);
    } catch (error) {
      console.error("Error fetching personal details:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";
      toast.error(`Failed to load personal details: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Create a modified user context for PersonalTab
  const hrUserContext = {
    ...user,
    empid: empid, // Override empid to the employee being managed
  };

  return (
    <div className="space-y-6">
      {/* Personal Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalTab
            personalDetails={personalDetails}
            onUpdate={fetchPersonalDetails}
            employeeId={empid}
            isHRView={true}
            hrUserContext={hrUserContext}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageEmployeePage;

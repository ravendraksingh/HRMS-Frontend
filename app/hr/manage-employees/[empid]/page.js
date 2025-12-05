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
    // Layout handles authentication, so we can assume user is authenticated and has access
    if (empid && user) {
      setHasAccess(true);
      fetchPersonalDetails();
    }
  }, [empid, user]);

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

  if (loading || !hasAccess) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size={32} />
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

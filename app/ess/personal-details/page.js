"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";
import PersonalTab from "./components/PersonalTab";

const PersonalDetailsPage = () => {
  const { user } = useAuth();
  const [personalDetails, setPersonalDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPersonalDetails();
    }
  }, [user]);

  const fetchPersonalDetails = async () => {
    try {
      const employeeId = user?.empid;

      if (!employeeId) {
        toast.error("Employee ID not found. Please contact support.");
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(
        `/employees/${employeeId}/personal`
      );
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <PersonalTab
      personalDetails={personalDetails}
      onUpdate={fetchPersonalDetails}
    />
  );
};

export default PersonalDetailsPage;

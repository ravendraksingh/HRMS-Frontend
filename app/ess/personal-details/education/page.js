"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";
import EducationTab from "../components/EducationTab";

const EducationPage = () => {
  const { user } = useAuth();
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEducation();
    }
  }, [user]);

  const fetchEducation = async () => {
    try {
      const employeeId = user?.empid;
      if (!employeeId) {
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(
        `/employees/${employeeId}/education`
      );
      setEducation(res.data.education || res.data || []);
    } catch (error) {
      console.error("Failed to load education", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load education";
      toast.error(errorMessage);
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
    <EducationTab
      employeeId={user?.empid}
      education={education}
      onUpdate={fetchEducation}
    />
  );
};

export default EducationPage;


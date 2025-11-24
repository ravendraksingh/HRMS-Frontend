"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import EducationTab from "@/app/ess/personal-details/components/EducationTab";

const ManageEmployeeEducationPage = () => {
  const params = useParams();
  const empid = params?.empid;
  const { user } = useAuth();
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (empid && user) {
      checkAccessAndFetch();
    }
  }, [empid, user]);

  const checkAccessAndFetch = async () => {
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
    fetchEducation();
  };

  const fetchEducation = async () => {
    try {
      setLoading(true);
      if (!empid) {
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(
        `/employees/${empid}/education`
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

  return (
    <EducationTab
      employeeId={empid}
      education={education}
      onUpdate={fetchEducation}
    />
  );
};

export default ManageEmployeeEducationPage;


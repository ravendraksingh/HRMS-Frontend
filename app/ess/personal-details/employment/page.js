"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";
import EmploymentHistoryTab from "../components/EmploymentHistoryTab";

const EmploymentPage = () => {
  const { user } = useAuth();
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEmploymentHistory();
    }
  }, [user]);

  const fetchEmploymentHistory = async () => {
    try {
      const employeeId = user?.empid;
      if (!employeeId) {
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(
        `/employees/${employeeId}/employment-history`
      );
      setEmploymentHistory(res.data.history || res.data || []);
    } catch (error) {
      console.error("Failed to load employment history", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load employment history";
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
    <EmploymentHistoryTab
      employeeId={user?.empid}
      history={employmentHistory}
      onUpdate={fetchEmploymentHistory}
    />
  );
};

export default EmploymentPage;


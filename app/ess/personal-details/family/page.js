"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/common/AuthContext";
import FamilyTab from "../components/FamilyTab";

const FamilyPage = () => {
  const { user } = useAuth();
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFamily();
    }
  }, [user]);

  const fetchFamily = async () => {
    try {
      const employeeId = user?.empid;
      if (!employeeId) {
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(
        `/employees/${employeeId}/family`
      );
      setFamily(res.data.family || res.data || []);
    } catch (error) {
      console.error("Failed to load family", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load family";
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
    <FamilyTab
      employeeId={user?.empid}
      family={family}
      onUpdate={fetchFamily}
    />
  );
};

export default FamilyPage;

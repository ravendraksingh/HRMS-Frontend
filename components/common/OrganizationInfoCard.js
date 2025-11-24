"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
import { useAuth } from "./AuthContext";

const OrganizationInfoCard = ({ maxWidth = "1000px", className = "" }) => {
  const { user } = useAuth();

  if (!user || (!user.organization_code && !user.organization_name)) {
    return null;
  }

  return (
    <Card className={`${className} mx-auto mb-6`} style={{ maxWidth }}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle>Organization Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.organization_code && (
            <div>
              <p className="text-sm text-gray-500">Organization Code</p>
              <p className="font-semibold text-lg">{user.organization_code}</p>
            </div>
          )}
          {user.organization_name && (
            <div>
              <p className="text-sm text-gray-500">Organization Name</p>
              <p className="font-semibold text-lg">{user.organization_name}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationInfoCard;

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function LoginSuccess() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get tokens from URL parameters
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    // Store tokens in sessionStorage
    if (accessToken) {
      sessionStorage.setItem("accessToken", accessToken);
    }
    if (refreshToken) {
      sessionStorage.setItem("refreshToken", refreshToken);
    }

    // Redirect to dashboard
    window.location.href = "/ess/employee-dashboard";
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-gray-600">Logging you in...</p>
      </div>
    </div>
  );
}


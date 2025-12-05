"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientTokenStorage } from "@/lib/tokenStorage";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

/**
 * Client-side authentication guard
 * Checks for token in sessionStorage
 */
export default function ClientAuthGuard({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists in sessionStorage
        const token = await clientTokenStorage.getAccessToken();
        
        if (!token) {
          // No token found, redirect to login
          router.push("/login");
          return;
        }

        // Token exists, allow access
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}


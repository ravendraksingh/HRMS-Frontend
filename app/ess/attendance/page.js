"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AttendancePage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to today's attendance page by default
    router.replace("/ess/attendance/today");
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
};

export default AttendancePage;

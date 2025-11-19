"use client";

import { useAuth } from "@/components/auth/AuthContext";
import UserDashboard from "@/components/dashboard/UserDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  return <UserDashboard user={user} />;
}

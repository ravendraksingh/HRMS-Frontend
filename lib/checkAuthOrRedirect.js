import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export default function checkAuthOrRedirect() {
  const cookieStore = cookies();
  const authTokenCookie = cookieStore.get("authToken");
  const token = authTokenCookie ? authTokenCookie.value : null;

  if (!token) {
    // Redirect unauthenticated users to login
    redirect("/login");
  }

  try {
    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Redirect if token is invalid or expired
    redirect("/login");
  }
}

import apiClient from "@/app/services/internalApiClient";
import { clientTokenStorage } from "@/lib/tokenStorage";

export async function logout() {
  // Clear tokens based on storage type
  if (typeof window !== "undefined") {
    const storageType = clientTokenStorage.getStorageType();
    console.log(`Logging out - clearing tokens from ${storageType}`);
    await clientTokenStorage.clearTokens();
    
    // Clear sessionStorage if not using it for tokens
    if (storageType !== "sessionstorage") {
      sessionStorage.clear();
    }
  }

  try {
    const res = await apiClient.post("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    console.log("Logout API response:", res.status, res.data);

    // Redirect to login regardless of response status
    // (tokens already cleared above)
    if (typeof window !== "undefined") {
    //   window.location.href = "/login";
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Tokens already cleared above, just redirect
    if (typeof window !== "undefined") {
    //   window.location.href = "/login";
    }
  }
}

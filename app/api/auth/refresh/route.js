// app/api/auth/refresh/route.js
import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/getBackendUrl";
import { serverTokenStorage } from "@/lib/tokenStorage";

export async function POST(req) {
  try {
    // Get refresh token from request body (sessionStorage mode)
    let refreshToken;
    try {
      const body = await req.json();
      refreshToken = body.refresh_token || body.refreshToken;
    } catch (error) {
      console.warn("Could not read request body for refresh token:", error);
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 401 }
      );
    }

    const backendBaseUrl = getBackendUrl();

    // Call backend refresh endpoint
    const refreshRes = await fetch(`${backendBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshRes.ok) {
      const errorText = await refreshRes.text();
      console.log("Backend refresh failed:", errorText);
      return NextResponse.json(
        { error: "Refresh token invalid" },
        { status: 401 }
      );
    }

    const data = await refreshRes.json();
    const accessToken = data.accessToken || data.access_token || data.token;
    const newRefreshToken = data.refreshToken || data.refresh_token;

    // Return tokens in response body for client to store in sessionStorage
    const responseData = { success: true };

    if (accessToken) {
      responseData.accessToken = accessToken;
    }
    if (newRefreshToken) {
      responseData.refreshToken = newRefreshToken;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error refreshing token: ", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}

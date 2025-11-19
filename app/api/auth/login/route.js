import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/getBackendUrl";
import { serverTokenStorage } from "@/lib/tokenStorage";
import axios from "axios";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const backendBaseUrl = getBackendUrl();
    const loginRes = await axios.post(`${backendBaseUrl}/auth/login`, {
      username: username.trim(),
      password: password.trim(),
    });
    const data = loginRes.data;

    const accessToken = data.access_token || data.accessToken || data.token;
    const refreshToken = data.refresh_token || data.refreshToken;

    // Determine storage type from environment variable
    const storageType = (
      process.env.NEXT_PUBLIC_TOKEN_STORAGE_TYPE || "localStorage"
    ).toLowerCase();

    // Prepare response with user data
    const response = NextResponse.json(
      {
        user: data.user,
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

    // If using cookie storage, set httpOnly cookies
    if (storageType === "cookie") {
      if (accessToken) {
        await serverTokenStorage.setAccessToken(accessToken, response);
      }
      if (refreshToken) {
        await serverTokenStorage.setRefreshToken(refreshToken, response);
      }
    } else {
      // For localStorage/sessionStorage, include tokens in response body
      const responseData = { user: data.user };
      if (accessToken) {
        responseData.accessToken = accessToken;
      }
      if (refreshToken) {
        responseData.refreshToken = refreshToken;
      }
      return NextResponse.json(responseData, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return response;
  } catch (error) {
    console.error("Error occurred: ", error);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

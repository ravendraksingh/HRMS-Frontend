import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/getBackendUrl";
import axios from "axios";

export async function POST(req) {
  try {
    // Handle FormData from native form submission
    const formData = await req.formData();
    const username = formData.get("username");
    const password = formData.get("password");

    if (!username || !password) {
      return NextResponse.redirect(
        new URL("/login?error=" + encodeURIComponent("Username and password are required"), req.url)
      );
    }

    const backendBaseUrl = getBackendUrl();

    const loginRes = await axios.post(`${backendBaseUrl}/auth/login`, {
      username: username.trim(),
      password: password.trim(),
    });
    const data = loginRes.data;

    const accessToken = data.access_token || data.accessToken || data.token;
    const refreshToken = data.refresh_token || data.refreshToken;

    // Redirect to success page with tokens in URL (will be stored in sessionStorage)
    const redirectUrl = new URL("/login/success", req.url);
    if (accessToken) {
      redirectUrl.searchParams.set("accessToken", accessToken);
    }
    if (refreshToken) {
      redirectUrl.searchParams.set("refreshToken", refreshToken);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Invalid credentials"), req.url)
    );
  }
}

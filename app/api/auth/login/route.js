import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/getBackendUrl";
import { serverTokenStorage } from "@/lib/tokenStorage";
import axios from "axios";
import logger from "@/lib/logger";

export async function POST(req) {
  const requestLogger = logger.child({
    type: 'api_route',
    method: 'POST',
    path: '/api/auth/login',
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
  });

  try {
    const { username, password } = await req.json();
    const backendBaseUrl = getBackendUrl();
    
    requestLogger.info({ username }, 'Login attempt initiated');
    
    const loginRes = await axios.post(`${backendBaseUrl}/auth/login`, {
      username: username.trim(),
      password: password.trim(),
    });
    const data = loginRes.data;
    
    requestLogger.info({
      userId: data?.user?.id,
      username: username,
    }, 'Login successful');

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
    // Log backend API errors
    if (error.response) {
      requestLogger.error({
        err: error,
        type: 'backend_api_error',
        statusCode: error.response?.status,
        errorMessage: error.response?.data?.error || error.message,
        backendUrl: getBackendUrl(),
        responseData: error.response?.data,
        action: 'login_backend_api_failed',
      }, 'Backend API call failed during login');
    } else if (error.request) {
      requestLogger.error({
        err: error,
        type: 'backend_network_error',
        code: error.code,
        backendUrl: getBackendUrl(),
        action: 'login_backend_network_failed',
      }, 'Backend API network error during login');
    } else {
      requestLogger.error({
        err: error,
        type: 'login_error',
        message: error.message,
        action: 'login_request_failed',
      }, 'Login request failed');
    }
    
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

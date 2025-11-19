import { NextResponse } from "next/server";
import { serverTokenStorage } from "@/lib/tokenStorage";

/**
 * Get access token from httpOnly cookies
 * This endpoint allows client-side code to retrieve the token
 * (since httpOnly cookies cannot be read directly from JavaScript)
 */
export async function GET() {
  try {
    const accessToken = await serverTokenStorage.getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token found" },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Error fetching token:", error);
    return NextResponse.json(
      { error: "Failed to fetch token" },
      { status: 500 }
    );
  }
}


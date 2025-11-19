import { NextResponse } from "next/server";
import { serverTokenStorage } from "@/lib/tokenStorage";

export async function GET(req) {
  try {
    const accessToken = await serverTokenStorage.getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token found" },
        { status: 401 }
      );
    }

    // Return token or user info as needed
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { serverTokenStorage } from "@/lib/tokenStorage";

export async function POST() {
  // Determine storage type from environment variable
  const storageType = (
    process.env.NEXT_PUBLIC_TOKEN_STORAGE_TYPE || "localStorage"
  ).toLowerCase();
  
  // If using cookie storage, clear httpOnly cookies
  if (storageType === "cookie") {
    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );
    await serverTokenStorage.clearTokens(response);
    return response;
  }
  
  // For localStorage/sessionStorage, tokens are cleared client-side
  // This endpoint just confirms logout was successful
  return NextResponse.json(
    { message: "Logout successful" },
    { status: 200 }
  );
}

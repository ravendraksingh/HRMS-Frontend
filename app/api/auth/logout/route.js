import { NextResponse } from "next/server";

export async function POST() {
  // For sessionStorage mode, tokens are cleared client-side
  // This endpoint just confirms logout was successful
  return NextResponse.json(
    { message: "Logout successful" },
    { status: 200 }
  );
}

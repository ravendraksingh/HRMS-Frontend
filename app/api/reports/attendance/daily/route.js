import { authorizeRequest } from "@/lib/authorizeRequest";
import { fetchBackend } from "@/lib/fetchBackend";
import { NextResponse } from "next/server";

export async function GET(req) {
  const result = await authorizeRequest(req, {
    requiredRole: "admin",
  });

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const url = date ? `/reports/attendance/daily?date=${date}` : "/reports/attendance/daily";
    
    const res = await fetchBackend(url, {}, req);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


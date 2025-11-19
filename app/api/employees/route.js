import { authorizeRequest } from "@/lib/authorizeRequest";
import { fetchBackend } from "@/lib/fetchBackend";
import { NextResponse } from "next/server";

export async function GET(req) {
  const result = await authorizeRequest(req, {
    requiredRole: ["admin", "hr_manager"],
  });

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const res = await fetchBackend("/employees", {}, req);
    if (res.status >= 200 && res.status < 300) {
      return NextResponse.json(res.data, { status: res.status });
    } else {
      let errorMessage = "Failed to fetch employees";
      if (res.data) {
        const errorData = typeof res.data === "string" ? { error: res.data } : res.data;
        // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: res.status }
      );
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    const status = error.response?.status || 500;
    // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function POST(req) {
  const result = await authorizeRequest(req, {
    requiredRole: ["admin", "hr_manager"],
  });

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const res = await fetchBackend("/employees", {
      method: "POST",
      body: JSON.stringify(body),
    }, req);

    if (res.status >= 200 && res.status < 300) {
      return NextResponse.json(res.data, { status: res.status });
    } else {
      let errorMessage = "Non-ok response received";
      let errorData = null;
      if (res.data) {
        errorData = typeof res.data === "string" ? { error: res.data } : res.data;
        // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
        errorMessage =
          errorData.error || errorData.message || errorData.detail || errorMessage;
      }
      return NextResponse.json(
        { success: false, message: errorMessage, error: errorData },
        { status: res.status }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/employees:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

